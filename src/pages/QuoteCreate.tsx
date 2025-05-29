import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Service } from '../lib/supabase';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface QuoteService {
  service_name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export default function QuoteCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(preselectedCustomerId || '');
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load customers
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (customerError) throw customerError;
      setCustomers(customerData || []);

      // Load services
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (serviceError) throw serviceError;
      setServices(serviceData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }

  const addService = () => {
    setQuoteServices([
      ...quoteServices,
      { service_name: '', price: 0, quantity: 1 }
    ]);
  };

  const removeService = (index: number) => {
    setQuoteServices(quoteServices.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof QuoteService, value: string | number) => {
    const updatedServices = [...quoteServices];
    if (field === 'service_name') {
      const service = services.find(s => s.name === value);
      if (service) {
        updatedServices[index] = {
          ...updatedServices[index],
          service_name: service.name,
          price: service.default_price
        };
      }
    } else {
      updatedServices[index] = {
        ...updatedServices[index],
        [field]: value
      };
    }
    setQuoteServices(updatedServices);
  };

  const calculateTotal = () => {
    return quoteServices.reduce((total, service) => {
      return total + (service.price * service.quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || quoteServices.length === 0) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create the quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([
          {
            user_id: user.id,
            customer_id: selectedCustomer,
            status: 'draft',
            total_amount: calculateTotal(),
            valid_until: new Date(validUntil).toISOString(),
            notes,
          }
        ])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Add quote services
      const { error: servicesError } = await supabase
        .from('quote_services')
        .insert(
          quoteServices.map(service => ({
            quote_id: quote.id,
            ...service
          }))
        );

      if (servicesError) throw servicesError;

      navigate(`/app/quotes/${quote.id}`);
    } catch (error) {
      console.error('Error creating quote:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Create Quote</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new quote by selecting a customer and adding services
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Customer Selection */}
        <div>
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
            Customer
          </label>
          <select
            id="customer"
            required
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Services */}
        <div>
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Services
            </label>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Service
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {quoteServices.map((quoteService, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-1">
                  <select
                    value={quoteService.service_name}
                    onChange={(e) => updateService(index, 'service_name', e.target.value)}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>
                        {service.name} (${service.default_price})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    value={quoteService.quantity}
                    onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value))}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Qty"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quoteService.price}
                    onChange={(e) => updateService(index, 'price', parseFloat(e.target.value))}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Price"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="inline-flex items-center p-1 border border-transparent rounded-md text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}

            {quoteServices.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end text-base font-medium text-gray-900">
                  Total: ${calculateTotal()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Valid Until */}
        <div>
          <label htmlFor="valid-until" className="block text-sm font-medium text-gray-700">
            Valid Until
          </label>
          <input
            type="date"
            id="valid-until"
            required
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            placeholder="Any additional notes or terms..."
          />
        </div>

        {/* Submit */}
        <div className="pt-5 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/app/quotes')}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || quoteServices.length === 0}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Quote'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 