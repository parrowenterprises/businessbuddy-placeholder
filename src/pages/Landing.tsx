import { Link } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Add customers in seconds',
    description: 'Keep track of all your customers in one place, with easy access to their contact info and service history.',
    icon: UserGroupIcon,
  },
  {
    name: 'Create professional quotes',
    description: 'Send polished, professional quotes that help you win more business and look established.',
    icon: ClipboardDocumentListIcon,
  },
  {
    name: 'Schedule jobs easily',
    description: 'Manage your calendar and never double-book or forget an appointment again.',
    icon: CalendarIcon,
  },
  {
    name: 'Get paid faster',
    description: 'Send professional invoices and accept payments online - no more chasing checks!',
    icon: CurrencyDollarIcon,
  },
];

const serviceTypes = [
  { name: 'House Cleaning', emoji: '🏠' },
  { name: 'Yard Work', emoji: '🌱' },
  { name: 'Handyman', emoji: '🔧' },
  { name: 'Laundry', emoji: '👕' },
];

export default function Landing() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="sr-only">BusinessBuddy</span>
              <img className="h-8 w-auto" src="/logo.svg" alt="BusinessBuddy" />
            </Link>
          </div>
          <div className="flex flex-1 justify-end">
            <Link
              to="/auth/login"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero section */}
        <div className="relative isolate pt-14">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Manage Your Side Hustle Like a Pro
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Simple tools to handle customers, quotes, scheduling, and invoicing. Perfect for home services and small businesses.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    to="/auth/register"
                    className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Start Free Trial
                  </Link>
                  <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                    Learn more <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service types section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Join thousands of side-hustlers who've organized their business
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Perfect for all types of service businesses
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                {serviceTypes.map((service) => (
                  <div key={service.name} className="flex flex-col items-center">
                    <dt className="text-4xl mb-2">{service.emoji}</dt>
                    <dd className="text-base leading-7 text-gray-600">{service.name}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div id="features" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Simple tools for growing businesses
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Focus on serving your customers - we'll handle the business stuff.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                      <feature.icon className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} BusinessBuddy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 