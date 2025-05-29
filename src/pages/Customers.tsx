import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MagnifyingGlassIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  total_spent?: number;
  last_job_date?: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerCount, setCustomerCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get customer count for limit check
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setCustomerCount(count || 0);

      // Get customers with basic info
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // TODO: Add job history and total spent calculations
      setCustomers(customerData || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleAddCustomer() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, customer_limit')
        .eq('id', user.id)
        .single();

      if (profile?.subscription_tier === 'free' && customerCount >= (profile?.customer_limit || 10)) {
        setShowUpgradeModal(true);
        return;
      }

      navigate('/app/customers/new');
    } catch (error) {
      console.error('Error checking customer limit:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your customer list and contact information
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAddCustomer}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
          >
            Add Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              {filteredCustomers.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Contact
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Address
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Spent
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Last Service
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link
                            to={`/app/customers/${customer.id}`}
                            className="hover:text-primary"
                          >
                            {customer.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            {customer.phone && (
                              <a
                                href={`tel:${customer.phone}`}
                                className="flex items-center text-gray-400 hover:text-primary"
                              >
                                <PhoneIcon className="h-4 w-4 mr-1" />
                                {customer.phone}
                              </a>
                            )}
                            {customer.email && (
                              <a
                                href={`mailto:${customer.email}`}
                                className="flex items-center text-gray-400 hover:text-primary"
                              >
                                <EnvelopeIcon className="h-4 w-4 mr-1" />
                                {customer.email}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-gray-400 hover:text-primary"
                            >
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {customer.address}
                            </a>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${customer.total_spent || 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.last_job_date
                            ? new Date(customer.last_job_date).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            to={`/app/quotes/new?customer=${customer.id}`}
                            className="text-primary hover:text-primary/90"
                          >
                            Create Quote
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No customers found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    You've reached the 10-customer limit on your free plan! 🎉
                  </h3>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Congratulations - your business is growing!
                    </p>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-base font-medium text-gray-900">
                      Upgrade to Professional ($19/month) for:
                    </h4>
                    <ul className="mt-4 space-y-3 text-sm text-gray-500">
                      <li className="flex items-center">
                        <span className="text-primary mr-2">✓</span>
                        Unlimited customers
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">✓</span>
                        Remove BusinessBuddy branding
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">✓</span>
                        Priority support
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">✓</span>
                        Advanced reporting
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={() => navigate('/app/settings/subscription')}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm"
                >
                  Upgrade Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 