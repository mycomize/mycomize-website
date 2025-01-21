
export function StripePayButton(props) {
    return (
        <button
            className="inline-flex items-center gap-x-2 min-w-36 rounded-lg font-semibold px-2 py-1 self-center bg-indigo-600 shadow-md shadow-black hover:bg-indigo-500"
            onClick={props.handleClick}
        >
            <img className="max-h-5 max-w-5" src={props.image} />
            {props.text}
        </button>
    )    
    
}

export function BTCPayButton(props) {
    return (
        <button
            className="inline-flex items-center gap-x-2 min-w-36 rounded-lg font-semibold px-2 py-1 self-center bg-green-700 shadow-md shadow-black hover:bg-green-600" 
            onClick={props.handleClick}       
        >
            <img className="max-h-5 max-w-5" src={props.image} />
            {props.text}
        </button>
    );
}