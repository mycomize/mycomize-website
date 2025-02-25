'use client'

import { useState } from 'react'
import { Dialog, DialogPanel, Popover, PopoverButton, PopoverGroup, PopoverPanel } from '@headlessui/react'
import { Bars3Icon, BookOpenIcon, ChartPieIcon, EnvelopeIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'

import { DividerDark } from './Divider';
import mycomizeLogo from '/mycomize-shroom-only.png';

const guides = [
  { name: 'Beginner Cultivation Guide', description: 'A concise, step-by-step guide to cultivating mushrooms', href: '#', icon: ChartPieIcon },
  //{ name: 'Engagement', description: 'Speak directly to your customers', href: '#', icon: CursorArrowRaysIcon },
  //{ name: 'Security', description: 'Your customers’ data will be safe and secure', href: '#', icon: FingerPrintIcon },
  //{ name: 'Integrations', description: 'Connect with third-party tools', href: '#', icon: SquaresPlusIcon },
  //{ name: 'Automations', description: 'Build strategic funnels that will convert', href: '#', icon: ArrowPathIcon },
]

const callsToAction = [
  { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
  { name: 'Contact sales', href: '#', icon: PhoneIcon },
]

const company = [
  { name: 'About us', href: '#', description: 'Learn more about our company values and mission to empower others' },
  {
    name: 'Support',
    href: '#',
    description: 'Get in touch with our dedicated support team or reach out on our community forums',
  },
  { name: 'Blog', href: '#', description: 'Read our latest announcements and get perspectives from our team' },
]

export function MycomizeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
    <header className="bg-white lg:px-4">
      <nav aria-label="Global" className="mx-auto flex max-w-full items-center justify-between p-6 xl:px-10">
        <div className="flex gap-x-3 lg:flex-1 lg:mr-16">
          <a href="/" className="-m-1.5 p-1.5 inline-flex">
            <span className="sr-only">mycomize</span>
            <img
              alt=""
              src={mycomizeLogo}
              className="h-16 w-auto lg:min-w-14"
            />
          <p className="pt-3 ml-3">
            <span className="font-raleway font-semibold text-3xl text-blue-600">myco</span>
            <span className="font-raleway text-3xl text-blue-600">mize</span>
          </p>
          </a>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <PopoverGroup className="hidden lg:flex lg:gap-x-12">
          {/*<Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm/6 lg:text-lg/6 font-semibold text-gray-900">
              Guides 
              <ChevronDownIcon aria-hidden="true" className="size-5 flex-none text-gray-400" />
            </PopoverButton>

            <PopoverPanel
              transition
              className="absolute -left-36 top-full z-10 mt-3 w-screen max-w-md rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
            >
              <div className="p-4">
                {guides.map((item) => (
                  <div
                    key={item.name}
                    className="group relative flex gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50"
                  >
                    <div className="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <item.icon aria-hidden="true" className="size-6 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-auto">
                      <a href={item.href} className="block font-semibold text-gray-900">
                        {item.name}
                        <span className="absolute inset-0" />
                      </a>
                      <p className="mt-1 text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50">
                {callsToAction.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-center gap-x-2.5 p-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-100"
                  >
                    <item.icon aria-hidden="true" className="size-5 flex-none text-gray-400" />
                    {item.name}
                  </a>
                ))}
              </div>
            </PopoverPanel>
          </Popover>*/}

          <a href="/guides" className="text-sm/6 lg:text-lg/6 font-semibold text-gray-900">
            Guides 
          </a>
          <a href="/blog" className="text-sm/6 lg:text-lg/6 font-semibold text-gray-900">
            Blog 
          </a>
          <a href="/contact" className="text-sm/6 lg:text-lg/6 font-semibold text-gray-900">
            Contact 
          </a>

          {/*<Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm/6 lg:text-lg/6 font-semibold text-gray-900">
              Company
              <ChevronDownIcon aria-hidden="true" className="size-5 flex-none text-gray-400" />
            </PopoverButton>

            <PopoverPanel
              transition
              className="absolute -left-8 top-full z-10 mt-3 w-96 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
            >
              {company.map((item) => (
                <div key={item.name} className="relative rounded-lg p-4 hover:bg-gray-50">
                  <a href={item.href} className="block text-sm/6 font-semibold text-gray-900">
                    {item.name}
                    <span className="absolute inset-0" />
                  </a>
                  <p className="mt-1 text-sm/6 text-gray-600">{item.description}</p>
                </div>
              ))}
            </PopoverPanel>
          </Popover> */}
        </PopoverGroup>
        {/*<div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <a href="#" className="text-sm/6 lg:text-lg/6 font-semibold text-gray-900">
            Log in <span aria-hidden="true">&rarr;</span>
          </a>
        </div> */}
      </nav>
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 flex w-full flex-col justify-between overflow-y-auto bg-white sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="p-6">
            <div className="flex">
              <div className="flex gap-x-3 sm:hidden">
                <a href="/" className="-m-1.5 p-1.5 inline-flex">
                  <span className="sr-only">mycomize</span>
                  <img
                    alt=""
                    src={mycomizeLogo}
                    className="h-16 w-auto"
                  />
                <p className="pt-3 ml-3">
                  <span className="font-raleway font-semibold text-3xl text-blue-600">myco</span>
                  <span className="font-raleway text-3xl text-blue-600">mize</span>
                </p>
                </a>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700 justify-self-end ml-auto "
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-4 flow-root">
              <div className="ml-my-6 divide-y divide-gray-300">
                {/*<div className="space-y-2 py-6">
                  {guides.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="group -mx-3 flex items-center gap-x-6 rounded-lg p-3 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                        <item.icon aria-hidden="true" className="size-6 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      {item.name}
                    </a>
                  ))}
                </div> */}
                <div className="py-1" />
                <div className="space-y-2 py-3">
                  <a
                    key="Guides"
                    href='/guides'
                    className="group -mx-3 flex items-center gap-x-6 rounded-lg p-3 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <BookOpenIcon aria-hidden="true" className="size-6 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    Guides 
                  </a>
                  <a
                    key="Blog"
                    href='/blog'
                    className="group -mx-3 flex items-center gap-x-6 rounded-lg p-3 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <PencilIcon aria-hidden="true" className="size-6 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    Blog 
                  </a>
                  <a
                    key="Contact"
                    href='/contact'
                    className="group -mx-3 flex items-center gap-x-6 rounded-lg p-3 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <EnvelopeIcon aria-hidden="true" className="size-6 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    Contact 
                  </a>
                  
                  {/*{company.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </a>
                  ))}*/}
                </div>
                {/*<div className="py-6">
                  <a
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Log in
                  </a>
                </div> */}
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50 text-center">
            {callsToAction.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="p-3 text-base/7 font-semibold text-gray-900 hover:bg-gray-100"
              >
                {item.name}
              </a>
            ))}
          </div>
        </DialogPanel>
      </Dialog>
    </header>
    <DividerDark />
    </>
  )
}
