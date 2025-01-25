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
            <div className="mt-1 mb-5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="block w-full rounded bg-[#30313d] px-3 py-1.5 h-11 text-base text-[#e7e7e9] shadow-md shadow-[#0d0d0f] border border-[#424353] placeholder:text-[#9e9e9e] focus:border focus:border-[#ef4444] focus:outline focus:outline-3 focus:outline-[#ef4444]/25 sm:text-sm/6"
                />
            </div>
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