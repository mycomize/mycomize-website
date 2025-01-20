import shroomPic from '/growing-shroom.jpg';
import Divider from './Divider';

function Header() {
    return (
    <>
        <h1 className="text-red-500 text-2xl text-center">shroomsathome</h1>
        <img className="rounded-full" src={shroomPic}/>
        <p className="text-gray-400 text-center text-xs italic">A concise, step-by-step guide to mushroom cultivation</p>
    </>
    );
}

export default Header;