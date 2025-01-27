import json
import os
import stripe

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

app = FastAPI()
stripe_price_id = ''
sah_price = 0.0
tax_rate = 0.0
tax = 0.0

# NOTE: be mindful of the protocol (http/https) and port number
origins = [
    "http://localhost:5173"
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
    
    stripe.api_key = config['stripe_secret_key']
    stripe_price_id = config['stripe_price_id']
    sah_price = config['price']
    tax_rate = config['tax_rate']
    tax = sah_price * tax_rate
    
    print(f"Loaded config: stripe_price_id={stripe_price_id} sah_price={sah_price} tax_rate={tax_rate} tax={tax}")


#
# API Endpoints
#

@app.post("/checkout")
async def checkout(request: Request):
    body = await request.json()
    payment_type = body['type']
    customer_email = body['email']
    
    print(f"POST: /checkout: payment_type={payment_type} customer_email={customer_email}")

@app.get("/price")
def price():
    print(f"GET: /price: price={sah_price} tax={tax}")
    return {"price": sah_price, "tax": tax}

@app.get("/")
async def root():
    return {"message": "Hello World"}