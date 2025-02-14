import { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import Divider from "./Divider";

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

    useEffect(() => {
        if (type === "btc") {
            const invoiceId = searchParams.get("invoice_id");
            const url = import.meta.env.VITE_BACKEND_URL + `/btcpay-webhook-events?invoice_id=${invoiceId}`;
            const eventSource = new EventSource(url);
            
            eventSource.onmessage = (event) => {
                console.log(`Received new btcpay webhook data: ${event.data}`);
                const webhookData = JSON.parse(event.data);

                setOrderState(webhookData.order_state);
            };
            
            eventSource.onerror = (error) => {
                console.error("EventSource failed:", error);
            };
            
            return () => {
                eventSource.close();
            };
        } else if (type === "stripe") {
            const sessionId = searchParams.get("session_id");
            const url = import.meta.env.VITE_BACKEND_URL + `/stripe-webhook-events?session_id=${sessionId}`;
            const eventSource = new EventSource(url);
            
            eventSource.onmessage = (event) => {
                console.log(`Received new stripe webhook data: ${event.data}`);
                const webhookData = JSON.parse(event.data);

                setOrderState(webhookData.order_state);
            };
            
            eventSource.onerror = (error) => {
                console.error("EventSource failed:", error);
            };
            
            return () => {
                eventSource.close();
            };
        }
    }, []);
    
    if (type === "btc" || type === "stripe") {
        return <OrderStatusPage order_type={type} order_state={orderState} order_id={order_id} />    
    } else {
       return <><h1>404 Not Found</h1></>
    }
}

function OrderStatusPage(props) {
    const type = (props.order_type === 'btc') ? "BTC" : "Stripe";
    let status = '';

    if (props.order_state === 'Fulfilled') {
        status = <h2 className="font-bold text-lg">Order Status: Fulfilled &#x2705;</h2>;
    } else if (props.order_state === 'Settled') {
        status = <h2 className="font-bold text-lg">Order Status: Settled &#x1f4b0;</h2>;
    } else if (props.order_state === 'Processing Payment') {
        status = <h2 className="font-semibold text-lg">Order Status: Processing Payment &#x231b;</h2>;
    } else if (props.order_state === "Expired") {
        status = <h2 className="font-semibold text-lg">Order Status: Invoice Expired &#x23f0;</h2>;
    }

    return (
        <div className="flex flex-col mx-auto px-4 max-w-prose gap-4 h-screen text-slate-200 text-xs m-6">
            <Header />
            <Divider />
            <h1 className="font-bold text-lg">Thank You</h1>
            {status}
            <p className="text-sm">
                Once your {type} payment has settled we will send the guide to the email you provided. 
                <br/><br/>Your Order ID is: <strong>{props.order_id}</strong>
                <br/><br/> Please keep it for your records.
            </p>
            <Footer />
        </div>
    );
}