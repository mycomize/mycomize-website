import { useState, useEffect } from "react";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { GrowButton } from "./Button";
import { CheckoutModal } from "./CheckoutModal";
import { DividerDark } from "./Divider";

async function getGuides() {
    try {
        const url = import.meta.env.VITE_BACKEND_URL + "/guides";
        const response = await fetch(url, { method: "GET" });

        if (response.ok) {
            return await response.json();
        }
        console.error("Failed to fetch guides: ", response);
        return null;
    } catch (error) {
        console.error("Exception fetching guides: ", error);
        return null;
    }
}

export function Guides() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [guidesList, setGuidesList] = useState([]);

    const handleModalOpen = (guide) => {
        setModalOpen(true);
        setSelectedGuide(guide);

        const landing = document.getElementById("guide_container");
        landing.style.filter = "blur(6px)";
    };

    const handleModalClose = () => {
        setModalOpen(false);

        const landing = document.getElementById("guide_container");
        landing.style.filter = "none";
    };

    useEffect(() => {
        async function fetchGuides() {
            const guidesData = await getGuides();
            if (guidesData && guidesData.guides) {
                setGuidesList(guidesData.guides);
            }
        }

        fetchGuides();
    }, []);

    return (
        <div id="guide_container" className="min-h-screen flex flex-col">
            <CheckoutModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                guide={selectedGuide}
            />
            <Header />
            <MycomizeGuides onClick={handleModalOpen} guides={guidesList} />
            <Footer />
        </div>
    );
}

function MycomizeGuides({ onClick, guides }) {
    return (
        <div
            id="guide_page"
            className="bg-white px-6 py-10 sm:py-20 lg:px-8 flex-grow"
        >
            <div className="mx-auto max-w-3xl text-base/7 text-gray-700">
                <p className="text-base/7 font-raleway font-semibold text-blue-600">
                    Grow
                </p>
                <h1 className="mt-2 text-pretty text-4xl font-raleway font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    Cultivation Guides
                </h1>
                <p className="mt-6 text-xl/8">
                    There is a vast corpus of videos, blog posts, and forum
                    threads on the Internet about growing mushrooms. This makes
                    it difficult for beginners to know where to start and
                    steepens the already steep learning curve of cultivation.
                    Mycomize cultivation guides are designed to flatten that
                    curve by providing concise yet complete instruction for each
                    step of the growing process.
                </p>
                <div className="mt-6 text-xl max-w-2xl">
                    <ul role="list" className="mt-6  space-y-8 text-gray-600">
                        <li className="flex gap-x-3">
                            <p>
                                <span className="font-bold">
                                    &#x2702; Cut through the noise
                                </span>{" "}
                                with concise, step-by-step instruction
                            </p>
                        </li>
                        <li className="flex gap-x-3">
                            <p>
                                <span className="font-bold">
                                    &#x23f3; Save time
                                </span>{" "}
                                following proven methods
                            </p>
                        </li>
                        <li className="flex gap-x-3">
                            <p>
                                <span className="font-bold">
                                    &#x1f6d2; Start growing immediately
                                </span>{" "}
                                with a comprehensive shopping list
                            </p>
                        </li>
                    </ul>
                </div>
                <p className="mt-6 mb-10 text-xl/8">
                    Choose from the list below to get started!
                </p>
                <DividerDark />
                <GuideList onClick={onClick} guides={guides} />
            </div>
        </div>
    );
}

function GuideList({ onClick, guides }) {
    return (
        <>
            <h1 className="mt-20 mb-4 text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Guide List
            </h1>
            <ul role="list" className="space-y-3">
                {guides && guides.length > 0 ? (
                    guides.map((guide) => (
                        <li
                            key={guide.id}
                            className="grid grid-rows-[auto,auto] gap-2 overflow-hidden rounded-md bg-gray-100 px-6 py-4 shadow-lg"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr,200px] gap-4 items-center">
                                <img
                                    src={guide.image}
                                    alt={guide.title}
                                    className="w-full h-32 object-cover rounded-md self-center sm:order-last"
                                />
                                <div className="mb-2 order-last sm:order-none">
                                    <h3 className="mb-2 text-xl font-raleway font-semibold text-gray-700 mt-2 sm:mt-0">
                                        {guide.title}
                                    </h3>
                                    <p>{guide.description}</p>
                                </div>
                            </div>
                            <div className="flex justify-center sm:justify-start">
                                <GrowButton onClick={() => onClick(guide)} />
                            </div>
                        </li>
                    ))
                ) : (
                    <li className="text-center text-lg py-4">
                        <p>No guides available at the moment.</p>
                    </li>
                )}
            </ul>
        </>
    );
}
