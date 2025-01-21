import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import creditCardLogo from '/icons8-credit-card-80.png';
import Divider from './Divider';

const StripeCheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [errorMessage, setErrorMessage] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const backendUrl = 'https://localhost:8000/create-payment-intent';

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Stripe hasn't loaded yet; disable submission until it does
        if (!stripe || !elements) {
            return;
        }
        
        const { error: submitError } = await elements.submit();        
        if (submitError?.message) {
            setErrorMessage(submitError.message);
            return;
        }

        const response = await fetch(backendUrl,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                     currency: 'usd',
                     email: emailInput,
                })
            }
        );
        
        const { clientSecret } = await response.json();
        
        const result = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}/completion`
            }
        });
        
        if (result.error) {
            setErrorMessage(result.error.message);
            console.error(result.error.message);
        } else {
            console.log("Successfully confirmed Payment");
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex flex-col text-sm" method="dialog">
            <label htmlFor="email" >Email</label>
            <input className="pl-3 mb-5 h-[44px] mt-1 rounded bg-[#30313d] border border-[#424353] shadow-[#0e0e0f] shadow-md" value={emailInput} onChange={(e => setEmailInput(e.target.value))} type="email" placeholder="email@example.com" id="email" />
            <Divider />
            <div className="mb-3"></div>
            <PaymentElement />
            <button className="inline-flex items-center text-xs gap-x-2 mt-6 mb-3 min-w-36 rounded-lg font-semibold px-2 py-1 self-center bg-indigo-600" type="submit" disabled={!stripe || !elements}> 
                <img className="max-h-5 max-w-5" src={creditCardLogo} /> 
                Submit Payment
            </button>
            {/*Show error message, optional */}
            {errorMessage && <div>{errorMessage}</div>}
        </form>
    )
}

export default StripeCheckoutForm;