import btcLogo from "/bitcoin-btc-logo.png";
import creditCardLogo from "/icons8-credit-card-80.png";

export function StripePayButton(props) {
  return (
    <button
      className="w-full inline-flex items-center justify-center gap-x-2 rounded-lg text-white sm:text-lg font-semibold px-2 py-1 self-center bg-blue-600 shadow-md shadow-gray-600 hover:bg-gray-800" 
      onClick={props.onClick}
      type="submit"
    >
      <img className="max-h-8 max-w-8" src={creditCardLogo} />
      Pay with card
    </button>
  );
}

export function BTCPayButton(props) {
  return (
    <button
      className="w-full inline-flex items-center justify-center gap-x-2 rounded-lg text-white sm:text-lg font-semibold px-2 py-1 self-center bg-[#F7931A] shadow-md shadow-gray-600 hover:bg-gray-800"
      onClick={props.onClick}
      type="submit"
    >
      <img className="max-h-8 max-w-8 ml-4" src={btcLogo} />
      Pay with bitcoin
    </button>
  );
}

export function GrowButton(props) {
  return (
    <button
      className="inline-flex items-center justify-center gap-x-3 min-h-14 min-w-38 max-w-38 rounded font-semibold text-lg text-white sm:text-xl px-2 py-1 self-center bg-blue-600 shadow-md shadow-gray-600 hover:bg-gray-800"
      onClick={props.onClick}
    >
      &#x1F344; Start growing now
    </button>
  );
}

export function OKButton(props) {
  return (
    <button
      className="w-full inline-flex items-center justify-center gap-x-3 min-h-10 min-w-38 max-w-38 rounded font-semibold text-white text-lg px-2 py-1 self-center bg-blue-600 shadow-md shadow-gray-600 hover:bg-gray-800"
      onClick={props.onClick}
      type="submit"
    >
      OK
    </button>
    
  )
}

export function TryAgainButton(props) {
  return (
    <button
      className="inline-flex items-center justify-center my-auto gap-x-3 h-14 w-48 rounded font-semibold text-lg px-2 py-1 self-center bg-blue-600 shadow-md shadow-gray-600 hover:bg-gray-800"
      onClick={props.onClick}
    >
      Try Again
    </button>
  );
  
}
