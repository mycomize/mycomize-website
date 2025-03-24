import asyncio
import boto3
import hashlib
import hmac
import httpx
import json
import logging
import string
import stripe
import secrets

from botocore.exceptions import ClientError
from database import Invoice, get_invoice_db, RateLimit, get_rate_limit_db
from datetime import datetime
from email_validator import validate_email, EmailNotValidError
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
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
    for p in product_list:
        if p['id'] == 'fundamentals':
            p['price'] = config['fundamentals_price']
            p['stripe_price_id'] = config['fundamentals_stripe_price_id']
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
    stripe.api_key = config['stripe_secret_key']
    stripe_webhook_secret = config['stripe_webhook_secret']

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

    frontend_url = config['frontend_url']
    init_product_list(config)

FRONTEND_DEV_HTTP_URL = "http://localhost:5173"

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

def fulfill_order(email, order_id, product_id, type):
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

    return send_email(email, order_id, presigned_url_list, product, type)

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
            customer_file = f"{product['id']}/customers/{email_hash}/{order_id}/{product_file}"

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
            prefix=f"{product['id']}/customers/"

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

def send_email(email, order_id, presigned_url_list, product, type):
    """
    Send an email to the customer with their presigned URLs.

    Args:
        email (str): Customer's email address
        order_id (str): Unique order identifier
        presigned_url_list (list): Presigned URL for accessing the guide
        product (dict): Product information including title

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

    if "200" in response or "202" in response:
        log.info(f"sent fulfillment email to {email}, type={type}")
        return True
    else:
        log.error(f"failed to send fulfillment email to {email}, pdf_link={pdf_link}, epub_link={epub_link}, type={type}, (response={response})")
        return False

async def validate_location(city, state, postal_code, country):
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
        "address": {
            f"{city}, {state} {zipcode}"
        }
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

async def checkout_btc(email, order_id, invoice_db, product, city, state, zipcode, country):
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

        location = await validate_location(city, state, zipcode, country)
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
                                   btcpay_invoice_id=invoice_id,
                                   btcpay_invoice_state=invoice_state,
                                   btcpay_city=location.city,
                                   btcpay_state=location.state,
                                   btcpay_postal_code=location.postal_code,
                                   btcpay_country=location.country)

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
async def checkout(request: Request, invoice_db: Session = Depends(get_invoice_db), rate_limit_db: Session = Depends(get_rate_limit_db)):
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
                                  customer_country)

    if payment_type == 'stripe':
        # Stripe handles location and sales tax for us
        return await checkout_stripe(customer_email, order_id, invoice_db, product)

@app.post("/stripe-webhook")
async def stripe_webhook(request: Request, invoice_db: Session = Depends(get_invoice_db)):
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
                    success = fulfill_order(email, invoice.order_id, invoice.product_id, type="stripe")

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

async def dequeue_stripe_webhook_data(session_id: str):
    """
    Stream Stripe webhook events to the client.

    Args:
        session_id (str): The Stripe session ID to get events for

    Yields:
        str: Server-sent event data
    """
    if session_id == None or session_id == "":
        yield f"event: error\ndata: session_id is empty\n\n"

    while True:
        try:
            async with stripe_webhook_lock:
                if session_id in stripe_webhook_queue_map:
                    queue = stripe_webhook_queue_map[session_id]
                    data = await asyncio.wait_for(queue.get(), timeout=0.5)
                    yield f"data: {json.dumps(data)}\n\n"
                else:
                    yield f"event: error\ndata: invoice not found in stripe_webhook_queue_map\n\n"
        except asyncio.TimeoutError:
            yield f"event: error\ndata: queue timeout stripe webhook\n\n"
        except asyncio.CancelledError:
            yield f"event: error\ndata: queue cancelled stripe webhook\n\n"

        await asyncio.sleep(0.5)


@app.get("/stripe-webhook-events")
async def stripe_webhook_events(session_id: str):
    """
    Endpoint to stream Stripe webhook events to the client.

    Args:
        session_id (str): The Stripe session ID to get events for

    Returns:
        StreamingResponse: Server-sent events stream
    """
    return StreamingResponse(dequeue_stripe_webhook_data(session_id), media_type="text/event-stream")

@app.post("/btcpay-webhook")
async def btcpay_webhook(request: Request, invoice_db: Session = Depends(get_invoice_db)):
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
                    success = fulfill_order(email, invoice.order_id, invoice.product_id, type="btc")

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

async def dequeue_btcpay_webhook_data(invoice_id: str):
    """
    Stream BTCPay webhook events to the client.

    Args:
        invoice_id (str): The BTCPay invoice ID to get events for

    Yields:
        str: Server-sent event data
    """
    if not invoice_id:
        yield f"event: error\ndata: invoice_id is empty\n\n"

    while True:
        try:
            async with btcpay_webhook_lock:
                if invoice_id in btcpay_webhook_queue_map:
                    queue = btcpay_webhook_queue_map[invoice_id]
                    data = await asyncio.wait_for(queue.get(), timeout=0.5)
                    yield f"data: {json.dumps(data)}\n\n"
                else:
                    yield f"event: error\ndata: invoice_id {invoice_id} not found in btcpay_webhook_queue_map\n\n"
        except asyncio.TimeoutError:
            yield f"event: error\ndata: queue timeout btcpay webhook\n\n"
        except asyncio.CancelledError:
            yield f"event: error\ndata: queue cancelled btcpay webhook\n\n"

        await asyncio.sleep(0.5)

@app.get("/btcpay-webhook-events")
async def btcpay_webhook_events(invoice_id: str):
    """
    Stream BTCPay webhook events to the client.

    Args:
        invoice_id (str): The BTCPay invoice ID to get events for

    Returns:
        StreamingResponse: Server-sent events stream
    """
    return StreamingResponse(dequeue_btcpay_webhook_data(invoice_id), media_type="text/event-stream")

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
