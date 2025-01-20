import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Divider from './Divider';
import { BTCPayButton, StripePayButton } from './Button';

import creditCardLogo from '/icons8-credit-card-80.png';
import bitcoinLogo from '/icons8-bitcoin-logo-50.png'

function Landing() {
    const navigate = useNavigate();

    const handleStripePay = () => {
        navigate('/stripe-checkout');
    };
    
    const handleBTCPay = () => {
        navigate('/btcpay-checkout');
    }

    return (
        <div className="flex flex-col gap-4 h-screen text-slate-300 text-xs m-6">
            <Header />
            <Divider />
            <ul className="list-inside list-disc">
               <li className="pb-2">Do you want to grow your own mushrooms but are unsure where to start?</li> 
               <li className="pb-2">Do you feel overwhelmed by the vast sea of cultivation information found online?</li>
               <li>Do you want to avoid wasting time and money on methods that may not work or yield much?</li>
            </ul>
            <p><span className="font-bold">Mushroom lovers</span>: do any of these questions resonate with you? If so, then you've come to the right place.</p> 
            
            <p><span className="text-red-500 italic">Shrooms At Home</span> is a concise yet complete guide for getting started
             growing mushrooms. This guide distills the vast sea of information found online into the essential elements
             needed for a successful grow. It describes everything you will need, from the methods to follow to the 
             materials to purchase.
             <br/>
             <br/>
            <span className="text-red-500 italic">Shrooms At Home</span> is the guide I wish I had when I started
            growing. It contains all the research, experimentation, and trial and error that I've put into my own
            methods over the years, so you don't have to, saving you time and money.
             <br/>
             <br/>
            When you buy <span className="text-red-500 italic">Shrooms At Home</span>, you get access not only
            to the methods I use today, but also any enhancements or improvements to my methods that I make in the future.
            </p>
            <StripePayButton handleClick={handleStripePay} text="Pay with stripe" image={creditCardLogo} />
            <BTCPayButton handleClick={handleBTCPay} text="Pay with bitcoin" image={bitcoinLogo} />
            <Footer />
        </div>
    );
}

export default Landing;