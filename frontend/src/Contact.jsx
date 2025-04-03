import { Footer } from "./Footer";
import { Header } from "./Header";

export function Contact() {
    return (
        <div id="contact_container" className="min-h-screen flex flex-col">
            <Header />
            <MycomizeContact />
            <Footer />
        </div>
    );
}

function MycomizeContact() {
    return (
        <div id="contact_page" className="bg-white px-6 py-10 sm:py-20 lg:px-8 flex-grow">
            <div className="mx-auto max-w-3xl text-base/7 text-gray-700">
                <p className="text-base/7 font-raleway font-semibold text-blue-600">Get in touch</p>
                <h1 className="mt-2 text-pretty text-4xl font-raleway font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    Contact Us
                </h1>
                <p className="mt-6 text-xl/8">
                    Need support?
                    <br/>
                    <br/>
                    Have a feature request?
                    <br/>
                    <br/>
                    I'd love to hear from you! Send an email to
                    <a href="mailto:connor@mycomize.com" className="text-blue-600"> connor@mycomize.com </a>
                    or reach out directly over social media using the links at the bottom of the page.
                </p>
            </div>
        </div>
    );
}
