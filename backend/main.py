import asyncio
import boto3
import hashlib
import hmac
import httpx
import json
import logging
import os
import string
import stripe
import secrets
import subprocess
import tempfile

from botocore.exceptions import ClientError
from database import (
    Invoice, get_prod_invoice_db, get_dev_invoice_db,
    RateLimit, get_prod_rate_limit_db, get_dev_rate_limit_db,
    ApiUsage, get_prod_api_usage_db, get_dev_api_usage_db,
    increment_api_usage
)
from datetime import datetime
from email_validator import validate_email, EmailNotValidError
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from mailersend import emails
from sqlalchemy import and_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

class Location:
    def __init__(self, valid, city, state, postal_code, country):
        self.valid = valid
        self.city = city
        self.state = state
        self.postal_code = postal_code
        self.country = country

    def in_colorado(self):
        return self.state == 'CO' and self.country == 'US'

btcpay_webhook_queue_map = {}
stripe_webhook_queue_map = {}
btcpay_webhook_lock = asyncio.Lock()
stripe_webhook_lock = asyncio.Lock()
invoice_lock = asyncio.Lock()
rate_limit_lock = asyncio.Lock()

s3_lifecycle_configured = False
FRONTEND_DEV_HTTP_URL = "http://localhost:5173"

product_list = [
    {
        "id": "fundamentals",
        "type": "guide",
        "description": "A concise, step-by-step guide to mushroom cultivation",
        "title": "Fundamentals of Mushroom Cultivation",
        "price": 0.00,
        "stripe_price_id": "",
        "file_list": [],
        "image": "/mush1.webp"
    }
]

def init_product_list(config):
    """
    Initialize the product list with configuration values.

    Args:
        config (dict): Configuration dictionary containing product pricing and IDs
    """
    deployment_type = config['deployment_type']

    for p in product_list:
        if p['id'] == 'fundamentals':
            p['price'] = config['fundamentals_price']
            p['stripe_price_id'] = config['fundamentals_stripe_price_id_prod'] if deployment_type == 'prod' else config['fundamentals_stripe_price_id_dev']
            p['file_list'] = config['fundamentals_s3_files']

def find_product(product_id):
    """
    Find a product by its ID.

    Args:
        product_id (str): The ID of the product to find

    Returns:
        dict: The product dictionary if found, None otherwise
    """
    for product in product_list:
        if product['id'] == product_id:
            return product
    return None

with open("config/config.json", 'r') as f:
    config = json.load(f)

    deployment_type = config['deployment_type']

    # BTCPay configs
    btcpay_url = config['btcpay_url']
    btcpay_store_id = config['btcpay_store_id']
    btcpay_api_key = config['btcpay_api_key']
    btcpay_webhook_secret = config['btcpay_webhook_secret']
    btcpay_invoice_expiration_minutes = config['btcpay_invoice_expiration_minutes']

    # Rate limit configs
    checkout_rate_limit = config['checkout_rate_limit']

    # Colorado GIS configs
    colorado_gis_url = config['colorado_gis_url']
    colorado_gis_key = config['colorado_gis_key']

    # Google maps configs
    google_maps_api_key = config['google_maps_api_key']
    google_maps_addr_validation_url = config['google_maps_addr_validation_url']

    # Stripe configs
    stripe.api_key = config['stripe_secret_key_prod'] if deployment_type == 'prod' else config['stripe_secret_key_dev']
    stripe_webhook_secret = config['stripe_webhook_secret_prod'] if deployment_type == 'prod' else config['stripe_webhook_secret_dev']

    # MailerSend configs
    mailersend_template_id = config['mailersend_template_id']
    mailersend_api_key = config['mailersend_api_key']

    # AWS configs
    aws_access_key_id = config['aws_access_key_id']
    aws_secret_access_key = config['aws_secret_access_key']
    aws_region = config['aws_region']
    s3_bucket_name = config['s3_bucket_name']
    s3_url_expiration_seconds = config.get('s3_url_expiration_seconds', 172800)  # Default: 2 days in seconds
    s3_url_expiration_days = s3_url_expiration_seconds // 86400

    init_product_list(config)

    frontend_url = config['frontend_url'] if deployment_type == "prod" else FRONTEND_DEV_HTTP_URL
    get_invoice_db = get_prod_invoice_db if deployment_type == "prod" else get_dev_invoice_db
    get_rate_limit_db = get_prod_rate_limit_db if deployment_type == "prod" else get_dev_rate_limit_db
    get_api_usage_db = get_prod_api_usage_db if deployment_type == "prod" else get_dev_api_usage_db


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s:%(funcName)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S'
)

log = logging.getLogger("mycomize-backend")

app = FastAPI()

#
# Helpers
#
def invoice_settled(invoice):
    """
    Check if an invoice is in the 'Settled' state.

    Args:
        invoice (Invoice): The invoice object to check

    Returns:
        bool: True if the invoice is settled, False otherwise
    """
    return invoice.order_state == "Settled"

def invoice_fulfilled(invoice):
    """
    Check if an invoice is in the 'Fulfilled' state.

    Args:
        invoice (Invoice): The invoice object to check

    Returns:
        bool: True if the invoice is fulfilled, False otherwise
    """
    return invoice.order_state == "Fulfilled"

def invoice_processing(invoice):
    """
    Check if an invoice is in the 'Processing Payment' state.

    Args:
        invoice (Invoice): The invoice object to check

    Returns:
        bool: True if the invoice is processing, False otherwise
    """
    return invoice.order_state == "Processing Payment"

def invoice_failed(invoice):
    """
    Check if an invoice is in the 'Failed' state.

    Args:
        invoice (Invoice): The invoice object to check

    Returns:
        bool: True if the invoice has failed, False otherwise
    """
    return invoice.order_state == "Failed"

def invoice_expired(invoice):
    """
    Check if an invoice is in the 'Expired' state.

    Args:
        invoice (Invoice): The invoice object to check

    Returns:
        bool: True if the invoice has expired, False otherwise
    """
    return invoice.order_state == "Expired"

def invoice_canceled(invoice):
    """
    Check if an invoice is in the 'Canceled' state.

    Args:
        invoice (Invoice): The invoice object to check

    Returns:
        bool: True if the invoice is canceled, False otherwise
    """
    return invoice.order_state == "Canceled"

def create_order_id(length=8):
    """
    Create a random order ID consisting of uppercase letters and digits.

    Args:
        length (int, optional): The length of the order ID. Defaults to 8.

    Returns:
        str: A random order ID
    """
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

async def fulfill_order(email, order_id, product_id, type, api_usage_db):
    """
    Fulfill an order by creating presigned URLs and sending an email to the customer.

    Args:
        email (str): Customer's email address
        order_id (str): Unique order identifier
        product_id (str): ID of the product being purchased

    Returns:
        bool: True if the order was successfully fulfilled, False otherwise
    """
    product = find_product(product_id)
    if product is None:
        log.error(f"failed to find product with id={product_id} for email={email}, order_id={order_id}")
        return False

    presigned_url_list = create_presigned_url_list(email, order_id, product)

    if presigned_url_list is None:
        log.error(f"failed to create presigned URLs with id={product_id} for email={email}, order_id={order_id}")
        return False

    return await send_email(email, order_id, presigned_url_list, product, type, api_usage_db)

def create_presigned_url_list(email, order_id, product):
    """
    Generate a presigned URL for a customer to access their purchased guide.

    Args:
        email (str): Customer's email address
        order_id (str): Unique order identifier
        product (obj): Guide being purchased

    Returns:
        str: Presigned URL or None if there was an error
    """
    global s3_lifecycle_configured

    try:
        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            region_name=aws_region,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )

        # Create a unique object key for this customer
        email_hash = hashlib.md5(email.encode()).hexdigest()
        url_list = []

        for product_file in product['file_list']:
            customer_file = f"{deployment_type}/{product['id']}/customers/{email_hash}/{order_id}/{product_file}"

            # Copy the guide to the customer-specific location
            s3_client.copy_object(
                Bucket=s3_bucket_name,
                CopySource={'Bucket': s3_bucket_name, 'Key': product_file},
                Key=customer_file
            )

            # Generate a presigned URL for the customer-specific object
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': s3_bucket_name,
                    'Key': customer_file
                },
                ExpiresIn=s3_url_expiration_seconds
            )

            log.info(f"created presigned URL that expires in {s3_url_expiration_seconds} seconds for email={email}, order_id={order_id} (customer_file={customer_file})")
            url_list.append(presigned_url)

        if not s3_lifecycle_configured:
            prefix=f"{deployment_type}/{product['id']}/customers/"

            s3_client.put_bucket_lifecycle_configuration(
                Bucket=s3_bucket_name,
                LifecycleConfiguration={
                    'Rules': [
                        {
                            'Expiration': {'Days': s3_url_expiration_days + 1},
                            'ID': 'expire-3-days',
                            'Filter': {'Prefix': prefix},
                            'Status': 'Enabled',
                        },
                    ],
                },
            )

            s3_lifecycle_configured = True

        return url_list

    except ClientError as e:
        log.error(f"error creating presigned URL: {e}")
        return None
    except Exception as e:
        log.error(f"unexpected error creating presigned URL: {e}")
        return None

async def send_email(email, order_id, presigned_url_list, product, type, api_usage_db):
    """
    Send an email to the customer with their presigned URLs.

    Args:
        email (str): Customer's email address
        order_id (str): Unique order identifier
        presigned_url_list (list): Presigned URL for accessing the guide
        product (dict): Product information including title
        type (str): Type of payment (btc or stripe)
        api_usage_db (Session): API usage database session

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # send email containing link to access the guide
    # return success/fail
    log.info(f"fulfilling order for email={email}, order_id={order_id}, product_id={product['id']}, type={type}")

    pdf_link = ""
    epub_link = ""

    for url in presigned_url_list:
        if ".pdf?" in url:
            pdf_link = url
        elif ".epub?" in url:
            epub_link = url
        else:
            log.warning(f"unsupported file type: {url}")

    mailer = emails.NewEmail(mailersend_api_key)
    mail_body = {}

    mail_from = {
        "name": "Connor",
        "email": "connor@mycomize.com",
    }

    recipients  = [{
        "email": email
    }]

    personalization = [
        {
            "email": email,
            "data": {
                "product_name": product['title'],
                "order_id": order_id,
                "pdf_link": pdf_link,
                "epub_link": epub_link,
                "support_email": "connor@mycomize.com"
            }
        }
    ]

    mailer.set_mail_from(mail_from, mail_body)
    mailer.set_mail_to(recipients, mail_body)
    mailer.set_template(mailersend_template_id, mail_body)
    mailer.set_personalization(personalization, mail_body)

    response = mailer.send(mail_body).replace('\n', ' ')

    # Track email API call
    count, is_milestone = await increment_api_usage(api_usage_db, 'mailersend_api')
    if is_milestone:
        log.warning(f"Mailersend API call count reached {count} count milestone")

    if "200" in response or "202" in response:
        log.info(f"sent fulfillment email to {email}, type={type}")
        return True
    else:
        log.error(f"failed to send fulfillment email to {email}, pdf_link={pdf_link}, epub_link={epub_link}, type={type}, (response={response})")
        return False

async def validate_location(city, state, postal_code, country, api_usage_db):
    url = google_maps_addr_validation_url + f"?key={google_maps_api_key}"

    headers = {
        "Content-Type": "application/json",
    }

    data = {
        "address": {
            "regionCode": country,
            "addressLines": [f"{city}, {state} {postal_code}"]
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)

    # Track API call to address validation service
    count, is_milestone = await increment_api_usage(api_usage_db, 'google_maps_addr_validation_api')
    if is_milestone:
        log.warning(f"Address validation API call count reached {count} count milestone")

    if response.status_code == 200:
        data = response.json()

        valid = True
        component_list = data['result']['address']['addressComponents']

        for component in component_list:
            if component['confirmationLevel'] != 'CONFIRMED':
                valid = False
                break

        if valid and len(component_list) != 4:
            valid = False

        if valid:
            city = data['result']['address']['postalAddress']['locality']
            state = data['result']['address']['postalAddress']['administrativeArea']
            postal_code = data['result']['address']['postalAddress']['postalCode']
            country = data['result']['address']['postalAddress']['regionCode']

            log.info(f"validated address: city={city}, state={state}, postal_code={postal_code}, country={country}")
        else:
            log.warning(f"failed to validateAddress: city={city}, state={state}, postal_code={postal_code}, country={country} (status_code={response.status_code})")

        return Location(valid, city, state, postal_code, country)
    else:
        log.warning(f"failed to validateAddress: city={city}, state={state}, postal_code={postal_code}, country={country} (status_code={response.status_code})")

    return Location(False, city, state, postal_code, country)

async def compute_sales_tax(location):
    """
    Compute the sales tax for a given location.

    Args:
        location (Location): A valid location

    Returns:
        float: The computed sales tax rate
    """

    if not location.in_colorado():
        return 0.00

    city = location.city
    state = location.state
    zipcode = location.postal_code

    url = colorado_gis_url

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {colorado_gis_key}"
    }

    data = {
        "address": f"{city}, {state} {zipcode}"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)

    if response.status_code == 200:
        data = response.json()
        sales_tax = data['totalSalesTax']
        log.info(f"computed colorado sales tax: city={city}, state={state}, zipcode={zipcode}, sales_tax={sales_tax}")
        return sales_tax
    else:
        log.error(f"failed to compute colorado sales tax: city={city}, state={state}, zipcode={zipcode}, (status_code={response.status_code})")
    return -1.00

async def rate_limit_exceeded(email, product_id, limit, rate_limit_db):
    count = 0

    async with rate_limit_lock:
        rate_limit = rate_limit_db.query(RateLimit).filter(and_(RateLimit.email == email, RateLimit.product_id == product_id)).first()

        if rate_limit is None:
            rate_limit = RateLimit(email=email, product_id=product_id, request_count=0)
            rate_limit_db.add(rate_limit)
            rate_limit_db.commit()
            count = 1
        else:
            if rate_limit.request_count < limit:
                rate_limit.request_count += 1
                rate_limit_db.commit()

            count = rate_limit.request_count

    log.info(f"checkout rate limit: email={email}, product_id={product_id}, count={count}")

    return count >= limit

async def create_btcpay_invoice(customer_email, order_id, product, sales_tax, location):
    """
    Create a new invoice in BTCPay Server.

    Args:
        customer_email (str): Customer's email address
        order_id (str): Unique order identifier
        product (dict): Product information including price and title
        sales_tax (float): Sales tax as a percentage
        location (Location): Customer's location

    Returns:
        dict: The created invoice data if successful, or an error dictionary
    """
    url = f"{btcpay_url}/api/v1/stores/{btcpay_store_id}/invoices"

    headers = {
        "Authorization": f"token {btcpay_api_key}",
        "Content-Type": "application/json"
    }

    total_tax = sales_tax * product['price']

    data = {
        "metadata": {
            "buyerEmail": customer_email,
            "buyerCity": location.city,
            "buyerState": location.state,
            "buyerZip": location.postal_code,
            "buyerCountry": location.country,
            "itemDesc": product['title'],
            "orderId": order_id,
            "taxIncluded": total_tax,
            "posData": {
               "sub_total": product['price'],
               "total": product['price'] + total_tax
            }
        },
        "checkout": {
            "speedPolicy": "MediumSpeed", # 1 confirmation
            "paymentMethods": ["BTC", "BTC-LightningNetwork"],
            "expirationMinutes": btcpay_invoice_expiration_minutes,
            "redirectURL": frontend_url + "/order-status?type=btc&order_id=" + order_id + "&invoice_id={InvoiceId}",
            "redirectAutomatically": True,
        },
        "amount": str(round(product['price'] + total_tax, 2)),
        "currency": "USD"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)

    if response.status_code == 200:
        return response.json()
    else:
        if response.status_code == 400:
            data = response.json()
            log.error(f"create invoice failed: path={data[0]} message={data[1]} email={customer_email}")
        elif response.status_code == 403:
            log.error(f"create invoice failed: authenticated but forbidden to add invoices, email={customer_email}")
        return {"error": "error_create_btcpay_invoice_failed"}

def verify_btcpay_webhook(body_bytes, btcpay_sig_str, webhook_secret_str):
    """
    Verify the signature of a BTCPay webhook request.

    Args:
        body_bytes (bytes): The raw body of the webhook request
        btcpay_sig_str (str): The signature provided in the BTCPay-Sig header
        webhook_secret_str (str): The webhook secret used to verify the signature

    Returns:
        bool: True if the signature is valid, False otherwise
    """
    computed_hash = hmac.new(
        bytes(webhook_secret_str, 'utf-8'),
        body_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

    computed_hash = "sha256=" + computed_hash
    return hmac.compare_digest(computed_hash, btcpay_sig_str)

async def checkout_btc(email, order_id, invoice_db, product, city, state, zipcode, country, api_usage_db):
    """
    Process a Bitcoin checkout request.

    Args:
        email (str): Customer's email address
        order_id (str): Unique order identifier
        invoice_db (Session): Database session
        product (dict): Product information

    Returns:
        dict: Response containing checkout link or error information
    """
    try:
        invoice = invoice_db.query(Invoice).filter(Invoice.email == email).first()

        if invoice:
            async with invoice_lock:
                if invoice.payment_type == 'btc':
                    if invoice_settled(invoice) or invoice_fulfilled(invoice):
                        return {"order_state": invoice.order_state}
                    elif invoice_processing(invoice):
                        return {"checkout_link": invoice.checkout_link}
                    else: # Failed or Expired or Canceled
                        log.warning(f"invoice (btcpay): invoice_id={invoice.btcpay_invoice_id} state={invoice.btcpay_invoice_state} email={email} (failed/expired) deleting from DB")
                        invoice_db.delete(invoice)
                        invoice_db.commit()
                else:
                    log.error(f"invoice (btcpay): email={email} already has a stripe invoice. Only one payment type supported")
                    return {"error": "error_only_one_payment_type_supported"}

        location = await validate_location(city, state, zipcode, country, api_usage_db)
        if not location.valid:
            return {"error": "error_invalid_location"}

        sales_tax = await compute_sales_tax(location)
        if sales_tax < 0.00:
            return {"error": "error_compute_sales_tax_failed"}

        invoice = await create_btcpay_invoice(email, order_id, product, sales_tax, location)
        if "error" in invoice:
            return invoice

        invoice_id = invoice["id"]
        invoice_state = invoice["status"]

        log.info(f"invoice (btcpay): order_id={order_id} invoice_id={invoice_id} state={invoice_state} email={email} (new)")

        invoice_db_entry = Invoice(email=email,
                                   payment_type='btc',
                                   order_id=order_id,
                                   order_state="Processing Payment",
                                   checkout_link=invoice["checkoutLink"],
                                   product_id=product['id'],
                                   created_at_time=datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                                   btcpay_invoice_id=invoice_id,
                                   btcpay_invoice_state=invoice_state,
                                   btcpay_city=location.city,
                                   btcpay_state=location.state,
                                   btcpay_postal_code=location.postal_code,
                                   btcpay_country=location.country,
                                   btcpay_sales_tax=sales_tax)

        invoice_db.add(invoice_db_entry)
        invoice_db.commit()

        async with btcpay_webhook_lock:
            if invoice_id not in btcpay_webhook_queue_map:
                btcpay_webhook_queue_map[invoice_id] = asyncio.Queue()

        return { "checkout_link": invoice["checkoutLink"] }
    except SQLAlchemyError as e:
        log.error(f"error_invoice_db_btc: {e}, email={email}")
        return {"error": f"error_invoice_db_btc: {e}"}
    except Exception as e:
        log.error(f"error_checkout_btc: {e}, email={email}")
        return {"error": f"error_checkout_btc"}

async def checkout_stripe(email, order_id, invoice_db, product):
    """
    Process a Stripe checkout request.

    Args:
        email (str): Customer's email address
        order_id (str): Unique order identifier
        invoice_db (Session): Database session
        product (dict): Product information

    Returns:
        dict: Response containing checkout link or error information
    """
    try:
        invoice = invoice_db.query(Invoice).filter(Invoice.email == email).first()
        log.info(f"checkout_stripe: got invoice")

        if invoice:
            async with invoice_lock:
                if invoice.payment_type == 'stripe':
                    if invoice_fulfilled(invoice) or invoice_settled(invoice):
                        return { "order_state": invoice.order_state }
                    elif invoice_processing(invoice):
                        return { "checkout_link": invoice.checkout_link }
                    else: # Failed or Expired or Canceled
                        log.warning(f"invoice (stripe): session_id={invoice.stripe_session_id} state={invoice.stripe_invoice_state} email={email} (failed/expired) deleting from DB")
                        invoice_db.delete(invoice)
                        invoice_db.commit()
                else:
                    log.error(f"invoice (stripe): email={email} already has a btc invoice. Only one payment type supported")
                    return {"error": "error_only_one_payment_type_supported"}

        success_url = frontend_url + "/order-status?type=stripe&order_id=" + order_id + "&session_id={CHECKOUT_SESSION_ID}"
        cancel_url = frontend_url + "/guides"

        log.info(f"checkout_stripe: Creating session")

        checkout_session = stripe.checkout.Session.create(
            line_items=[{"price": product['stripe_price_id'], "quantity": 1}], # assumes one product
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=email,
            metadata={"order_id": order_id},
            automatic_tax={"enabled": True}
        )

        session_id = checkout_session.id
        invoice_state = checkout_session.payment_status

        log.info(f"invoice (stripe): order_id={order_id} session_id={session_id} state={invoice_state} email={email} (new)")

        invoice_db_entry = Invoice(email=email,
                           payment_type='stripe',
                           order_id=order_id,
                           order_state="Processing Payment",
                           checkout_link=checkout_session.url,
                           product_id=product['id'],
                           created_at_time=datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                           stripe_session_id=session_id,
                           stripe_invoice_state=invoice_state)
        invoice_db.add(invoice_db_entry)
        invoice_db.commit()

        async with stripe_webhook_lock:
            if session_id not in stripe_webhook_queue_map:
                stripe_webhook_queue_map[session_id] = asyncio.Queue()

        return { "checkout_link": checkout_session.url }
    except SQLAlchemyError as e:
        log.error(f"error_invoice_db_stripe: {e}, email={email}")
        return {"error": f"error_invoice_db_stripe: {e}"}
    except Exception as e:
        log.error(f"error_checkout_stripe: {e}, email={email}")
        return {"error": f"error_checkout_stripe"}

#
# API Endpoints
#
@app.post("/checkout")
async def checkout(request: Request, invoice_db: Session = Depends(get_invoice_db), rate_limit_db: Session = Depends(get_rate_limit_db), api_usage_db: Session = Depends(get_api_usage_db)):
    """
    Handle checkout requests for both Bitcoin and Stripe payments.

    Args:
        request (Request): The HTTP request
        invoice_db (Session): Database session

    Returns:
        dict: Response containing checkout link, order state, or error information
    """
    body = await request.json()
    payment_type = body.get('type', '')
    product_id = body.get('id', '')
    customer_email = body.get('email', '')
    customer_city = body.get('city', '')
    customer_state = body.get('state', '')
    customer_zipcode = body.get('zipcode', '')
    customer_country = body.get('country', '')

    log.info(f"POST: /checkout: payment_type={payment_type} customer_email={customer_email}")

    if payment_type != 'btc' and  payment_type != 'stripe':
        log.error(f"POST: /checkout: error_invalid_payment_type: {payment_type}")
        return {"error": "error_invalid_payment_type"}

    product = find_product(product_id)
    if product is None:
        log.error(f"POST: /checkout: error_invalid_product_id: {product_id}")
        return {"error": "error_invalid_product_id"}

    try:
        email_info = validate_email(customer_email, check_deliverability=True)
        customer_email = email_info.normalized
    except EmailNotValidError as e:
        log.error(f"POST: /checkout: error_invalid_email: {e}")
        return {"error": "error_invalid_email"}

    if await rate_limit_exceeded(customer_email, product_id, checkout_rate_limit, rate_limit_db):
        log.error(f"POST: /checkout: error_rate_limit_exceeded: email={customer_email}, product_id={product_id} ip={request.client.host}")
        return {"error": "error_checkout_rate_limit_exceeded"}

    order_id = create_order_id()

    if payment_type == 'btc':
        return await checkout_btc(customer_email,
                                  order_id,
                                  invoice_db,
                                  product,
                                  customer_city,
                                  customer_state,
                                  customer_zipcode,
                                  customer_country,
                                  api_usage_db)

    if payment_type == 'stripe':
        # Stripe handles location and sales tax for us
        return await checkout_stripe(customer_email, order_id, invoice_db, product)

@app.post("/stripe-webhook")
async def stripe_webhook(request: Request, invoice_db: Session = Depends(get_invoice_db), api_usage_db: Session = Depends(get_api_usage_db)):
    """
    Handle Stripe webhook events.

    Args:
        request (Request): The HTTP request containing the webhook data
        invoice_db (Session): Database session

    Returns:
        dict: Response indicating success or error
    """
    stripe_sig = request.headers.get('Stripe-Signature')
    body = await request.body()

    if not stripe_sig:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        # Verify the webhook signature
        event = stripe.Webhook.construct_event(body, stripe_sig, stripe_webhook_secret)
    except ValueError as e:
        # Invalid payload
        log.error(f"POST: /stripe-webhook: error_invalid_payload: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        log.error(f"POST: /stripe-webhook: error_invalid_signature: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid signature: {e}")

    if event['type'] == 'radar.early_fraud_warning.created':
        efw = event['data']['object']
        log.warning(f"Stripe early fraud warning: id={efw.id} charge_id={efw.charge} actionable={efw.actionable} fraud_type={efw.fraud_type}")
        try:
            refund = stripe.Refund.create(charge=efw.charge, reason="fraudulent")
            log.warning(f"Auto-refunded charge {efw.charge}: refund_id={refund.id}")
        except Exception as e:
            log.error(f"Failed to auto-refund charge {efw.charge}: {str(e)}")

        return {"status": "success", "message": "Webhook processed successfully"}

    session_id = event['data']['object']['id']
    payment_state = event['data']['object']['payment_status']
    email = event['data']['object']['customer_email']
    invoice = invoice_db.query(Invoice).filter(Invoice.email == email).first()

    log.info(f"stripe webhook: payment_state={payment_state} email={email}")

    if event['type'] == 'checkout.session.completed' or event['type'] == 'checkout.session.async_payment_succeeded':
        if invoice:
            async with invoice_lock:
                invoice_state = invoice.stripe_invoice_state
                if invoice_state == 'paid':
                    log.info(f"invoice (stripe): received webhook {event['type']} but state={invoice_state}. Doing nothing. email={email}")
                    return {"status": "success", "message": "Invoice already paid"}

                invoice.stripe_invoice_state = payment_state
                log.info(f"invoice (stripe): state updated to {payment_state} for {email}")

                if payment_state == 'paid':
                    invoice.order_state = "Settled"
                    success = await fulfill_order(email, invoice.order_id, invoice.product_id, "stripe", api_usage_db)

                    if success:
                        invoice.order_state = 'Fulfilled'
                        invoice.fulfillment_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
                    else:
                        log.error(f"failed to fulfill stripe order for email={email}, order_id={invoice.order_id}")
                else: # unpaid
                    invoice.order_state = "Canceled"

                invoice_db.commit()

                # Notify the frontend
                async with stripe_webhook_lock:
                    queue = stripe_webhook_queue_map[session_id]
                    await queue.put({"order_state": invoice.order_state})
        else:
            log.warning(f"received webhook {event['type']} for {email} not present in invoices DB")

        return {"status": "success", "message": "Webhook processed successfully"}

    elif event['type'] == 'checkout.session.async_payment_failed':
        if invoice:
            async with invoice_lock:
                invoice_state = invoice.stripe_invoice_state
                if invoice_state == 'paid':
                    log.info(f"invoice (stripe): received webhook {event['type']} but state={invoice_state}. Doing nothing. email={email}")
                    return {"status": "success", "message": "Invoice already paid"}

                invoice.order_state = "Failed"
                invoice_db.commit()

                # Notify the frontend
                async with stripe_webhook_lock:
                    queue = stripe_webhook_queue_map[session_id]
                    await queue.put({"order_state": invoice.order_state})
        else:
            log.warning(f"Received webhook {event['type']} for {email} not present in invoices DB")
        return {"status": "success", "message": "Webhook processed successfully"}
    else: # checkout.session.expired
        if invoice:
            async with invoice_lock:
                invoice_state = invoice.stripe_invoice_state
                if invoice_state == 'paid':
                    log.info(f"invoice (stripe): received webhook {event['type']} but state={invoice_state}. Doing nothing. email={email}")
                    return {"status": "success", "message": "Invoice already paid"}

                invoice.order_state = "Expired"
                invoice_db.commit()

                # Notify the frontend
                async with stripe_webhook_lock:
                    queue = stripe_webhook_queue_map[session_id]
                    await queue.put({"order_state": invoice.order_state})
        else:
            log.warning(f"Received webhook {event['type']} for {email} not present in invoices DB")
        return {"status": "success", "message": "Webhook processed successfully"}

async def dequeue_stripe_webhook_data(session_id: str, invoice_db):
    """
    Stream Stripe webhook events to the client.

    Args:
        session_id (str): The Stripe session ID to get events for
        invoice_db (Session): Invoice database session

    Yields:
        str: Server-sent event data
    """
    if session_id == None or session_id == "":
        yield f"event: error\ndata: session_id is empty\n\n"

    while True:
        queue_empty = True
        try:
            async with stripe_webhook_lock:
                if session_id in stripe_webhook_queue_map:
                    queue_empty = False
                    queue = stripe_webhook_queue_map[session_id]
                    data = await asyncio.wait_for(queue.get(), timeout=0.5)
                    yield f"data: {json.dumps(data)}\n\n"
                    invoice_db.expire_all()
        except asyncio.TimeoutError:
            invoice = invoice_db.query(Invoice).filter(Invoice.stripe_session_id == session_id).first()
            if invoice:
                async with invoice_lock:
                    data = {"order_state": invoice.order_state}
                    yield f"data: {json.dumps(data)}\n\n"
            else:
                yield f"event: error\ndata: queue timeout stripe webhook\n\n"
        except asyncio.CancelledError:
            invoice = invoice_db.query(Invoice).filter(Invoice.stripe_session_id == session_id).first()
            if invoice:
                async with invoice_lock:
                    data = {"order_state": invoice.order_state}
                    yield f"data: {json.dumps(data)}\n\n"
            else:
                yield f"event: error\ndata: queue cancelled stripe webhook\n\n"

        if queue_empty:
            invoice = invoice_db.query(Invoice).filter(Invoice.stripe_session_id == session_id).first()
            if invoice:
                async with invoice_lock:
                    data = {"order_state": invoice.order_state}
                    yield f"data: {json.dumps(data)}\n\n"
            else:
                yield f"event: error\ndata: session_id {session_id} not found\n\n"

        await asyncio.sleep(2.0)


@app.get("/stripe-webhook-events")
async def stripe_webhook_events(session_id: str, invoice_db: Session = Depends(get_invoice_db)):
    """
    Endpoint to stream Stripe webhook events to the client.

    Args:
        session_id (str): The Stripe session ID to get events for
        invoice_db (Session): Invoice db session

    Returns:
        StreamingResponse: Server-sent events stream
    """
    return StreamingResponse(dequeue_stripe_webhook_data(session_id, invoice_db), media_type="text/event-stream")

@app.post("/btcpay-webhook")
async def btcpay_webhook(request: Request, invoice_db: Session = Depends(get_invoice_db), api_usage_db: Session = Depends(get_api_usage_db)):
    """
    Handle BTCPay webhook events.

    Args:
        request (Request): The HTTP request containing the webhook data
        invoice_db (Session): Database session
    """
    btcpay_sig_str = request.headers.get('BTCPay-Sig')
    body_bytes = await request.body()

    if verify_btcpay_webhook(body_bytes, btcpay_sig_str, btcpay_webhook_secret):
        json = await request.json()
        state = json['type']
        invoice_id = json['invoiceId']
        metadata = json['metadata']
        email = metadata['buyerEmail']
        invoice = invoice_db.query(Invoice).filter(Invoice.email == email).first()

        log.info(f"btcpay webhook: state={state} invoice_id={invoice_id} metadata={metadata} email={email}")

        if invoice:
            async with invoice_lock:
                invoice_state = invoice.btcpay_invoice_state
                if invoice_state == "InvoiceSettled":
                    log.warning(f"invoice (btcpay): received webhook {state} but state={invoice_state}. Doing nothing. email={email}")
                    return

                invoice.btcpay_invoice_state = state
                log.info(f"invoice (btcpay): state updated to {state} for {email}")

                if state == "InvoiceSettled":
                    invoice.order_state = "Settled"
                    success = await fulfill_order(email, invoice.order_id, invoice.product_id, "btc", api_usage_db)

                    if success:
                        invoice.order_state = "Fulfilled"
                        invoice.fulfillment_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
                    else:
                        log.error(f"failed to fulfill btcpay order for email={email}, order_id={invoice.order_id}")
                elif state == "InvoiceExpired":
                    invoice.order_state = "Expired"
                elif state == "InvoiceInvalid":
                    invoice.order_state = "Failed"

                invoice_db.commit()

                # Notify the frontend of the state change
                async with btcpay_webhook_lock:
                    queue = btcpay_webhook_queue_map[invoice_id]
                    await queue.put({"order_state": invoice.order_state})
        else:
            log.warning(f"received webhook {state} for {email} not present in invoices DB")
    else:
        log.warning(f"btcpay webhook HMAC verification failed")

async def dequeue_btcpay_webhook_data(invoice_id: str, invoice_db):
    """
    Stream BTCPay webhook events to the client.

    Args:
        invoice_id (str): The BTCPay invoice ID to get events for
        invoice_db (Sesstion): Invoice database session

    Yields:
        str: Server-sent event data
    """
    if not invoice_id:
        yield f"event: error\ndata: invoice_id is empty\n\n"

    while True:
        queue_empty = True
        try:
            async with btcpay_webhook_lock:
                if invoice_id in btcpay_webhook_queue_map:
                    queue_empty = False
                    queue = btcpay_webhook_queue_map[invoice_id]
                    data = await asyncio.wait_for(queue.get(), timeout=0.5)
                    yield f"data: {json.dumps(data)}\n\n"
                    invoice_db.expire_all()
        except asyncio.TimeoutError:
            invoice = invoice_db.query(Invoice).filter(Invoice.btcpay_invoice_id == invoice_id).first()
            if invoice:
                async with invoice_lock:
                    data = {"order_state": invoice.order_state}
                    yield f"data: {json.dumps(data)}\n\n"
            else:
                yield f"event: error\ndata: queue timeout btcpay webhook\n\n"
        except asyncio.CancelledError:
            invoice = invoice_db.query(Invoice).filter(Invoice.btcpay_invoice_id == invoice_id).first()
            if invoice:
                async with invoice_lock:
                    data = {"order_state": invoice.order_state}
                    yield f"data: {json.dumps(data)}\n\n"
            else:
                yield f"event: error\ndata: queue cancelled btcpay webhook\n\n"

        if queue_empty:
            invoice = invoice_db.query(Invoice).filter(Invoice.btcpay_invoice_id == invoice_id).first()
            if invoice:
                async with invoice_lock:
                    data = {"order_state": invoice.order_state}
                    yield f"data: {json.dumps(data)}\n\n"
            else:
                yield f"event: error\ndata: invoice_id {invoice_id} not found\n\n"

        await asyncio.sleep(2.0)

@app.get("/btcpay-webhook-events")
async def btcpay_webhook_events(invoice_id: str, invoice_db: Session = Depends(get_invoice_db)):
    """
    Stream BTCPay webhook events to the client.

    Args:
        invoice_id (str): The BTCPay invoice ID to get events for

    Returns:
        StreamingResponse: Server-sent events stream
    """
    return StreamingResponse(dequeue_btcpay_webhook_data(invoice_id, invoice_db), media_type="text/event-stream")

@app.get("/guides")
async def get_guides():
    """
    Get a list of available guides.

    Returns:
        dict
    """
    print(f"GET: /guides")
    guide_list = []

    for product in product_list:
        if product['type'] == 'guide':
            guide = {
                "id": product['id'],
                "title": product['title'],
                "description": product['description'],
                "price": product['price'],
                "image": product['image']
            }
            guide_list.append(guide)

    return {"guides": guide_list}

@app.get("/access-report")
async def get_access_report(api_key: str):
    """
    Generate an HTML report of nginx access logs using GoAccess.
    Requires API key for authentication.

    Args:
        api_key (str): API key for authentication

    Returns:
        StreamingResponse: HTML report generated by GoAccess
    """
    # Check API key using constant-time comparison to prevent timing attacks
    if 'mycomize_api_key' not in config or not hmac.compare_digest(api_key, config['mycomize_api_key']):
        log.warning(f"Invalid API key used to access nginx logs report")
        raise HTTPException(status_code=401, detail="Invalid API key")

    log.info(f"GET: /access-report: Generating GoAccess report")

    try:
        # Create a temporary file to store the report
        with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as temp_file:
            report_path = temp_file.name

        # Run GoAccess to generate the HTML report
        nginx_log_path = "/var/log/nginx/access.log"
        
        # Check if the log file exists
        if not os.path.exists(nginx_log_path):
            log.error(f"Nginx log file not found at {nginx_log_path}")
            raise HTTPException(status_code=500, detail="Nginx log file not found")
            
        # Execute GoAccess with the specified log file and output path
        process = subprocess.run(
            [
                "goaccess", 
                nginx_log_path, 
                "-o", report_path, 
                "--log-format=COMBINED"
            ],
            check=True,
            capture_output=True
        )
        
        if process.returncode != 0:
            log.error(f"GoAccess failed: {process.stderr.decode()}")
            raise HTTPException(status_code=500, detail="Failed to generate access report")
        
        # Read the generated HTML report
        with open(report_path, 'r') as f:
            report_content = f.read()
            
        # Delete the temporary file
        os.unlink(report_path)
        
        # Return the HTML content as a response
        return StreamingResponse(
            iter([report_content]), 
            media_type="text/html"
        )
    
    except subprocess.CalledProcessError as e:
        log.error(f"GoAccess command failed: {e.stderr.decode() if e.stderr else str(e)}")
        raise HTTPException(status_code=500, detail=f"GoAccess command failed: {str(e)}")
    except Exception as e:
        log.error(f"Error generating access report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating access report: {str(e)}")

@app.get("/invoice-stats")
async def get_invoice_stats(api_key: str,
                           invoice_db: Session = Depends(get_invoice_db),
                           api_usage_db: Session = Depends(get_api_usage_db)):
    """
    Get invoice statistics including count by state, monthly totals, sales by location,
    and API usage statistics. Requires API key for authentication.

    Args:
        api_key (str): API key for authentication
        invoice_db (Session): Invoice database session
        api_usage_db (Session): API usage database session

    Returns:
        dict: Invoice and API usage statistics
    """
    # Check API key using constant-time comparison to prevent timing attacks
    if 'mycomize_api_key' not in config or not hmac.compare_digest(api_key, config['mycomize_api_key']):
        log.warning(f"Invalid API key used to access invoice stats")
        raise HTTPException(status_code=401, detail="Invalid API key")

    log.info(f"GET: /invoice-stats: Retrieving invoice statistics")

    try:
        # Get all invoices
        invoices = invoice_db.query(Invoice).all()

        # Count by state
        state_counts = {
            "Settled": 0,
            "Fulfilled": 0,
            "Processing Payment": 0,
            "Failed": 0,
            "Expired": 0,
            "Canceled": 0
        }

        # Get current month and year for monthly sales calculation
        current_month = datetime.now().month
        current_year = datetime.now().year
        current_date = datetime.now().date()

        # Monthly sales totals
        monthly_sales = 0.0

        # Sales by address for BTCPay invoices
        btc_sales_by_address = {}

        # Process each invoice
        for invoice in invoices:
            # Count by state
            if invoice.order_state in state_counts:
                state_counts[invoice.order_state] += 1

            # Process if it's a fulfilled sale
            if invoice_fulfilled(invoice) and invoice.fulfillment_time:
                # Find the product to get its price
                product = find_product(invoice.product_id)
                if product:
                    # Check if it's from the current month based on fulfillment_time
                    fulfillment_date = datetime.strptime(invoice.fulfillment_time, "%Y-%m-%dT%H:%M:%S")
                    if fulfillment_date.month == current_month and fulfillment_date.year == current_year:
                        monthly_sales += product['price']

                    # For BTCPay invoices, track sales by address
                    if invoice.payment_type == 'btc' and hasattr(invoice, 'btcpay_city') and invoice.btcpay_city:
                        # Create a unique address key
                        address_key = f"{invoice.btcpay_city}, {invoice.btcpay_state}, {invoice.btcpay_postal_code}, {invoice.btcpay_country}"

                        if address_key not in btc_sales_by_address:
                            btc_sales_by_address[address_key] = {
                                "city": invoice.btcpay_city,
                                "state": invoice.btcpay_state,
                                "postal_code": invoice.btcpay_postal_code,
                                "country": invoice.btcpay_country,
                                "total_sales": 0.0,
                                "total_sales_tax": 0.0,
                                "invoice_count": 0
                            }

                        btc_sales_by_address[address_key]["total_sales"] += product['price']
                        btc_sales_by_address[address_key]["total_sales_tax"] += invoice.btcpay_sales_tax
                        btc_sales_by_address[address_key]["invoice_count"] += 1

        # Get API usage statistics for current month
        api_usage_stats = {}

        # Get address validation and email sending counts for current month
        google_maps_addr_validation_api = api_usage_db.query(ApiUsage).filter(
            ApiUsage.api_type == 'google_maps_addr_validation_api',
            ApiUsage.date.between(datetime(current_year, current_month, 1).date(), current_date)
        ).all()

        mailersend_api = api_usage_db.query(ApiUsage).filter(
            ApiUsage.api_type == 'mailersend_api',
            ApiUsage.date.between(datetime(current_year, current_month, 1).date(), current_date)
        ).all()

        # Calculate monthly totals
        if len(google_maps_addr_validation_api) > 0:
            google_maps_addr_validation_api_count = sum(entry.count for entry in google_maps_addr_validation_api)
        else:
            google_maps_addr_validation_api_count = 0

        if len(mailersend_api) > 0:
            mailersend_api_count = sum(entry.count for entry in mailersend_api)
        else:
            mailersend_api_count = 0

        api_usage_stats = {
            "google_maps_addr_validation_api": {
                "monthly_count": google_maps_addr_validation_api_count,
                "daily_breakdown": [{"date": entry.date.isoformat(), "count": entry.count} for entry in google_maps_addr_validation_api]
            },
            "mailersend_api": {
                "monthly_count": mailersend_api_count,
                "daily_breakdown": [{"date": entry.date.isoformat(), "count": entry.count} for entry in mailersend_api]
            }
        }

        # Prepare the response
        response = {
            "invoice_counts": state_counts,
            "monthly_sales": round(monthly_sales, 2),
            "btc_sales_by_address": list(btc_sales_by_address.values()),
            "api_usage": api_usage_stats
        }

        return response

    except SQLAlchemyError as e:
        log.error(f"Database error retrieving invoice stats: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        log.error(f"Error retrieving invoice stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving invoice stats: {str(e)}")
