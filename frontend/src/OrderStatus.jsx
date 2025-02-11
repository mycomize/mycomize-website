import { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import Divider from "./Divider";

async function getInvoice(invoice_id) {
    try {
        // TODO: move body into query parameter
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
    const [invoiceState, setInvoiceState] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();

    const type = searchParams.get("type");
    const clientInvoiceId = searchParams.get("invoice_id");

    useEffect(() => {
        if (type === "btc") {
            const url = import.meta.env.VITE_BACKEND_URL + `/btcpay-webhook-events?invoice_id=${clientInvoiceId}`
            const eventSource = new EventSource(url);
            
            eventSource.onmessage = (event) => {
                console.log(`Received new btcpay webhook data: ${event.data}`);
                const webhookData = JSON.parse(event.data);

                setInvoiceState(webhookData.state);
            };
            
            eventSource.onerror = (error) => {
                console.error("EventSource failed:", error);
            };
            
            return () => {
                eventSource.close();
            };
        }
    }, []);
    
    if (type == "btc") {
        // If state is Settled, send an email with the ePub
        return <OrderStatusBTC state={invoiceState} invoice_id={clientInvoiceId} />    
    } 
}

function OrderStatusBTC(props) {
    return (
        <div className="flex flex-col mx-auto px-4 max-w-prose gap-4 h-screen text-slate-200 text-xs m-6">
            <Header />
            <Divider />
            <h1>Order Status: {props.state}</h1>
            <p>
                Once payment has settled we will send the guide to the email you provided. 
                Your invoice ID is {props.invoice_id}. Please keep it for your records.
            </p>
            <Footer />
        </div>
    );
}
