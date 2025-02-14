import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Divider from "./Divider";
import { GrowButton } from "./Button";
import { CheckoutModal } from "./CheckoutModal";

export function Title() {
    return <span className="font-semibold text-red-500">shrooms @ home</span>;
}

function LandingPage() {
    const [modalOpen, setModalOpen] = useState(false);

    const handleModalOpen = () => {
        setModalOpen(true);

        const landing = document.getElementById("landing");
        landing.style.filter = "blur(2px)";
    };

    const handleModalClose = () => {
        setModalOpen(false);

        const landing = document.getElementById("landing");
        landing.style.filter = "none";
    };

    return (
        <>
            <CheckoutModal isOpen={modalOpen} onClose={handleModalClose} />
            <div
                id="landing"
                className="flex flex-col mx-auto px-4 max-w-prose gap-4 h-screen text-slate-200 text-sm m-6"
            >
                <Header />
                <Divider />
                <ul className="list-inside list-disc">
                    <li className="pb-2">
                        Do you want to grow your own mushrooms but are unsure
                        where to start?
                    </li>
                    <li className="pb-2">
                        Do you feel overwhelmed by the amount of cultivation
                        information found online?
                    </li>
                </ul>
                <p className="mb-8">
                    <Title /> is a concise yet complete guide for growing
                    mushrooms at home. It distills the vast sea of cultivation
                    information found online into a{" "}
                    <span className="underline decoration-red-500 decoration-dotted underline-offset-4 text-red-500">
                        practical
                    </span>{" "}
                    series of steps. It contains everything you need to get
                    started, from the materials to buy to the methods to follow.
                    <br />
                    <br />
                    <Title /> is my method. It includes all the lessons I've
                    learned from trial and error and experimentation so that you
                    don't repeat the same mistakes I've made in the past.
                    <br />
                    <br />
                    Even though my method is proven, I'm always looking for ways
                    to make it better, both in terms of cost and yield. When you
                    buy <Title />, you get access to my method as it stands
                    today, and also any improvements I make in the future.
                </p>
                <GrowButton
                    onClick={handleModalOpen}
                    text="&#x1F344;  Start growing now"
                />
                <Footer />
            </div>
        </>
    );
}

export default LandingPage;
