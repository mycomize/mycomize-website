import React, {useCallback, useEffect, useState} from 'react';
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { Navigate } from 'react-router-dom';
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckoutForm  from "./StripeCheckoutForm";
import Header from './Header';
import Footer from './Footer';
import Divider from './Divider';
import {Title} from './LandingPage';

import shroomPic from '/growing-shroom.jpg';
import kindleLogo from '/icons8-amazon-kindle-50.png';

const stripePromise = loadStripe("pk_test_51QeNqODBfdlxKWefTLEwv61yiyVd3jVgHUuzzMGewdKp2ftaTHG1FlaFIFJ3S2P2KgcEVOaMUnqKwaDQTgfBkiTN00YnTEmMdl");
const BACKEND_URL = 'https://localhost:8000';

function StripeCheckoutPage() {
    const fetchClientSecret = useCallback(() => {
        // Create a Checkout Session
        return fetch(`${BACKEND_URL}/stripe-create-checkout-session`, {
          method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({})
        })
          .then((res) => res.json())
          .then((data) => data.clientSecret);
      }, []);
    
      const options = {fetchClientSecret};
    
      return (
        <div id="checkout">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={options}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      ) 

}

export function StripeCheckoutReturn() {
    const [status, setStatus] = useState(null);
    const [customerEmail, setCustomerEmail] = useState('');
    
    useEffect(() => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const sessionId = urlParams.get('session_id');

        fetch(`${BACKEND_URL}/stripe-session-status?session_id=${sessionId}`)
            .then((res) => res.json())
            .then((data) => {
                setStatus(data.status);
                setCustomerEmail(data.customer_email);
            });
    }, []);
    
    if (status === 'open') {
       return <Navigate to='/stripe-checkout'/>; 
    }
    
    if (status === 'complete') {
        return <section id="success">
            <p>We appreciate your business! An email will be sent to {customerEmail}. If you have
            any questions, please contact us at <a href="mailto:orders@shroomsathome.com">orders@shroomsathome.com</a>
            </p>
        </section>
    }
}



//    const options = {
//        mode: "payment",
//        amount: 3000,
//        currency: 'usd',
//        payment_method_types: ['card'],
//        appearance: {
//            theme: 'night',
//            variables: {
//                spacingUnit: '4px',
//                borderRadius: '4px',
//                colorPrimary: '#ef4444'
//            }
//        }
//    };

//    return (
//        <>
//            <div className="flex flex-col gap-4 m-4 text-[#f9fbfd]">
//                <h1 className="font-bold text-xl text-center mt-3">Grow &#x1F344; @ &#x1f3e0; </h1>
//                <ul className="text-xs space-y-4">
//                    <li><span className="font-bold">&#x2702; Cut through the noise</span> with concise, step-by-step instruction</li>
//                    <li><span className="font-bold">&#x23f3; Save time</span> following a proven method</li>
//                    <li><span className="font-bold">&#x1f6d2; Get growing immediately</span> with a comprehensive shopping list</li>
//                </ul>
//                <Divider />
//                <div className="flex gap-2">
//                    <img className="circle object-cover w-12 h-12" src={shroomPic} />
//                    <div className="ml-auto pt-2">
//                        <p className="text-xs text-right">1x eGuide for mushroom cultivation
//                        <br/>
//                        <span className="font-bold">$30.00</span>
//                        </p>
//                    </div>
//                </div>
//                <div>
//                    <p className="text-xs">Provide your email to receive instant access
//                        on &#x1f310; Web, &#x1f4d6; ePub, and <img className="inline max-w-4 max-h-4" src={kindleLogo}/> Kindle formats.
//                    </p>
//                </div>
//                <Elements stripe={stripePromise} options={options}>
//                    <StripeCheckoutForm />
//                </Elements>
//                <Footer />
//            </div>
//        </>
//    );
    

export default StripeCheckoutPage;