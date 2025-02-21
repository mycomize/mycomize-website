import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Divider from "./Divider";
import { GrowButton } from "./Button";
import { CheckoutModal } from "./CheckoutModal";

export function Title() {
    return <span className="font-semibold">shrooms@home</span>;
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
                className="flex flex-col mx-auto px-4 max-w-prose gap-4 h-screen text-slate-200 m-6"
            >
                <Header />
                <Divider />
                <h1 className="font-bold text-lg sm:text-2xl my-3">Welcome</h1>
                <p className="">
                    <Title /> is a concise yet complete guide for growing
                    mushrooms at home. It distills the vast sea of cultivation
                    information found online into a practical
                    series of steps. It contains everything you need to get
                    started, from the materials to buy to the methods to follow.
                    <br />
                    <br />
                    <Title /> is a proven method (as you can see from the pics above &#x1f60e;). It includes all the lessons I've
                    learned from trial and error and experimentation so that you
                    don't repeat the same mistakes I've made in the past.
                    <br />
                    <br />
                    <Title /> is designed to help you:
                    <br />
                </p>
                <ul className="space-y-4 ml-5">
                  <li>
                    <span className="font-bold">&#x2702; Cut through the noise</span>{" "}
                    with concise, step-by-step instruction
                  </li>
                  <li>
                    <span className="font-bold">&#x23f3; Save time</span> following a
                    proven method
                  </li>
                  <li>
                    <span className="font-bold">&#x1f6d2; Start growing immediately</span>{" "}
                    with a comprehensive shopping list
                  </li>
                </ul>
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
