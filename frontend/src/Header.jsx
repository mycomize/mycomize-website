import React, {useRef, useEffect} from 'react';

import mush0 from '/mush0.jpg';
import mush1 from '/mush1.jpg';
import mush2 from '/mush2.jpg';
import mush3 from '/mush3.jpg';
import mush4 from '/mush4.jpg';


function Header() {
    return (
    <>
        <h1 className="text-red-500 text-2xl text-center">shrooms@home</h1>
        <div className="flex gap-4 overflow-clip">
        <div className="flex gap-4 animate-swipe">
            <img className="rounded-md max-w-64 w-48 h-32" src={mush0}/>
            <img className="rounded-md max-w-64 w-48 h-32" src={mush1}/>
            <img className="rounded-md max-w-64 w-48 h-32" src={mush2}/>
            <img className="rounded-md max-w-64 w-48 h-32" src={mush3}/>
            <img className="rounded-md max-w-64 w-48 h-32" src={mush4}/>
        </div>
        <div className="flex gap-4 animate-swipe">
            <img className="rounded-md max-w-64 w-48 h-32" src={mush0}/>
            <img className="rounded-md max-w-64 w-48 h-32" src={mush1}/>
            <img className="rounded-md max-w-64 w-48 h-32" src={mush2}/>
            <img className="rounded-md max-w-64 w-48 h-32" src={mush3}/>
            <img className="rounded-md max-w-64 w-48 h-32" src={mush4}/>
        </div>
        </div>
        <p className="text-gray-400 text-center text-xs italic">A concise, step-by-step guide to mushroom cultivation</p>
    </>
    );
}

export default Header;