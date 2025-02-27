import { useEffect, useState } from "react";

import Footer from "./Footer";
import Divider, { DividerDark } from "./Divider";
import { MycomizeHeader } from "./MycomizeHeader";
import { MycomizeFooter } from "./MycomizeFooter";

import shroomPic from "/growing-shroom.jpg";
import kindleLogo from "/icons8-amazon-kindle-50.png";

import { BTCPayButton, StripePayButton, OKButton } from "./Button";

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

export function CheckoutPage(props) {
  const [email, setEmail] = useState("");
  const [payOption, setPayOption] = useState("");
  const [orderState, setOrderState] = useState("");
  const [price, setPrice] = useState(0.0);
  const [tax, setTax] = useState(0.0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = await checkout(email, payOption);
    
    if (data.hasOwnProperty("order_state")) {
      console.log(data.order_state);
      setOrderState(data.order_state);
    } else if (data.hasOwnProperty("error")) {
      console.log(data.error);
      setOrderState(data.error);
    } else if (data.hasOwnProperty("checkout_link")) {
      console.log(data.checkout_link);
      window.location.href = data.checkout_link;
    }
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
      <div className="flex flex-col gap-4 mx-4 mt-4 text-gray-900">
        <h1 className="font-bold text-lg sm:text-2xl my-3">Checkout</h1>
        <DividerDark />
        {orderState === "" && <PaymentForm handleSubmit={handleSubmit} email={email} setEmail={setEmail} price={price} tax={tax} handlePayClick={handlePayClick} payOption={payOption}/>}
        {orderExists(orderState) && <OrderExistsBlurb orderState={orderState} setOrderState={setOrderState} modalClose={props.onClose} />}
        {orderState.startsWith("error_") && <ServerErrorBlurb setOrderState={setOrderState} modalClose={props.onClose} />}
        <MycomizeFooter />
      </div>
    </>
  );
}

function orderExists(orderState) {
  return orderState === "Settled" || orderState === "Fulfilled" || orderState === "Processing Payment" ||
         orderState === "Expired" || orderState === "Canceled" || orderState === "Failed";
}

function PaymentForm(props) {
  return (
    <>
        <form className="flex flex-col mb-6" onSubmit={props.handleSubmit} method="dialog">
          <p className="text-lg mb-5">
            Provide your email to receive instant access on Web &#x1f310;, ePub
            &#x1f4d6;, and Kindle
            <img className="inline max-w-4 max-h-4" src={kindleLogo} /> formats.
          </p>
          <label className="font-semibold text-xl" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="block w-full rounded px-3 py-1.5 mb-5 h-11 text-md shadow-sm bg-gray-100 shadow-gray-500 placeholder:text-gray-400 text-gray-900 focus:border-2 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/25"
            value={props.email}
            onChange={(e) => props.setEmail(e.target.value)}
            required
          />
          <div className="flex flex-row gap-2 mt-4 mb-6">
            <img className="circle object-cover w-12 h-12 sm:w-16 sm:h-16" src={shroomPic} />
            <div className="ml-auto my-auto">
              <p className="text-lg text-right font-semibold">
                Fundamentals of Cultivation x 1
              </p>
            </div>
          </div>
          <div className="flex flex-col rounded bg-gray-100 p-4 pt-5 pb-6 shadow-md">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
            <div className="flex flex-row text-md mb-2">
              <p>Subtotal</p>
              <p className="ml-auto font-bold">${props.price.toFixed(2)}</p>
            </div>
            <DividerDark />
            <div className="flex flex-row text-md mt-2 mb-2">
              <p>Tax</p>
              <p className="ml-auto font-bold">${props.tax.toFixed(2)}</p>
            </div>
            <DividerDark />
            <div className="flex flex-row text-md mt-2 mb-2">
              <p className="font-bold">Order Total</p>
              <p className="ml-auto font-bold">${(props.price + props.tax).toFixed(2)}</p>
            </div>
            <div className="flex flex-col text-sm gap-y-5 mt-2">
              <StripePayButton onClick={props.handlePayClick} payOption={props.payOption} />
              <BTCPayButton onClick={props.handlePayClick} payOption={props.payOption} />
            </div>
          </div>
        </form>
    </>
  );
}

function ServerErrorBlurb(props) {
  const handleOKClick = () => {
    props.setOrderState("");
    props.modalClose();
  };

  return (
    <>
      <form method="dialog">
          <div className="flex flex-col rounded bg-white text-gray-900 p-4 pt-5 pb-6 gap-y-7">
            <h3 className="font-bold text-xl mb-3">Order Error &#x274C;</h3>
            <p className="text-lg">There was an error processing your order. Please try again.
               <br/><br/>If the issue persists, please reach out for <a href="/contact" className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600">support</a>.
            </p>
            <OKButton onClick={handleOKClick} />
          </div>
      </form>
    </>
  );
}

function OrderExistsBlurb(props) {
  let text = "";
  let header = "";
  
  const handleOKClick = () => {
    props.setOrderState("");
    props.modalClose();
  };

  if (props.orderState === "Processing Payment") {
    header = <h3 className="font-bold text-xl">Order Status: &#x231b; Processing Payment</h3>
    text = <p className="text-lg">We've received your order and are currently waiting for payment confirmation. You will
              receive an email with a link to the guide once payment is confirmed.
              <br/><br/>If you don't see an email from <strong>mycomize.com</strong>, please check your spam folder.
           </p>
            
  } else if (props.orderState === "Settled") {
    header = <h3 className="font-bold text-xl">Order Status: &#x1f4b0; Settled</h3>
    text = <p className="text-lg">We've received your order and payment. You will receive an email with a link to the guide soon.
          <br/><br/>If you don't see an email from <strong>mycomize.com</strong>, please check your spam folder. 
          If you still don't see one, please reach out for <a className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600" href="/contact">support</a>.
          </p>
  } else if (props.orderState === "Fulfilled") {
    header = <h3 className="font-bold text-xl">Order Status: &#x2705; Fulfilled</h3>
    text = <p className="text-lg">We've received your order and payment. You will receive an email with a link to the guide soon.
          <br/><br/>If you don't see an email from <strong>mycomize.com</strong>, please check your spam folder. 
          If you still don't see one, please reach out for <a className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600" href="/contact">support</a>.
          </p>
  } else if (props.orderState === "Expired") {
    header = <h3 className="font-bold text-xl">Order Status: &#x23F0; Expired</h3>
    text = <p className="text-lg">Your invoice has expired. Please try again.
              <br/><br/>If the issue persists, please reach out for <a href="/contact" className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600">support</a>.
           </p>
  } else if (props.orderState == "Failed") {
    header = <h3 className="font-bold text-xl">Order Status: &#x274C; Failed</h3>
    text = <p className="text-lg">Your order has failed to process. Please try again.
              <br/><br/>If the issue persists, please reach out for <a href="/contact" className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600">support</a>.
           </p>
  } else if (props.orderState == "Canceled") {
    header = <h3 className="font-bold text-xl">Order Status: &#x1F6AB; Canceled</h3>
    text = <p className="text-lg">Your order was canceled. Please try again.
              <br/><br/>If the issue persists, please reach out for <a href="/contact" className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600">support</a>.
           </p>
  }

  return (
    <>
      <form method="dialog">
        <div className="flex flex-col rounded bg-white text-gray-900 p-4 pt-5 pb-6 gap-y-7">
          {header}
          {text}
          <OKButton onClick={handleOKClick} />
        </div>
      </form>
    </>
  );
}
