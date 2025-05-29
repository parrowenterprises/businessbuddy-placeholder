import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Customer } from '../../lib/supabase';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import QuoteForm from '../../components/quotes/QuoteForm';
import toast from 'react-hot-toast';

export default function QuoteCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const handleCreateQuote = async (quoteData: {
    customer_id: string;
    services: {
      service_name: string;
      price: number;
      quantity: number;
      notes?: string;
    }[];
    notes?: string;
    valid_until: string;
  }) => {
    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate total amount
      const total_amount = quoteData.services.reduce(
        (sum, service) => sum + service.price * service.quantity,
        0
      );

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([
          {
            user_id: user.id,
            customer_id: quoteData.customer_id,
            status: 'draft',
            total_amount,
            valid_until: quoteData.valid_until,
            notes: quoteData.notes,
          },
        ])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote services
      const { error: servicesError } = await supabase
        .from('quote_services')
        .insert(
          quoteData.services.map(service => ({
            quote_id: quote.id,
            ...service,
          }))
        );

      if (servicesError) throw servicesError;

      toast.success('Quote created successfully');
      navigate(`/quotes/${quote.id}`);
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Create Quote</h1>
        </div>

        {selectedCustomer ? (
          <>
            <div className="mt-4 flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Change Customer
              </button>
              <div className="text-sm text-gray-600">
                Creating quote for <span className="font-medium text-gray-900">{selectedCustomer.name}</span>
              </div>
            </div>

            <div className="mt-6">
              <QuoteForm
                customer={selectedCustomer}
                onSubmit={handleCreateQuote}
                isSubmitting={isSubmitting}
              />
            </div>
          </>
        ) : (
          <div className="mt-6">
            <div className="relative max-w-lg">
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

            <div className="mt-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCustomers.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-primary hover:ring-1 hover:ring-primary cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {customer.name}
                          </p>
                          {customer.email && (
                            <p className="text-sm text-gray-500 truncate">
                              {customer.email}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="text-sm text-gray-500 truncate">
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No customers found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 