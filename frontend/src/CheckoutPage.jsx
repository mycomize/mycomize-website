import { useEffect, useState } from "react";
import { DividerDark } from "./Divider";
import { Footer } from "./Footer";
import { BTCPayButton, StripePayButton, OKButton } from "./Button";
import shroomPic from "/growing-shroom.webp";

async function checkout(email, payOption, guide, city, state, zipcode, country) {
  try {
    const url = import.meta.env.VITE_BACKEND_URL + "/checkout";
    let checkout_body = "";
    
    if (payOption === "btc") {
      checkout_body = JSON.stringify({
        email: email, type: payOption, id: guide.id,
        city: city, state: state, zipcode: zipcode, country: country
      });
    } else {
      checkout_body = JSON.stringify({
        email: email, type: payOption, id: guide.id,
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: checkout_body,
    });

    if (response.ok) {
      return await response.json();
    } else {
      return { error: `error_Server_Error: ${response.status}` };
    }
  } catch (error) {
    return { error: `error_Server_Error: ${error}` };
  }
}

export function CheckoutPage(props) {
  const [email, setEmail] = useState("");
  const [orderState, setOrderState] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [country, setCountry] = useState("");

  const defaultGuide = {
    id: "none",
    title: "",
    price: 0.00,
    image: "",
  };

  const guide = props.guide || defaultGuide;

  const handleSubmitPaymentForm = async (event) => {
    event.preventDefault();
    const submitter = event.nativeEvent.submitter;
    
    if (submitter && submitter.name === "stripe") {
      const data = await checkout(email, "stripe", guide, '', '', '', '');
      
      console.log(data);
    
      if (data.hasOwnProperty("order_state")) {
        setOrderState(data.order_state);
      } else if (data.hasOwnProperty("error")) {
        setOrderState(data.error);
      } else if (data.hasOwnProperty("checkout_link")) {
        window.location.href = data.checkout_link;
      } 
    } else if (submitter && submitter.name === "btc") {
      setOrderState("BTCOrder");
    }
  }; 
  
  const handleSubmitBTCPaymentForm = async (event) => {
    event.preventDefault()
    const data = await checkout(email, "btc", guide, city, state, zipcode, country);

    if (data.hasOwnProperty("order_state")) {
      setOrderState(data.order_state);
    } else if (data.hasOwnProperty("error")) {
      setOrderState(data.error);
    } else if (data.hasOwnProperty("checkout_link")) {
      window.location.href = data.checkout_link;
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target === props.parentDialog) {
        setOrderState("");
      }
    };
      
    if (props.parentIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [props.parentIsOpen, props.parentDialog]);
  
  return (
    <>
      <div className="flex flex-col gap-4 mx-4 mt-4 text-gray-900">
        <h1 className="font-bold text-lg sm:text-2xl my-3">Checkout</h1>
        <DividerDark />
        {orderState === "" && <PaymentForm email={email} setEmail={setEmail} guide={guide} handleSubmit={handleSubmitPaymentForm} />}
        {orderState === "BTCOrder" && <BTCPaymentForm 
          email={email} 
          setEmail={setEmail} 
          guide={guide} 
          handleSubmit={handleSubmitBTCPaymentForm}
          city={city}
          setCity={setCity}
          state={state}
          setState={setState}
          country={country}
          setCountry={setCountry}
          zipcode={zipcode}
          setZipcode={setZipcode}
        />}
        {orderExists(orderState) && <OrderExistsBlurb orderState={orderState} setOrderState={setOrderState} modalClose={props.onClose} />}
        {orderState.startsWith("error_") && <ServerErrorBlurb orderState={orderState} setOrderState={setOrderState} modalClose={props.onClose} />}
        <Footer />
      </div>
    </>
  );
}

function orderExists(orderState) {
  return orderState === "Settled" || orderState === "Fulfilled" || orderState === "Processing Payment" ||
         orderState === "Expired" || orderState === "Canceled" || orderState === "Failed";
}

function BTCPaymentForm({ email, setEmail, guide, handleSubmit, city, setCity, state, setState, country, setCountry, zipcode, setZipcode }) {
  return (
    <>
        <form className="flex flex-col mb-6" id="payment-form" method="dialog" onSubmit={handleSubmit}>
          <p className="text-lg mb-5">
            Provide your email to receive access to PDF and ePub versions of the guide.
            <br/><br/>
            Address information is only required for sales tax purposes.
          </p>
          <label className="font-semibold text-lg" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="block w-full rounded px-3 py-1.5 mb-5 h-11 text-md shadow-sm bg-gray-100 shadow-gray-500 placeholder:text-gray-400 text-gray-900 focus:border-2 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/25"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-5">
            <div>
              <label className="font-semibold text-lg" htmlFor="city">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder=""
                className="block w-full rounded px-3 py-1.5 h-11 text-md shadow-sm bg-gray-100 shadow-gray-500 placeholder:text-gray-400 text-gray-900 focus:border-2 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/25"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-lg" htmlFor="state">
                State/Province 
              </label>
              <input
                id="state"
                name="state"
                type="text"
                placeholder=""
                className="block w-full rounded px-3 py-1.5 h-11 text-md shadow-sm bg-gray-100 shadow-gray-500 placeholder:text-gray-400 text-gray-900 focus:border-2 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/25"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-lg" htmlFor="zipcode">
                Zip/Postal Code
              </label>
              <input
                id="zipcode"
                name="zipcode"
                type="text"
                placeholder=""
                className="block w-full rounded px-3 py-1.5 h-11 text-md shadow-sm bg-gray-100 shadow-gray-500 placeholder:text-gray-400 text-gray-900 focus:border-2 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/25"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-lg" htmlFor="country">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                placeholder=""
                className="block w-full rounded px-3 py-1.5 h-11 text-md shadow-sm bg-gray-100 shadow-gray-500 placeholder:text-gray-400 text-gray-900 focus:border-2 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/25"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col rounded bg-gray-100 p-4 pt-5 pb-6 shadow-md">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
              <div className="flex flex-row gap-2 mt-2 mb-3">
                <img className="circle object-cover w-12 h-12 sm:w-16 sm:h-16" src={shroomPic} />
                <div className="ml-auto my-auto">
                  <p className="text-md text-right font-semibold">
                    {guide.title}
                  </p>
                </div>
              </div>
            <DividerDark />
            <div className="flex flex-row text-md mb-5 mt-4">
              <p>Subtotal</p>
              <p className="ml-auto font-bold">${guide.price.toFixed(2)} + tax</p>
            </div>
            <DividerDark />
            <div className="flex flex-col text-sm gap-y-5 mt-5">
              <BTCPayButton />
            </div>
          </div>
        </form>
    </>
  );
}

function PaymentForm({ email, setEmail, guide, handleSubmit }) {
  return (
    <>
        <form className="flex flex-col mb-6" id="payment-form" method="dialog" onSubmit={handleSubmit} >
          <p className="text-lg mb-5">
            Provide your email to receive access to PDF and ePub versions of the guide.
          </p>
          <label className="font-semibold text-lg" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="block w-full rounded px-3 py-1.5 mb-5 h-11 text-md shadow-sm bg-gray-100 shadow-gray-500 placeholder:text-gray-400 text-gray-900 focus:border-2 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/25"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex flex-col rounded bg-gray-100 p-4 pt-5 pb-6 shadow-md">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
              <div className="flex flex-row gap-2 mt-2 mb-3">
                <img className="circle object-cover w-12 h-12 sm:w-16 sm:h-16" src={shroomPic} />
                <div className="ml-auto my-auto">
                  <p className="text-md text-right font-semibold">
                    {guide.title}
                  </p>
                </div>
              </div>
            <DividerDark />
            <div className="flex flex-row text-md mt-4 mb-5">
              <p>Subtotal</p>
              <p className="ml-auto font-bold">${guide.price.toFixed(2)} + tax</p>
            </div>
            <DividerDark />
            <div className="flex flex-col text-sm gap-y-5 mt-5">
              <StripePayButton />
              <BTCPayButton />
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

  const err_msg = props.orderState.replace(/_/g, " ").replace(/^error/, "");

  return (
    <>
      <form method="dialog">
          <div className="flex flex-col rounded bg-white text-gray-900 p-4 pt-5 pb-6 gap-y-7">
            <h3 className="font-bold text-xl mb-3">Order Error &#x274C;</h3>
            <p className="text-lg">There was an error processing your order:
              <span className="text-lg font-semibold"><em>&#32;{err_msg}</em></span>
               <br/><br/>Please try again. If the issue persists, please reach out for &#32;
               <a href="/contact" className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600">support</a>.
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
          If you still don't see one, please reach out for &#32; <a className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600" href="/contact">support</a>.
          </p>
  } else if (props.orderState === "Fulfilled") {
    header = <h3 className="font-bold text-xl">Order Status: &#x2705; Fulfilled</h3>
    text = <p className="text-lg">We've received your order and payment. You will receive an email with a link to the guide soon.
          <br/><br/>If you don't see an email from <strong>mycomize.com</strong>, please check your spam folder. 
          If you still don't see one, please reach out for &#32; <a className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600" href="/contact">support</a>.
          </p>
  } else if (props.orderState === "Expired") {
    header = <h3 className="font-bold text-xl">Order Status: &#x23F0; Expired</h3>
    text = <p className="text-lg">Your invoice has expired. Please try again.
              <br/><br/>If the issue persists, please reach out for &#32; <a href="/contact" className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600">support</a>.
           </p>
  } else if (props.orderState == "Failed") {
    header = <h3 className="font-bold text-xl">Order Status: &#x274C; Failed</h3>
    text = <p className="text-lg">Your order has failed to process. Please try again.
              <br/><br/>If the issue persists, please reach out for &#32; <a href="/contact" className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600">support</a>.
           </p>
  } else if (props.orderState == "Canceled") {
    header = <h3 className="font-bold text-xl">Order Status: &#x1F6AB; Canceled</h3>
    text = <p className="text-lg">Your order was canceled. Please try again.
              <br/><br/>If the issue persists, please reach out for &#32; <a href="/contact" className="text-blue-600 font-semibold underline underline-offset-4 decoration-2 decoration-blue-600">support</a>.
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
