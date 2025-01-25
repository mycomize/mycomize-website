import json
import os
import stripe

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
price_id = ''
FRONTEND_URL = 'http://localhost:5173'

# Add CORS middleware to allow requests from your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Replace with your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("stripe.json", 'r') as f:
    stripe_config = json.load(f)
    
    stripe.api_key = stripe_config['stripe_secret_key']
    price_id = stripe_config['stripe_price_id']

@app.post("/stripe-create-checkout-session")
def stripe_create_checkout_session():
    print("Creating checkout session")
    try:
        session = stripe.checkout.Session.create(
            ui_mode = 'embedded',
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='payment',
            return_url=FRONTEND_URL + '/stripe-checkout-return?session_id={CHECKOUT_SESSION_ID}',
        )
    except Exception as e:
        return {"error": str(e)}
    
    return {"clientSecret": session.client_secret}

@app.get("/stripe-session-status")
def stripe_session_status(session_id: str):
    print("Checking session status")
    session = stripe.checkout.Session.retrieve(session_id)

    return {"status": session.status, "customer_email": session.customer_details.email}

@app.get("/")
async def root():
    return {"message": "Hello World"}