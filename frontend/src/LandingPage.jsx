import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import Divider from './Divider';
import { BTCPayButton, StripePayButton } from './Button';
import StripeCheckoutPage from './StripeCheckoutPage';

import creditCardLogo from '/icons8-credit-card-80.png';
import bitcoinLogo from '/icons8-bitcoin-logo-50.png'

export function Title() {
    return <span className="font-semibold text-red-500">shrooms @ home</span>    
}

const ModalDialog = ({ isOpen, onClose }) => {
    const dialogRef = useRef(null);
    
    useEffect(() => {
        const dialog = dialogRef.current;

        if (isOpen) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [isOpen]);
    
    const handleClose = () => {
        onClose();
    }
    
    const handleCancel = (event) => {
        event.preventDefault();
        onClose();
    }
    
    return (
        <dialog 
            className="h-fit max-w-72 bg-zinc-900 rounded-md"
            ref={dialogRef}
            onClose={handleClose}
            onCancel={handleCancel}
        >
            <StripeCheckoutPage />
        </dialog>
    )
}

function LandingPage() {
    const [stripeModalOpen, setStripeModalOpen] = useState(false);
    
    const handleStripePay = () => {
        setStripeModalOpen(true);
        
        const landing = document.getElementById('landing');
        landing.style.filter = 'blur(5px)';
    };

    const handleStripeModalClose = () => {
        setStripeModalOpen(false);
        
        const landing = document.getElementById('landing');
        landing.style.filter = 'none';
    };
    
    const handleBTCPay = () => {};

    return (
        <>
            <ModalDialog isOpen={stripeModalOpen} onClose={handleStripeModalClose} />
            <div id="landing" className="flex flex-col mx-auto px-4 max-w-prose gap-4 h-screen text-slate-300 text-xs m-6">
                <Header />
                <Divider />
                <ul className="list-inside list-disc">
                   <li className="pb-2">Do you want to grow your own mushrooms but are unsure where to start?</li> 
                   <li className="pb-2">Do you feel overwhelmed by the amount of cultivation information found online?</li>
                </ul>
                <p><Title /> is a concise yet complete guide for getting started
                 growing mushrooms at home. It distills the vast sea of cultivation information found online into
                  a <span className="underline decoration-red-500 decoration-dotted underline-offset-4 text-red-500">practical</span> series
                   of steps. It contains everything you need to get started, from the materials to buy to the methods
                 to follow.
                 <br/>
                 <br/>
                <Title /> is my method. It includes all the lessons I've learned from trial and error and experimentation
                 so that you don't repeat the same mistakes I've made in the past.
                <br/>
                <br/>
                Even though my method is proven, I'm always looking for ways to make it better, both in terms of cost
                and yield. When you buy <Title />, you get access to my method as it stands
                today, and also any improvements I make in the future.
                </p>
                <StripePayButton handleClick={handleStripePay} text="Pay with stripe" image={creditCardLogo} />
                <BTCPayButton handleClick={handleBTCPay} text="Pay with bitcoin" image={bitcoinLogo} />
                <Footer />
            </div>
        </>
    );
}

export default LandingPage;