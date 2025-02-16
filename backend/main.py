import asyncio
import hashlib
import hmac
import httpx
import json
import string
import stripe
import secrets

from email_validator import validate_email, EmailNotValidError

from fastapi import FastAPI, Depends, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import and_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from database import Invoice, get_invoice_db, dump_invoice_db

btcpay_webhook_queue_map = {}
stripe_webhook_queue_map = {}
btcpay_webhook_lock = asyncio.Lock()
stripe_webhook_lock = asyncio.Lock()
invoice_lock = asyncio.Lock()

FRONTEND_DEV_HTTP_URL = "http://localhost:5173"
FRONTEND_PROD_HTTPS_URL = "https://shroomsathome.com"

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

with open("config.json", 'r') as f:
    config = json.load(f)
    
    # BTCPay configs
    btcpay_url = config['btcpay_url']
    btcpay_store_id = config['btcpay_store_id']
    btcpay_api_key = config['btcpay_api_key']
    btcpay_webhook_secret = config['btcpay_webhook_secret']

    # Stripe configs
    stripe.api_key = config['stripe_secret_key']
    stripe_price_id = config['stripe_price_id']
    stripe_webhook_secret = config['stripe_webhook_secret']

    # Pricing and tax configs
    sah_price = config['price']
    tax_rate = config['tax_rate']
    tax = sah_price * tax_rate
    
    print(f"Loaded config: stripe_price_id={stripe_price_id} sah_price={sah_price} tax_rate={tax_rate} tax={tax}")
    
#
# Helpers 
#
def create_order_id(length=8):
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def fulfill_order(email, order_id):
    # send email containing link to access the guide
    # return success/fail
    print(f"Fulfilling order for email={email}, order_id={order_id}")
    return True

async def create_btcpay_invoice(customer_email, order_id):
    url = f"{btcpay_url}/api/v1/stores/{btcpay_store_id}/invoices"

    headers = {
        "Authorization": f"token {btcpay_api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "metadata": {
            "buyerEmail": customer_email,
            "itemDesc": "Mushroom Cultivation Guide",
            "orderId": order_id,
            "taxIncluded": tax,
            "posData": {
               "sub_total": sah_price,
               "total": sah_price + tax 
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
        "amount": str(round(sah_price + tax, 2)),
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
    computed_hash = hmac.new(
        bytes(webhook_secret_str, 'utf-8'),
        body_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    computed_hash = "sha256=" + computed_hash
    return hmac.compare_digest(computed_hash, btcpay_sig_str)

def invoice_settled(invoice):
    return invoice.order_state == "Settled"

def invoice_fulfilled(invoice):
    return invoice.order_state == "Fulfilled"

def invoice_processing(invoice):
    return invoice.order_state == "Processing Payment"

def invoice_failed(invoice):
    return invoice.order_state == "Failed"

def invoice_expired(invoice):
    return invoice.order_state == "Expired"

def invoice_canceled(invoice):
    return invoice.order_state == "Canceled"

async def checkout_btc(email, order_id, db):
    try:
        invoice = db.query(Invoice).filter(Invoice.email == email).first()
        
        if invoice:
            async with invoice_lock:
                if invoice.payment_type == 'btc':
                    if invoice_settled(invoice) or invoice_fulfilled(invoice):
                        return {"order_state": invoice.order_state}
                    elif invoice_processing(invoice):
                        return {"checkout_link": invoice.order_link} 
                    else: # Failed or Expired or Canceled
                        print(f"Invoice (btcpay): invoice_id={invoice.btcpay_invoice_id} state={invoice.btcpay_invoice_state} email={email} (failed/expired) deleting from DB")
                        db.delete(invoice)
                        db.commit()
                else:
                    print(f"Invoice (btcpay): email={email} already has a stripe invoice. Only one payment type supported")
                    return {"error": "error_only_one_payment_type_supported"}
    
        invoice = await create_btcpay_invoice(email, order_id)
        if "error" in invoice:
            return invoice

        invoice_id = invoice["id"]
        invoice_state = invoice["status"]
    
        print(f"Invoice (btcpay): order_id={order_id} invoice_id={invoice_id} state={invoice_state} email={email} (new)")
    
        db_entry = Invoice(email=email,
                           payment_type='btc',
                           order_id=order_id,
                           order_state="Processing Payment",
                           order_link=invoice["checkoutLink"],
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
    
async def checkout_stripe(email, order_id, db):
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
        cancel_url = FRONTEND_PROD_HTTPS_URL

        checkout_session = stripe.checkout.Session.create(
            line_items=[{"price": stripe_price_id, "quantity": 1}],
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
                           order_link=checkout_session.url,
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
    body = await request.json()
    payment_type = body['type']
    customer_email = body['email']
    order_id = create_order_id()
    
    print(f"POST: /checkout: payment_type={payment_type} customer_email={customer_email}")
    
    if payment_type != 'btc' and  payment_type != 'stripe':
        print(f"POST: /checkout: error_invalid_payment_type: {payment_type}")
        return {"error": "error_invalid_payment_type"}
    
    try:
        # Not checking deliverability for now for testing purposes
        email_info = validate_email(customer_email, check_deliverability=False)
        customer_email = email_info.normalized
    except EmailNotValidError as e:
        print(f"POST: /checkout: error_invalid_email_syntax: {e}")
        return {"error": "error_invalid_email_syntax"}

    if payment_type == 'btc':
        return await checkout_btc(customer_email, order_id, db)
    
    if payment_type == 'stripe':
        return await checkout_stripe(customer_email, order_id, db)


@app.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_invoice_db)):
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
                    return

                invoice.stripe_invoice_state = payment_state
                print(f"Invoice (stripe): state updated to {payment_state} for {email}")
                
                if payment_state == 'paid':
                    invoice.order_state = "Settled"
                    success = fulfill_order(email, invoice.order_id)
                    
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
    elif event['type'] == 'checkout.session.async_payment_failed':
        if invoice:
            async with invoice_lock:
                invoice_state = invoice.stripe_invoice_state
                if invoice_state == 'paid':
                    print(f"Invoice (stripe): received webhook {event['type']} but state={invoice_state}. Doing nothing. email={email}")
                    return

                invoice.order_state = "Failed"
                db.commit()

                # Notify the frontend
                async with stripe_webhook_lock:
                    queue = stripe_webhook_queue_map[session_id]
                    await queue.put({"order_state": invoice.order_state})
        else:
            print(f"Received webhook {event['type']} for {email} not present in invoices DB")
    else: # checkout.session.expired
        if invoice:
            async with invoice_lock:
                invoice_state = invoice.stripe_invoice_state
                if invoice_state == 'paid':
                    print(f"Invoice (stripe): received webhook {event['type']} but state={invoice_state}. Doing nothing. email={email}")
                    return

                invoice.order_state = "Expired"
                db.commit()

                # Notify the frontend
                async with stripe_webhook_lock:
                    queue = stripe_webhook_queue_map[session_id]
                    await queue.put({"order_state": invoice.order_state})

async def dequeue_stripe_webhook_data(session_id: str):
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
    return StreamingResponse(dequeue_stripe_webhook_data(session_id), media_type="text/event-stream")

@app.post("/btcpay-webhook")
async def btcpay_webhook(request: Request, db: Session = Depends(get_invoice_db)):
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
                    success = fulfill_order(email, invoice.order_id)

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
    return StreamingResponse(dequeue_btcpay_webhook_data(invoice_id), media_type="text/event-stream")

@app.get("/price")
def get_price():
    print(f"GET: /price: price={sah_price} tax={tax}")
    return {"price": sah_price, "tax": tax}

@app.get("/")
async def get_root():
    return {"message": "Hello World"}

@app.get('/.env')
async def get_env():
    return {"message": "fuck off"}

@app.get('/.git/config')
async def get_git_config():
    return {"message": "yourmom"}