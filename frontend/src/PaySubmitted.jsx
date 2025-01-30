import { useSearchParams } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import Divider from "./Divider";

export function PaySubmitted() {
    const [searchParams, setSearchParams] = useSearchParams();
    const type = searchParams.get("type");

    if (type === "btc") {
        return <PaySubmittedBTC />;
    }
}

function PaySubmittedBTC() {
    return (
        <div className="flex flex-col mx-auto px-4 max-w-prose gap-4 h-screen text-slate-200 text-xs m-6">
            <Header />
            <Divider />
            <h1>Order Recieved</h1>
            <p>
                Once payment has settled we will send an email to you with the
                guide!
            </p>
            <Footer />
        </div>
    );
}
