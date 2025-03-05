import asyncio
import boto3
import hashlib
import hmac
import httpx
import json
import string
import stripe
import secrets
from botocore.exceptions import ClientError

from database import Invoice, get_invoice_db, dump_invoice_db
from email_validator import validate_email, EmailNotValidError

from fastapi import FastAPI, Depends, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from mailersend import emails

from pydantic import BaseModel

from sqlalchemy import and_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

btcpay_webhook_queue_map = {}
stripe_webhook_queue_map = {}
btcpay_webhook_lock = asyncio.Lock()
stripe_webhook_lock = asyncio.Lock()
invoice_lock = asyncio.Lock()

FRONTEND_DEV_HTTP_URL = "http://localhost:5173"
FRONTEND_PROD_HTTPS_URL = "https://mycomize.com"

product_list = [
    {
        "id": "fundamentals",
        "type": "guide",
        "description": "A concise, step-by-step guide to mushroom cultivation",
        "title": "Fundamentals of Mushroom Cultivation",
        "price": 0.00,
        "tax": 0.00,
        "stripe_price_id": "",
        "file_list": [],
        "image": "/mush1.jpg"
    }
]

# NOTE: be mindful of the protocol (http/https) and port number
origins = [
    FRONTEND_DEV_HTTP_URL,
    FRONTEND_PROD_HTTPS_URL
]

app = FastAPI()

# Add CORS middleware to allow requests from your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            p['tax'] = config['fundamentals_price'] * config['tax_rate']
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

with open("config.json", 'r') as f:
    config = json.load(f)
    
    # BTCPay configs
    btcpay_url = config['btcpay_url']
    btcpay_store_id = config['btcpay_store_id']
    btcpay_api_key = config['btcpay_api_key']
    btcpay_webhook_secret = config['btcpay_webhook_secret']

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
    s3_url_expiration = config.get('s3_url_expiration', 172800)  # Default: 2 days in seconds

    init_product_list(config)

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

def fulfill_order(email, order_id, product_id):
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
        print(f"fulfill_order: email={email} order_id={order_id} failed to find product with id={product_id}") 
        return False

    presigned_url_list = create_presigned_url_list(email, order_id, product)

    if presigned_url_list is None:
        print(f"Failed to create presigned URLs for email={email}, order_id={order_id}")
        return False

    return send_email(email, order_id, presigned_url_list, product)

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
                ExpiresIn=s3_url_expiration
            )
        
            print(f"Created presigned URL for email={email}, order_id={order_id}, customer_file={customer_file} that expires in {s3_url_expiration} seconds")
            url_list.append(presigned_url) 
        
        return url_list

    except ClientError as e:
        print(f"Error creating presigned URL: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error creating presigned URL: {e}")
        return None

def send_email(email, order_id, presigned_url_list, product):
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
    print(f"Fulfilling order for email={email}, order_id={order_id}, product_id={product['id']}")

    pdf_link = ""
    epub_link = ""

    for url in presigned_url_list:
        print(f"    - Presigned URL: {url}")
        if ".pdf?" in url:
            pdf_link = url
        elif ".epub?" in url:
            epub_link = url
        else:
            print(f"Unsupported file type: {url}")
    
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

    response = mailer.send(mail_body)

    print(f"Sending mail to email={email}, pdf_link={pdf_link}, epub_link={epub_link}, (response={response})")

    return True

async def create_btcpay_invoice(customer_email, order_id, product):
    """
    Create a new invoice in BTCPay Server.
    
    Args:
        customer_email (str): Customer's email address
        order_id (str): Unique order identifier
        product (dict): Product information including price and title
        
    Returns:
        dict: The created invoice data if successful, or an error dictionary
    """
    url = f"{btcpay_url}/api/v1/stores/{btcpay_store_id}/invoices"

    headers = {
        "Authorization": f"token {btcpay_api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "metadata": {
            "buyerEmail": customer_email,
            "itemDesc": product['title'],
            "orderId": order_id,
            "taxIncluded": product['tax'],
            "posData": {
               "sub_total": product['price'],
               "total": product['price'] + product['tax']
            }
        },
        "checkout": {
            "speedPolicy": "MediumSpeed", # 1 confirmation
            "paymentMethods": ["BTC", "BTC-LightningNetwork"],
            # TODO: change me
            "expirationMinutes": 1,
            # TODO: update frontend
            "redirectURL": FRONTEND_PROD_HTTPS_URL + "/order-status?type=btc&order_id=" + order_id + "&invoice_id={InvoiceId}",
            "redirectAutomatically": True,
        },
        "amount": str(round(product['price'] + product['tax'], 2)),
        "currency": "USD"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        
    if response.status_code == 200:
        return response.json()
    else:
        if response.status_code == 400:
            data = response.json()
            print(f"Create invoice failed: path={data[0]} message={data[1]} email={customer_email}")
        elif response.status_code == 403:
            print(f"Create invoice failed: authenticated but forbidden to add invoices, email={customer_email}")
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

async def checkout_btc(email, order_id, db, product):
    """
    Process a Bitcoin checkout request.
    
    Args:
        email (str): Customer's email address
        order_id (str): Unique order identifier
        db (Session): Database session
        product (dict): Product information
        
    Returns:
        dict: Response containing checkout link or error information
    """
    try:
        invoice = db.query(Invoice).filter(Invoice.email == email).first()
        
        if invoice:
            async with invoice_lock:
                if invoice.payment_type == 'btc':
                    if invoice_settled(invoice) or invoice_fulfilled(invoice):
                        return {"order_state": invoice.order_state}
                    elif invoice_processing(invoice):
                        return {"checkout_link": invoice.checkout_link} 
                    else: # Failed or Expired or Canceled
                        print(f"Invoice (btcpay): invoice_id={invoice.btcpay_invoice_id} state={invoice.btcpay_invoice_state} email={email} (failed/expired) deleting from DB")
                        db.delete(invoice)
                        db.commit()
                else:
                    print(f"Invoice (btcpay): email={email} already has a stripe invoice. Only one payment type supported")
                    return {"error": "error_only_one_payment_type_supported"}
    
        invoice = await create_btcpay_invoice(email, order_id, product)
        if "error" in invoice:
            return invoice

        invoice_id = invoice["id"]
        invoice_state = invoice["status"]
    
        print(f"Invoice (btcpay): order_id={order_id} invoice_id={invoice_id} state={invoice_state} email={email} (new)")
    
        db_entry = Invoice(email=email,
                           payment_type='btc',
                           order_id=order_id,
                           order_state="Processing Payment",
                           checkout_link=invoice["checkoutLink"],
                           product_id=product['id'],
                           btcpay_invoice_id=invoice_id,
                           btcpay_invoice_state=invoice_state)
    
        db.add(db_entry)
        db.commit()
    
        async with btcpay_webhook_lock:
            if invoice_id not in btcpay_webhook_queue_map:
                btcpay_webhook_queue_map[invoice_id] = asyncio.Queue()
    
        return { "checkout_link": invoice["checkoutLink"] }
    except SQLAlchemyError as e:
        print(f"error_db_btc: {e}, email={email}")
        return {"error": f"error_db_btc: {e}"}
    except Exception as e:
        print(f"error_checkout_btc: {e}, email={email}")
        return {"error": f"error_checkout_btc"}
    
async def checkout_stripe(email, order_id, db, product):
    """
    Process a Stripe checkout request.
    
    Args:
        email (str): Customer's email address
        order_id (str): Unique order identifier
        db (Session): Database session
        product (dict): Product information
        
    Returns:
        dict: Response containing checkout link or error information
    """
    try:
        invoice = db.query(Invoice).filter(Invoice.email == email).first()

        if invoice:
            async with invoice_lock:
                if invoice.payment_type == 'stripe':
                    if invoice_fulfilled(invoice) or invoice_settled(invoice):
                        return {
                            "order_state": invoice.order_state
                        }
                    elif invoice_processing(invoice):
                        return {
                            "checkout_link": checkout_session.url
                        }
                    else: # Failed or Expired or Canceled
                        print(f"Invoice (stripe): session_id={invoice.stripe_session_id} state={invoice.stripe_invoice_state} email={email} (failed/expired) deleting from DB")
                        db.delete(invoice)
                        db.commit()
                else:
                    print(f"Invoice (stripe): email={email} already has a btc invoice. Only one payment type supported")
                    return {"error": "error_only_one_payment_type_supported"}

        success_url = FRONTEND_PROD_HTTPS_URL + "/order-status?type=stripe&order_id=" + order_id + "&session_id={CHECKOUT_SESSION_ID}"
        cancel_url = FRONTEND_PROD_HTTPS_URL + "/guides"

        checkout_session = stripe.checkout.Session.create(
            line_items=[{"price": product['stripe_price_id'], "quantity": 1}], # assumes one product
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=email,
            metadata={"order_id": order_id}
        )

        session_id = checkout_session.id
        invoice_state = checkout_session.payment_status

        print(f"Invoice (stripe): order_id={order_id} session_id={session_id} state={invoice_state} email={email} (new)")

        db_entry = Invoice(email=email,
                           payment_type='stripe',
                           order_id=order_id,
                           order_state="Processing Payment",
                           checkout_link=checkout_session.url,
                           product_id=product['id'],
                           stripe_session_id=session_id,
                           stripe_invoice_state=invoice_state)
        db.add(db_entry)
        db.commit()
        
        async with stripe_webhook_lock:
            if session_id not in stripe_webhook_queue_map:
                stripe_webhook_queue_map[session_id] = asyncio.Queue()

        return { "checkout_link": checkout_session.url }
    except SQLAlchemyError as e:
        print(f"error_db_stripe: {e}, email={email}")
        return {"error": f"error_db_stripe: {e}"}
    except Exception as e:
        print(f"error_checkout_stripe: {e}, email={email}")
        return {"error": f"error_checkout_stripe"}

#
# API Endpoints
#
@app.post("/checkout")
async def checkout(request: Request, db: Session = Depends(get_invoice_db)):
    """
    Handle checkout requests for both Bitcoin and Stripe payments.
    
    Args:
        request (Request): The HTTP request
        db (Session): Database session
        
    Returns:
        dict: Response containing checkout link, order state, or error information
    """
    body = await request.json()
    payment_type = body['type']
    customer_email = body['email']
    product_id = body['id']
    order_id = create_order_id()
    
    print(f"POST: /checkout: payment_type={payment_type} customer_email={customer_email}")
    
    if payment_type != 'btc' and  payment_type != 'stripe':
        print(f"POST: /checkout: error_invalid_payment_type: {payment_type}")
        return {"error": "error_invalid_payment_type"}
    
    product = find_product(product_id)
    if product is None:
        print(f"POST: /checkout: error_invalid_product_id: {product_id}")
        return {"error": "error_invalid_product_id"}
    
    try:
        email_info = validate_email(customer_email, check_deliverability=True)
        customer_email = email_info.normalized
    except EmailNotValidError as e:
        print(f"POST: /checkout: error_invalid_email_syntax: {e}")
        return {"error": "error_invalid_email_syntax"}

    if payment_type == 'btc':
        return await checkout_btc(customer_email, order_id, db, product)
    
    if payment_type == 'stripe':
        return await checkout_stripe(customer_email, order_id, db, product)


@app.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_invoice_db)):
    """
    Handle Stripe webhook events.
    
    Args:
        request (Request): The HTTP request containing the webhook data
        db (Session): Database session
        
    Returns:
        dict: Response indicating success or error
    """
    stripe_sig = request.headers.get('Stripe-Signature')
    body = await request.body()

    if not stripe_sig:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try: 
        event = stripe.Webhook.construct_event(body, stripe_sig, stripe_webhook_secret)
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail=f"Invalid signature: {e}")
    
    session_id = event['data']['object']['id']
    payment_state = event['data']['object']['payment_status']
    email = event['data']['object']['customer_email']
    invoice = db.query(Invoice).filter(Invoice.email == email).first()

    if event['type'] == 'checkout.session.completed' or event['type'] == 'checkout.session.async_payment_succeeded':
        if invoice:
            async with invoice_lock:
                invoice_state = invoice.stripe_invoice_state
                if invoice_state == 'paid':
                    print(f"Invoice (stripe): received webhook {event['type']} but state={invoice_state}. Doing nothing. email={email}")
                    return {"status": "success", "message": "Invoice already paid"}

                invoice.stripe_invoice_state = payment_state
                print(f"Invoice (stripe): state updated to {payment_state} for {email}")
                
                if payment_state == 'paid':
                    invoice.order_state = "Settled"
                    success = fulfill_order(email, invoice.order_id, invoice.product_id)
                    
                    if success:
                        invoice.order_state = 'Fulfilled'
                    else:
                        # TODO: Alarm on this to myself
                        pass
                else: # unpaid
                    invoice.order_state = "Canceled" 

                db.commit()

                # Notify the frontend
                async with stripe_webhook_lock:
                    queue = stripe_webhook_queue_map[session_id]
                    await queue.put({"order_state": invoice.order_state})
        else:
            print(f"Received webhook {event['type']} for {email} not present in invoices DB")

        return {"status": "success", "message": "Webhook processed successfully"}

    elif event['type'] == 'checkout.session.async_payment_failed':
        if invoice:
            async with invoice_lock:
                invoice_state = invoice.stripe_invoice_state
                if invoice_state == 'paid':
                    print(f"Invoice (stripe): received webhook {event['type']} but state={invoice_state}. Doing nothing. email={email}")
                    return {"status": "success", "message": "Invoice already paid"}

                invoice.order_state = "Failed"
                db.commit()

                # Notify the frontend
                async with stripe_webhook_lock:
                    queue = stripe_webhook_queue_map[session_id]
                    await queue.put({"order_state": invoice.order_state})
        else:
            print(f"Received webhook {event['type']} for {email} not present in invoices DB")
        return {"status": "success", "message": "Webhook processed successfully"}
    else: # checkout.session.expired
        if invoice:
            async with invoice_lock:
                invoice_state = invoice.stripe_invoice_state
                if invoice_state == 'paid':
                    print(f"Invoice (stripe): received webhook {event['type']} but state={invoice_state}. Doing nothing. email={email}")
                    return {"status": "success", "message": "Invoice already paid"}

                invoice.order_state = "Expired"
                db.commit()

                # Notify the frontend
                async with stripe_webhook_lock:
                    queue = stripe_webhook_queue_map[session_id]
                    await queue.put({"order_state": invoice.order_state})
        else:
            print(f"Received webhook {event['type']} for {email} not present in invoices DB")
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
            continue

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
async def btcpay_webhook(request: Request, db: Session = Depends(get_invoice_db)):
    """
    Handle BTCPay webhook events.
    
    Args:
        request (Request): The HTTP request containing the webhook data
        db (Session): Database session
    """
    btcpay_sig_str = request.headers.get('BTCPay-Sig')
    body_bytes = await request.body()

    if verify_btcpay_webhook(body_bytes, btcpay_sig_str, btcpay_webhook_secret):
        json = await request.json()
        state = json['type'] 
        invoice_id = json['invoiceId'] 
        metadata = json['metadata']
        email = metadata['buyerEmail']
        invoice = db.query(Invoice).filter(Invoice.email == email).first()

        print(f"BTCPay webhook: state={state} invoice_id={invoice_id} metadata={metadata} email={email}")

        if invoice:
            async with invoice_lock:
                invoice_state = invoice.btcpay_invoice_state
                if invoice_state == "InvoiceSettled":
                    print(f"Invoice (btcpay): received webhook {state} but state={invoice_state}. Doing nothing. email={email}")
                    return

                invoice.btcpay_invoice_state = state
                print(f"Invoice (btcpay): state updated to {state} for {email}")

                if state == "InvoiceSettled":
                    invoice.order_state = "Settled"
                    success = fulfill_order(email, invoice.order_id, invoice.product_id)

                    if success:
                        invoice.order_state = "Fulfilled"
                    else:
                        # TODO: Need to alarm on this to myself. Customer has paid but fulfillment
                        # failed for some reason. No bueno
                        pass
                elif state == "InvoiceExpired":
                    invoice.order_state = "Expired"
                elif state == "InvoiceInvalid":
                    invoice.order_state = "Failed"
                
                db.commit()

                # Notify the frontend of the state change
                async with btcpay_webhook_lock:
                    queue = btcpay_webhook_queue_map[invoice_id]
                    await queue.put({"order_state": invoice.order_state}) 
        else:
            print(f"Received webhook {state} for {email} not present in invoices DB")
    else:
        print(f"BTCPay webhook HMAC verification failed")

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
            continue

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
                "tax": product['tax'],
                "image": product['image']
            }
            guide_list.append(guide)
    
    return {"guides": guide_list}

    
@app.get("/")
async def get_root():
    return {"message": "Hello World"}

@app.get('/.env')
async def get_env():
    return {"message": "fuck off"}

@app.get('/.git/config')
async def get_git_config():
    return {"message": "yourmom"}