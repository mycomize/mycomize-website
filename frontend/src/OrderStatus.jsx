import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import Divider from "./Divider";
import PageNotFound from "./PageNotFound";

import nostrQrCode from '/nostr-qrcode.png';
import { TryAgainButton } from './Button';

async function getInvoice(invoice_id) {
    try {
        const url = import.meta.env.VITE_BACKEND_URL + `/invoice?invoice_id=${invoice_id}`;
        const response = await fetch(url, { method: "GET" });
        
        if (response.ok) {
            return await response.json();
        } else {
            console.error(`Failed to get invoice for id=${invoice_id}`)
            return null
        }
    } catch (error) {
        console.error(`Exception getting invoice_id ${invoice_id}: ${error}`)
        return null
    }
}

export function OrderStatus() {
    const [orderState, setOrderState] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();

    const type = searchParams.get("type");
    const order_id = searchParams.get("order_id");
    const invoiceId = searchParams.get("invoice_id");
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (type === "btc") {

            const url = import.meta.env.VITE_BACKEND_URL + `/btcpay-webhook-events?invoice_id=${invoiceId}`;
            const eventSource = new EventSource(url);
            
            eventSource.onmessage = (event) => {
                console.log(`Received new btcpay webhook data: ${event.data}`);
                const webhookData = JSON.parse(event.data);

                setOrderState(webhookData.order_state);
            };
            
            eventSource.addEventListener("error", (event) => {
                console.error("BTCPay EventSource failed: ", event.data);
            })
            
            eventSource.onerror = (error) => {
                console.error("BTCPay EventSource failed:", error);
                eventSource.close();
            };
            
            return () => {
                eventSource.close();
            };
        } else if (type === "stripe") {
            const url = import.meta.env.VITE_BACKEND_URL + `/stripe-webhook-events?session_id=${sessionId}`;
            const eventSource = new EventSource(url);
            
            eventSource.onmessage = (event) => {
                console.log(`Received new stripe webhook data: ${event.data}`);
                const webhookData = JSON.parse(event.data);

                setOrderState(webhookData.order_state);
            };

            eventSource.addEventListener("error", (event) => {
                console.error("Stripe EventSource failed: ", event.data);
            })
            
            eventSource.onerror = (error) => {
                console.error("Stripe EventSource failed:", error);
                eventSource.close();
            };
            
            return () => {
                eventSource.close();
            };
        }
    }, []);
    
    console.log(`orderstate: ${orderState}`);
    
    return <OrderStatusPage order_type={type} order_state={orderState} order_id={order_id} />;
}

function OrderStatusPage({ order_type, order_state, order_id }) {
    const navigate = useNavigate();
    const type = (order_type === 'btc') ? "BTC" : "Stripe";
    let status = '';
    let text = '';

    console.log(`orderstate (in OrderStatusPage): ${order_state}`);
    
    if (!type || !order_id) {
        return <PageNotFound />;
    }

    const handleTryAgain = () => {
        navigate('/');
    }
    
    if (order_state === 'Fulfilled') {
        status = <h3>Order Status: <strong>Fulfilled &#x2705;</strong></h3>;
    } else if (order_state === 'Settled') {
        status = <h3>Order Status: <strong>Settled &#x1f4b0;</strong></h3>;
    } else if (order_state === 'Processing Payment') {
        status = <h3>Order Status: <strong>Processing Payment &#x231b;</strong></h3>;
    } else if (order_state === "Expired") {
        status = <h3>Order Status: <strong>Invoice Expired &#x23f0;</strong></h3>;
    }
    
    const order = (
        <>
            <div className="text-sm">
                {status}
                <h3>Order ID: <strong>{order_id}</strong></h3>
                <p className="mt-2">Please keep this ID for your records.</p>
            </div>
        </>
    );

    const support = (
        <p className="mt-3">If you don't see an email from <strong>mycomize.com</strong>, 
            please check your spam folder. If you still don't see one, please reach out to me on
            <a href="https://x.com/cjamsonx" className="text-red-500 font-semibold"> X</a> or email me at
            <a href="mailto:connor@mycomize.com" className="text-red-500 font-semibold"> connor@mycomize.com</a>.
        </p>
    );

    let info = ''; 

    if (type === "BTC") {
        if (order_state === "Fulfilled") {
            info = <p>Your BTC payment has been confirmed! We sent an email containing your link to the guide.</p>;
        } else if (order_state === "Settled") {
            info = <p>Your BTC payment has been confirmed! You will receive an email with a link to the guide in the next few minutes.</p>;
        } else if (order_state === "Processing Payment") {
            info = (
                <>
                    <p>
                        Once your BTC payment is confirmed, we will send the guide to the email you provided:
                    </p>
                    <ul className="space-y-2">
                        <li className="ml-4">&#x26A1; If you used lightning, you should see the guide within a few seconds.</li>
                        <li className="ml-4">&#x1f517; If you paid on-chain, we will send the guide once the transaction has 1 confirmation on the blockchain.</li>
                    </ul>
                </>
            );
        }

        text = (
            <>
                <div className="text-sm flex flex-col gap-3 mt-4">
                    {info}
                    {support}
                </div>
            </>
        );
    }

    if (type === "Stripe") {
        if (order_state === "Fulfilled") {
            info = "We've received your Stripe payment and sent an email containing your link to the guide.";
        } else if (order_state === "Settled") {
            info = "We've received your Stripe payment. You will receive an email with a link to the guide in the next few minutes.";
        } else if (order_state === "Processing Payment") {
            info = "We've received your Stripe payment and are currently waiting for payment confirmation. You will receive an email with a link to the guide once payment is confirmed.";
        }

        text = (
            <>
                <div className="text-sm flex flex-col gap-3 mt-4">
                    <p>{info}</p>
                    {support}
                </div>
            </>
        );

    }
    
    if (order_state !== "Expired") {
        return (
            <div className="flex flex-col mx-auto px-4 max-w-prose gap-2 h-screen text-slate-200 text-sm m-6">
                <div className="flex flex-col gap-5">
                    <Header />
                </div>
                <div className="my-1"></div>
                <Divider />
                <h1 className="font-bold text-lg my-3">Thank You</h1>
                {order}
                {text}
                <Footer />
            </div>
        );
    } else {
        if (type === "BTC") {
            text = (
                <>
                    <div className="text-sm flex flex-col gap-3 mt-2">
                        <p>
                            Your BTC invoice has expired. Please try again.
                        </p>
                        <p> If the issue persists, please reach out
                            on <a href="https://x.com/cjamsonx" className="text-red-500 font-semibold">X</a> or email me at
                             <a href="mailto:connor@mycomize.com" className="text-red-500 font-semibold"> connor@mycomize.com</a>.
                             You can also reach me on nostr:
                        </p>
                        <img src={nostrQrCode} alt="nostr qrcode" className="justify-center w-32 h-32 mx-auto mt-4" />
                    </div>
                </>
                
            );
        }
        
        return (
            <div className="flex flex-col mx-auto px-4 max-w-prose gap-2 h-screen text-slate-200 text-sm m-6">
                <div className="flex flex-col gap-5">
                    <Header />
                </div>
                <div className="my-1"></div>
                <Divider />
                <h1 className="font-bold text-lg my-3">Invoice Expired &#x23f0; </h1>
                {text}
                <TryAgainButton onClick={handleTryAgain} /> 
                <Footer />
            </div>
        );
    }
}