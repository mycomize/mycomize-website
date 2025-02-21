import githubLogo from '/icons8-github-32.png'
import instaLogo from '/icons8-instagram-50.png'
import xLogo from '/icons8-x-logo-30.png'
import Divider from './Divider';

function Footer() {
    return (
        <div className="mt-auto mb-2">
            <Divider />
            <div className="text-center mt-4 pb-4 text-xs sm:text-lg text-gray-400">
                <p className="">made with &#x1F344; by Connor Davis</p>
                <div className="flex flex-row gap-2 items-center justify-center mt-2">
                    <a href="https://github.com/cjams/shroomsathome"><img className="w-6 h-6 sm:w-8 sm:h-8" src={githubLogo}/></a>
                    <a href="https://www.instagram.com/cjamsoninsta?igsh=bnJvMWtoc3FueWs5"><img className="w-6 h-6 sm:w-8 sm:h-8" src={instaLogo}/></a>
                    <a href="https://x.com/cjamsonx"><img className="w-6 h-6 sm:w-8 sm:h-8" src={xLogo}/></a>
                </div>
            </div>
        </div>
    );
}

export default Footer;