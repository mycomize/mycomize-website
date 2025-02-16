
import Header from "./Header";
import Footer from "./Footer";
import Divider from "./Divider";

function PageNotFound() {
    return (
        <>
            <div
                id="404"
                className="flex flex-col mx-auto px-4 max-w-prose gap-4 h-screen text-slate-200 text-sm m-6"
            >
                <h1 className="text-red-500 text-2xl text-center">404</h1>
                <Divider />
                <div>
                    <h1>Page not found</h1>
                </div>
                <Footer />
            </div>
        </>
    );
}

export default PageNotFound;