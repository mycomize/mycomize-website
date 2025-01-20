import React from 'react';
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckoutForm  from "./StripeCheckoutForm";
import Header from './Header';
import Footer from './Footer';
import Divider from './Divider';

const stripePromise = loadStripe("pk_test_51QeNqODBfdlxKWefTLEwv61yiyVd3jVgHUuzzMGewdKp2ftaTHG1FlaFIFJ3S2P2KgcEVOaMUnqKwaDQTgfBkiTN00YnTEmMdl");

function StripeCheckoutPage() {
    const options = {
        mode: "payment",
        amount: 3000,
        currency: 'usd',
        payment_method_types: ['card'],
        appearance: {
            theme: 'night',
            variables: {
                spacingUnit: '4px',
                borderRadius: '4px'
            }
        }
    };

    return (
        <>
            <div className="flex flex-col gap-4 h-screen m-6">
                <Header /> 
                <Divider />
                <Elements stripe={stripePromise} options={options}>
                    <StripeCheckoutForm />
                </Elements>
                <Footer />
            </div>
        </>
    );
}

export default StripeCheckoutPage;