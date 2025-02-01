import hashlib
import hmac
import httpx
import json
import os
import stripe

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from database import Invoice, get_invoice_db, dump_invoice_db

app = FastAPI()
stripe_price_id = ''
sah_price = 0.0
tax_rate = 0.0
tax = 0.0
btcpay_api_key = ''

FRONTEND_DEV_HTTP_URL = "http://localhost:5173"
FRONTEND_PROD_HTTPS_URL = "https://shroomsathome.com"

# NOTE: be mindful of the protocol (http/https) and port number
origins = [
    FRONTEND_DEV_HTTP_URL,
    FRONTEND_PROD_HTTPS_URL
]

# Add CORS middleware to allow requests from your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Replace with your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("config.json", 'r') as f:
    config = json.load(f)
    
    btcpay_url = config['btcpay_url']
    btcpay_store_id = config['btcpay_store_id']
    btcpay_api_key = config['btcpay_api_key']
    btcpay_webhook_secret = config['btcpay_webhook_secret']
    stripe.api_key = config['stripe_secret_key']
    stripe_price_id = config['stripe_price_id']
    sah_price = config['price']
    tax_rate = config['tax_rate']
    tax = sah_price * tax_rate
    
    print(f"Loaded config: stripe_price_id={stripe_price_id} sah_price={sah_price} tax_rate={tax_rate} tax={tax}")

async def create_btcpay_invoice(customer_email):
    url = f"{btcpay_url}/api/v1/stores/{btcpay_store_id}/invoices"

    headers = {
        "Authorization": f"token {btcpay_api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "metadata": {
            "buyerEmail": customer_email,
            "itemDesc": "mushroom cultivation guide",
            "taxIncluded": tax,
            "posData": {
               "sub_total": sah_price,
               "total": sah_price + tax 
            }
        },
        "checkout": {
            "speedPolicy": "MediumSpeed", # 1 confirmation
            "paymentMethods": ["BTC", "BTC-LightningNetwork"],
            # TODO: update frontend
            "redirectURL": FRONTEND_PROD_HTTPS_URL + "/order-status?type=btc&invoice_id={InvoiceId}",
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
            print(f"Create invoice failed: path={data[0]} message={data[1]}")
        elif response.status_code == 403:
            print(f"Create invoice failed: authenticated but forbidden to add invoices")
        raise HTTPException(status_code=response.status_code, detail=response.text)

def verify_btcpay_webhook(body_bytes, btcpay_sig_str, webhook_secret_str):
    computed_hash = hmac.new(
        bytes(webhook_secret_str, 'utf-8'),
        body_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    computed_hash = "sha256=" + computed_hash
    return hmac.compare_digest(computed_hash, btcpay_sig_str)

#
# API Endpoints
#
@app.post("/checkout")
async def checkout(request: Request, db: Session = Depends(get_invoice_db)):
    body = await request.json()
    payment_type = body['type']
    customer_email = body['email']
    
    print(f"POST: /checkout: payment_type={payment_type} customer_email={customer_email}")
    
    if payment_type == 'btc':
        try:
            invoice = db.query(Invoice).filter(Invoice.email == customer_email).first()
            if invoice:
                return {
                    "btcpay_invoice_id": invoice.btcpay_invoice_id, 
                    "btcpay_invoice_state": invoice.btcpay_invoice_state, 
                }
            else:
                invoice = await create_btcpay_invoice(customer_email)
                invoice_id = invoice["id"]
                invoice_state = invoice["status"]

                print(f"BTCPay new invoice: id={invoice_id} state={invoice_state} email={customer_email}")  
                print(f"BTCPay new invoice: adding DB entry")  

                db_entry = Invoice(email=customer_email,
                                   payment_type=payment_type,
                                   btcpay_invoice_id=invoice_id,
                                   btcpay_invoice_state=invoice_state)

                db.add(db_entry)
                db.commit()
                db.refresh(db_entry)
                
                dump_invoice_db(db)
                return { "checkoutLink": invoice["checkoutLink"] }
        except SQLAlchemyError as e:
            print(f"SQLAlchemy error: {e}")
        
@app.post("/btcpay-webhook")
async def btcpay_webhook(request: Request, db: Session = Depends(get_invoice_db)):
    btcpay_sig_str = request.headers.get('BTCPay-Sig')
    body_bytes = await request.body()
    
    if verify_btcpay_webhook(body_bytes, btcpay_sig_str, btcpay_webhook_secret):
        print(f"BTCPay webhook HMAC verified")
        json = await request.json()

        webhook_type = json['type'] 
        invoice_id = json['invoiceId'] 
        metadata = json['metadata']
        email = metadata['buyerEmail']

        print(f"BTCPay webhook: type={webhook_type} invoice_id={invoice_id} metadata={metadata} email={email}")
        
        invoice = db.query(Invoice).filter(Invoice.email == email).first()
        if invoice:
            invoice.btcpay_invoice_state = webhook_type
            db.commit()
            print(f"BTCPay invoice: status updated to {webhook_type} for {email}")
        else:
            print(f"Recieved webhook {webhook_type} for {email} not present in invoices DB")
    else:
        print(f"BTCPay webhook HMAC verification failed")

@app.get("/invoice")
async def get_invoice(request: Request, db: Session = Depends(get_invoice_db)):
    data = await request.json()
    invoice_id = data["invoice_id"]
    invoice = db.query(Invoice).filter(Invoice.btcpay_invoice_id == invoice_id).first()
    
    if invoice:
        return { "email": invoice.email, "state": invoice.btcpay_invoice_state }
    else:
        return


@app.get("/price")
def get_price():
    print(f"GET: /price: price={sah_price} tax={tax}")
    return {"price": sah_price, "tax": tax}

@app.get("/")
async def get_root():
    return {"message": "Hello World"}

@app.get("/.env")
async def get_env():
    return {"message": "fuck off"}