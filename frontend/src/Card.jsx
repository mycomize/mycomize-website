import shroomPic from '/growing-shroom.jpg';
import Divider from './Divider';
import githubLogo from '/icons8-github-32.png'
import instaLogo from '/icons8-instagram-50.png'
import xLogo from '/icons8-x-logo-30.png'

function Card() {
    return (
        <div className="flex flex-col gap-4 h-screen text-slate-300 text-xs m-6">
            <h1 className="text-red-500 text-2xl text-center">shroomsathome</h1>
            <img className="rounded-lg" src={shroomPic}/>
            <p className="text-gray-400 text-center text-xs italic">A concise, step-by-step guide to mushroom cultivation</p>
            <Divider />
            <ul className="list-inside list-disc">
               <li className="pb-2">Do you want to grow your own mushrooms but are unsure where to start?</li> 
               <li className="pb-2">Do you feel overwhelmed by the vast sea of cultivation information found online?</li>
               <li>Do you want to avoid wasting time and money on methods that may not work or yield much?</li>
            </ul>
            <p><span className="font-bold">Mushroom lovers</span>: do any of these questions resonate with you? If so, then you've come to the right place.</p> 
            
            <p><span className="text-red-500 italic">Shrooms At Home</span> is a concise yet complete guide for getting started
             growing mushrooms. This guide distills the vast sea of information found online into the essential elements
             needed for a successful grow. It describes everything you will need, from the methods to follow to the 
             materials to purchase.
             <br/>
             <br/>
            <span className="text-red-500 italic">Shrooms At Home</span> is the guide I wish I had when I started
            growing. It contains all the research, experimentation, and trial and error that I've put into my own
            methods over the years, so you don't have to, saving you time and money.
             <br/>
             <br/>
            When you buy <span className="text-red-500 italic">Shrooms At Home</span>, you get access not only
            to the methods I use today, but also any enhancements or improvements to my methods that I make in the future.
            </p>
            <div className="mt-auto mb-6">
                <Divider />
                <div className="text-center mt-3">
                    <p>made with &#x1F344; by Connor Davis</p>
                    <div className="flex flex-row gap-2 items-center justify-center mt-2">
                        <a href="https://github.com/cjams"><img className="w-6 h-6" src={githubLogo}/></a>
                        <a href="https://www.instagram.com/cjamsoninsta?igsh=bnJvMWtoc3FueWs5"><img className="w-6 h-6" src={instaLogo}/></a>
                        <a href="https://x.com/cjamsonx"><img className="w-6 h-6" src={xLogo}/></a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Card;