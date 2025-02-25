import { MycomizeHeader } from "./MycomizeHeader";
import { MycomizeFooter } from "./MycomizeFooter";

export function Blog() {
    return (
        <div id="blog_container" className="min-h-screen flex flex-col">
        <MycomizeHeader />
        <MycomizeBlog />
        <MycomizeFooter />
        </div>
    );
}

function MycomizeBlog() {
    return (
        <div id="blog_page" className="bg-white px-6 py-10 sm:py-20 lg:px-8 flex-grow">
        <div className="mx-auto max-w-3xl text-base/7 text-gray-700">
            <p className="text-base/7 font-raleway font-semibold text-blue-600">Learn</p>
            <h1 className="mt-2 text-pretty text-4xl font-raleway font-semibold tracking-tight text-gray-900 sm:text-5xl">
                Blog
            </h1>
            <p className="mt-6 text-xl/8">
                Coming Soon!
            </p>
        </div>
        </div>
    );  
}