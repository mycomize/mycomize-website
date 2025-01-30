import { useEffect, useState } from "react";

import Footer from "./Footer";
import Divider, { DividerDark } from "./Divider";

import shroomPic from "/growing-shroom.jpg";
import kindleLogo from "/icons8-amazon-kindle-50.png";

import { BTCPayButton, StripePayButton } from "./Button";

async function checkout(email, payOption) {
  try {
    const url = import.meta.env.VITE_BACKEND_URL + "/checkout";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, type: payOption }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error("Failed to checkout", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error during checkout:", error);
  }
}

async function getPrice() {
  try {
    const url = import.meta.env.VITE_BACKEND_URL + "/price";
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error(
        "Failed to get shroomsathome price",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error during get price:", error);
  }
}

export function CheckoutPage() {
  const [email, setEmail] = useState("");
  const [payOption, setPayOption] = useState("");
  const [price, setPrice] = useState(0.0);
  const [tax, setTax] = useState(0.0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(email);
    console.log(payOption);

    const data = await checkout(email, payOption);

    console.log(data);
    window.location.href = data.checkoutLink;
  };

  const handlePayClick = (event) => {
    setPayOption(event.target.name);
  };

  useEffect(() => {
    async function fetchPrice() {
      const data = await getPrice();

      setPrice(data.price);
      setTax(data.tax);
    }

    fetchPrice();
  }, []);

  return (
    <>
      <div className="flex flex-col gap-4 mx-4 mt-4 text-[#f9fbfd]">
        <h1 className="font-bold text-xl text-center mt-3">
          Grow &#x1F344; @ &#x1f3e0;{" "}
        </h1>
        <ul className="text-xs space-y-4">
          <li>
            <span className="font-bold">&#x2702; Cut through the noise</span>{" "}
            with concise, step-by-step instruction
          </li>
          <li>
            <span className="font-bold">&#x23f3; Save time</span> following a
            proven method
          </li>
          <li>
            <span className="font-bold">&#x1f6d2; Get growing immediately</span>{" "}
            with a comprehensive shopping list
          </li>
        </ul>
        <Divider />
        <form className="flex flex-col" onSubmit={handleSubmit} method="dialog">
          <p className="text-xs mb-2">
            Provide your email to receive instant access on Web &#x1f310;, ePub
            &#x1f4d6;, and Kindle
            <img className="inline max-w-4 max-h-4" src={kindleLogo} /> formats.
          </p>
          <label className="font-semibold" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="block w-full rounded px-3 py-1.5 mb-3 h-11 text-sm shadow-md bg-slate-200 shadow-slate-900 border border-slate-900 placeholder:text-slate-400 text-slate-800 focus:border-2 focus:border-red-500 focus:outline focus:outline-2 focus:outline-red-500/25"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          ></input>
          <div className="flex flex-row gap-2 my-4">
            <img className="circle object-cover w-12 h-12" src={shroomPic} />
            <div className="ml-auto my-auto">
              <p className="text-xs text-right">
                eGuide for mushroom cultivation x 1
              </p>
            </div>
          </div>
          <div className="flex flex-col rounded bg-zinc-800 p-4 pt-5 pb-6">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
            <div className="flex flex-row text-xs mb-2">
              <p>Subtotal</p>
              <p className="ml-auto font-bold">${price.toFixed(2)}</p>
            </div>
            <DividerDark />
            <div className="flex flex-row text-xs mt-2 mb-2">
              <p>Tax</p>
              <p className="ml-auto font-bold">${tax.toFixed(2)}</p>
            </div>
            <DividerDark />
            <div className="flex flex-row text-xs mt-2 mb-2">
              <p className="font-bold">Order Total</p>
              <p className="ml-auto font-bold">${(price + tax).toFixed(2)}</p>
            </div>
            <div className="flex flex-col text-sm gap-y-2 mt-2">
              <StripePayButton onClick={handlePayClick} payOption={payOption} />
              <BTCPayButton onClick={handlePayClick} payOption={payOption} />
            </div>
          </div>
        </form>
        <Footer />
      </div>
    </>
  );
}
