import httpx
import json
import os
import stripe

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Invoice, get_invoice_db, dump_invoice_db


app = FastAPI()
stripe_price_id = ''
sah_price = 0.0
tax_rate = 0.0
tax = 0.0
btcpay_api_key = ''

FRONTEND_URL = "http://localhost:5173"

# NOTE: be mindful of the protocol (http/https) and port number
origins = [
    FRONTEND_URL
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
    stripe.api_key = config['stripe_secret_key']
    stripe_price_id = config['stripe_price_id']
    sah_price = config['price']
    tax_rate = config['tax_rate']
    tax = sah_price * tax_rate
    
    print(f"Loaded config: stripe_price_id={stripe_price_id} sah_price={sah_price} tax_rate={tax_rate} tax={tax}")

#
# API Endpoints
#
async def create_btcpay_invoice(customer_email):
    url = f"{btcpay_url}/api/v1/stores/{btcpay_store_id}/invoices"

    headers = {
        "Authorization": f"token {btcpay_api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "metadata": {
            "buyerEmail": customer_email,
            "itemDesc": "shroomsathome",
            "taxIncluded": tax,
            "posData": {
               "sub_total": sah_price,
               "total": sah_price + tax 
            }
        },
        "checkout": {
            "speedPolicy": "MediumSpeed", # 1 confirmation
            "paymentMethods": ["BTC", "BTC-LightningNetwork"],
            "redirectURL": FRONTEND_URL + "/pay-submitted?type=btc",
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
        raise HTTPException(status_code=response.status_code, detail=response.text)


@app.post("/checkout")
async def checkout(request: Request, db: Session = Depends(get_invoice_db)):
    body = await request.json()
    payment_type = body['type']
    customer_email = body['email']
    
    print(f"POST: /checkout: payment_type={payment_type} customer_email={customer_email}")
    
    if payment_type == 'btc':
        try:
            invoice = await create_btcpay_invoice(customer_email)
            invoice_id = invoice["id"]
            invoice_status = invoice["status"]
            
            db_entry = Invoice(email=customer_email,
                               payment_type=payment_type,
                               btcpay_invoice_id=invoice_id,
                               btcpay_invoice_status=invoice_status)

            db.add(db_entry)
            db.commit()
            db.refresh(db_entry)
            
            dump_invoice_db(db)
            
            return { "checkoutLink": invoice["checkoutLink"] }
        except:
            print("Failed to create invoice")
        


@app.get("/price")
def price():
    print(f"GET: /price: price={sah_price} tax={tax}")
    return {"price": sah_price, "tax": tax}

@app.get("/")
async def root():
    return {"message": "Hello World"}