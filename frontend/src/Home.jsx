'use client'

import React from 'react';
import { MycomizeHeader } from './MycomizeHeader';
import { MycomizeFooter } from './MycomizeFooter';

import mush0 from '/mush0.jpg';
import mush1 from '/mush1.jpg';
import mush2 from '/mush2.jpg';
import mush3 from '/mush3.jpg';
import mush4 from '/mush4.jpg';

export function Home() {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <MycomizeHeader />
        <MycomizeHome />
        <MycomizeFooter />
      </div>
    </>
  );
}

function MycomizeHome() {
  return (
    <div className="bg-white">
      <main>
        <div className="relative isolate">
          <svg
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
          >
            <defs>
              <pattern
                x="50%"
                y={-1}
                id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)" width="100%" height="100%" strokeWidth={0} />
          </svg>
          <div
            aria-hidden="true"
            className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 pt-20 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
          >
            <div
              style={{
                clipPath:
                  'polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)',
              }}
              className="hidden sm:block sm:aspect-[801/800] sm:w-[50.0625rem] sm:bg-gradient-to-tr sm:from-[#EF4444] sm:to-[#2563EB] sm:opacity-30"
            />
          </div>
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 sm:pb-32 pb-8 pt-16 sm:pt-48 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900 sm:text-6xl">
                    Democratizing access to the healing power of mushrooms
                  </h1>
                  <p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:max-w-md sm:text-xl/8 lg:max-w-none">
                    Mycomize leverages technology and education to bring the benefits of mushrooms to everyone
                  </p>
                  <div className="mt-14 flex items-center gap-x-6">
                    <a
                      href="/guides"
                      className="mx-auto sm:mx-0 rounded-md bg-blue-600 px-3.5 py-2.5 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Get started
                    </a>
                  </div>
                </div>
                <div className="mt-24 flex gap-4 overflow-clip sm:hidden">
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
                <div className="hidden mt-14 sm:flex justify-end sm:gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <div className="relative">
                      <img
                        alt=""
                        src={mush0}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className="relative">
                      <img
                        alt=""
                        src={mush1}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <img
                        alt=""
                        src={mush2}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <div className="relative">
                      <img
                        alt=""
                        src={mush3}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <img
                        alt=""
                        src={mush4}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


