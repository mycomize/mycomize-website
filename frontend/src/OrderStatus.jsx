import { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import Divider from "./Divider";

async function getInvoice(invoice_id) {
    try {
        // TODO: move body into query parameter
        const url = import.meta.env.VITE_BACKEND_URL + "/invoice";
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ invoice_id: invoice_id })
        });
        
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
    const [invoiceEmail, setInvoiceEmail] = useState("");
    const [invoiceState, setInvoiceState] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const type = searchParams.get("type");

    useEffect(() => {
        const getInvoiceState = async () => {
            if (type === "btc") {
                const invoice_id = searchParams.get("invoice_id");
                const invoice = await getInvoice(invoice_id);
                    
                setInvoiceEmail(invoice.email);
                setInvoiceState(invoice.state);
            }
        }
        
        getInvoiceState();
    }, []);
    
    if (type == "btc") {
        return <OrderStatusBTC email={invoiceEmail} state={invoiceState} />    
    } 
}

function OrderStatusBTC(props) {
    return (
        <div className="flex flex-col mx-auto px-4 max-w-prose gap-4 h-screen text-slate-200 text-xs m-6">
            <Header />
            <Divider />
            <h1>Order Status: {props.state}</h1>
            <p>
                Once payment has settled we will send an email to {props.email} with the
                guide!
            </p>
            <Footer />
        </div>
    );
}
