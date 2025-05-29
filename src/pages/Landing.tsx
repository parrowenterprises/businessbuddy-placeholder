import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CreditCardIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Simple Customer Management',
    description: 'Add customers in seconds with easy contact and address tracking.',
    icon: UserGroupIcon,
  },
  {
    name: 'Professional Quotes',
    description: 'Create and send professional quotes that win you more business.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Easy Scheduling',
    description: 'Manage your jobs and schedule with a simple calendar view.',
    icon: HomeIcon,
  },
  {
    name: 'Get Paid Faster',
    description: 'Send invoices with payment links for instant online payments.',
    icon: CreditCardIcon,
  },
];

const serviceTypes = [
  { name: 'House Cleaning', icon: '🏠', color: 'bg-blue-50' },
  { name: 'Yard Work', icon: '🌱', color: 'bg-green-50' },
  { name: 'Handyman', icon: '🔧', color: 'bg-yellow-50' },
  { name: 'Laundry', icon: '👕', color: 'bg-purple-50' },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'House Cleaning Business Owner',
    content: 'BusinessBuddy transformed how I manage my cleaning service. The professional quotes and easy scheduling are game-changers.',
    rating: 5,
  },
  {
    name: 'Mike Chen',
    role: 'Handyman Service',
    content: 'Getting paid used to be a hassle. Now with BusinessBuddy, I send invoices and get paid instantly. Absolutely love it!',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Lawn Care Professional',
    content: 'The customer management features help me stay organized and provide better service. Worth every penny!',
    rating: 5,
  },
];

export default function Landing() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="sr-only">BusinessBuddy</span>
              <img className="h-8 w-auto" src="/logo.svg" alt="BusinessBuddy" />
            </Link>
          </div>
          <div className="flex gap-x-8">
            <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Pricing
            </Link>
            <Link to="/features" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Features
            </Link>
          </div>
          <div className="flex flex-1 justify-end items-center gap-x-6">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Start Free
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero section */}
        <div className="relative isolate pt-24">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mx-auto max-w-2xl text-center"
              >
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Run Your Service Business Like a Pro
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  The all-in-one platform for service businesses. Handle customers, quotes, scheduling, and payments with ease.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    to="/register"
                    className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 hover:bg-primary/90"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    to="/pricing"
                    className="text-sm font-medium text-gray-900 hover:text-primary transition-colors duration-200"
                  >
                    View pricing <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Service types section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Perfect for Your Service Business
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Join thousands of service professionals who've streamlined their business with BusinessBuddy
              </p>
            </motion.div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                {serviceTypes.map((service) => (
                  <motion.div
                    key={service.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className={`flex flex-col items-center ${service.color} p-6 rounded-2xl hover:scale-105 transition-transform duration-200`}
                  >
                    <dt className="text-4xl mb-4">{service.icon}</dt>
                    <dd className="text-base font-semibold leading-7 text-gray-900">
                      {service.name}
                    </dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl lg:text-center"
            >
              <h2 className="text-base font-semibold leading-7 text-primary">Everything You Need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Simple Tools for Growing Your Business
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Focus on serving your customers - we'll handle the business stuff.
              </p>
            </motion.div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="flex flex-col bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                      <feature.icon className="h-6 w-6 flex-none text-primary" aria-hidden="true" />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Testimonials section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Loved by Service Professionals
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                See what others are saying about BusinessBuddy
              </p>
            </motion.div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mt-20 lg:max-w-none lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex gap-x-1 text-primary">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 flex-none fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-lg leading-7 text-gray-600">{testimonial.content}</p>
                  <div className="mt-6 flex items-center">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="mt-1 text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative isolate overflow-hidden bg-gradient-to-r from-primary to-secondary px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16"
            >
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Start Growing Your Business Today
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/90">
                Try BusinessBuddy free for your first 10 customers. No credit card required.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/register"
                  className="rounded-full bg-white px-5 py-3 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors duration-200"
                >
                  Get started
                </Link>
                <Link
                  to="/pricing"
                  className="text-sm font-medium text-white hover:text-white/90 transition-colors duration-200"
                >
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
          <div className="flex items-center justify-between">
            <img className="h-8 w-auto" src="/logo-white.svg" alt="BusinessBuddy" />
            <p className="text-sm leading-5 text-gray-400">
              &copy; {new Date().getFullYear()} BusinessBuddy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 