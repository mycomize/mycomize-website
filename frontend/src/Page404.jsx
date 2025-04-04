import { Footer } from "./Footer";
import { Header } from "./Header";

export function FullPage404() {
    return (
        <>
            <div id="page_404" className="min-h-screen flex flex-col">
                <Header />
                <Page404 />
                <Footer />
            </div>
        </>
    );
}

export function Page404() {
    return (
      <>
        <main className="grid h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <p className="text-xl font-raleway font-semibold text-blue-600">404</p>
            <h1 className="mt-4 text-5xl font-raleway font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
              Page not found
            </h1>
            <p className="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
              Sorry, we couldn’t find the page you’re looking for.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Go back home
              </a>
              <a href="/contact" className="text-sm font-semibold text-gray-900">
                Contact support <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }
