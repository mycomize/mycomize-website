import btcLogo from "/bitcoin-btc-logo.png";
import creditCardLogo from "/icons8-credit-card-80.png";

export function StripePayButton(props) {
  return (
    <button
      className="w-full inline-flex items-center justify-center gap-x-2 rounded-lg font-semibold px-2 py-1 self-center border-2 border-indigo-600 bg-indigo-600 shadow-md shadow-black hover:bg-zinc-800"
      onClick={props.onClick}
      type="submit"
      name="stripe"
    >
      <img className="max-h-5 max-w-5" src={creditCardLogo} />
      Pay with card
    </button>
  );
}

export function BTCPayButton(props) {
  return (
    <button
      className="w-full inline-flex items-center justify-center gap-x-2 rounded-lg font-semibold px-2 py-1 self-center border-2 border-[#F7931A] bg-[#F7931A] shadow-md shadow-black hover:bg-zinc-800"
      onClick={props.onClick}
      type="submit"
      name="btc"
    >
      <img className="max-h-5 max-w-5 ml-4" src={btcLogo} />
      Pay with bitcoin
    </button>
  );
}

export function GrowButton(props) {
  return (
    <button
      className="inline-flex items-center justify-center my-auto gap-x-3 min-h-14 min-w-38 max-w-38 rounded font-semibold text-lg px-2 py-1 self-center bg-red-500 shadow-md shadow-black hover:border-2 hover:bg-[#19191a] hover:border-red-500 hover:text-red-500"
      onClick={props.onClick}
    >
      &#x1F344; Start growing now
    </button>
  );
}

export function OKButton(props) {
  return (
    <button
      className="w-full inline-flex items-center justify-center gap-x-3 min-h-10 min-w-38 max-w-38 rounded font-semibold text-lg px-2 py-1 self-center bg-red-500 shadow-md shadow-black hover:border-2 hover:bg-[#19191a] hover:border-red-500 hover:text-red-500"
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
      className="inline-flex items-center justify-center my-auto gap-x-3 h-14 w-48 rounded font-semibold text-lg px-2 py-1 self-center bg-red-500 shadow-md shadow-black hover:border-2 hover:bg-[#19191a] hover:border-red-500 hover:text-red-500"
      onClick={props.onClick}
    >
      Try Again
    </button>
  );
  
}