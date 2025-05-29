import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Customer } from '../../lib/supabase';
import { MagnifyingGlassIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import UpgradeModal from '../../components/customers/UpgradeModal';
import toast from 'react-hot-toast';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'total_spent' | 'last_job_date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isFreeTier, setIsFreeTier] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    loadCustomers();
  }, [sortBy, sortOrder]);

  async function loadCustomers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      setIsFreeTier(profile?.subscription_tier === 'free');

      // Get customer count
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setCustomerCount(count || 0);

      // Get customers with job history and total spent
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*, jobs(id, total_amount, completed_at)')
        .eq('user_id', user.id)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) throw error;

      const processedCustomers = customerData?.map(customer => ({
        ...customer,
        total_spent: customer.jobs?.reduce((sum: number, job: { total_amount: number }) => 
          sum + (job.total_amount || 0), 0) || 0,
        last_job_date: customer.jobs?.length > 0 
          ? customer.jobs.reduce((latest: string | null, job: { completed_at: string | null }) => 
              job.completed_at && (!latest || job.completed_at > latest) ? job.completed_at : latest
            , null)
          : null
      }));

      setCustomers(processedCustomers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  const handleAddCustomer = () => {
    if (isFreeTier && customerCount >= 10) {
      setShowUpgradeModal(true);
    } else {
      navigate('/customers/new');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <MainLayout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            {isFreeTier ? `${customerCount}/10 customers used` : 'Manage your customer list'}
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

      {/* Search and Sort */}
      <div className="mt-6 sm:flex sm:items-center sm:justify-between">
        <div className="relative flex-grow max-w-lg">
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
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
            className="block w-full rounded-md border-gray-300 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="total_spent-desc">Highest Spent</option>
            <option value="total_spent-asc">Lowest Spent</option>
            <option value="last_job_date-desc">Recent Jobs</option>
            <option value="last_job_date-asc">Oldest Jobs</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {customer.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-col space-y-1">
                            {customer.phone && (
                              <a
                                href={`tel:${customer.phone}`}
                                className="flex items-center text-gray-400 hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PhoneIcon className="h-4 w-4 mr-1" />
                                {customer.phone}
                              </a>
                            )}
                            {customer.email && (
                              <a
                                href={`mailto:${customer.email}`}
                                className="flex items-center text-gray-400 hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EnvelopeIcon className="h-4 w-4 mr-1" />
                                {customer.email}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {customer.address}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${customer.total_spent.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.last_job_date
                            ? new Date(customer.last_job_date).toLocaleDateString()
                            : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No customers found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </MainLayout>
  );
} 