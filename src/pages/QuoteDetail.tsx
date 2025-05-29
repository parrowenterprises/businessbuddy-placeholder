import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Quote, QuoteService, QuoteStatus } from '../lib/supabase';
import { EnvelopeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface QuoteWithDetails extends Quote {
  customers: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  quote_services: QuoteService[];
}

const statusColors: Record<QuoteStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  expired: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Expired' },
};

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [id]);

  async function loadQuote() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            name,
            email,
            phone,
            address
          ),
          quote_services (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      navigate('/app/quotes');
    } finally {
      setLoading(false);
    }
  }

  const updateQuoteStatus = async (newStatus: QuoteStatus) => {
    if (!quote) return;
    setUpdating(true);

    try {
      const updates: Partial<Quote> = {
        status: newStatus,
      };

      if (newStatus === 'sent') {
        updates.sent_at = new Date().toISOString();
      } else if (newStatus === 'approved') {
        updates.approved_at = new Date().toISOString();
      } else if (newStatus === 'rejected') {
        updates.rejected_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', quote.id);

      if (error) throw error;

      // If approved, create a job
      if (newStatus === 'approved') {
        const { error: jobError } = await supabase
          .from('jobs')
          .insert([
            {
              user_id: quote.user_id,
              customer_id: quote.customer_id,
              quote_id: quote.id,
              status: 'scheduled',
              total_amount: quote.total_amount,
              payment_status: 'unpaid',
            }
          ]);

        if (jobError) throw jobError;
      }

      await loadQuote();
    } catch (error) {
      console.error('Error updating quote:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendQuote = async () => {
    // TODO: Implement email sending functionality
    await updateQuoteStatus('sent');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Quote not found</p>
      </div>
    );
  }

  const statusStyle = statusColors[quote.status];
  const canBeSent = quote.status === 'draft';
  const canBeApproved = quote.status === 'sent';
  const canBeRejected = quote.status === 'sent';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quote Details</h1>
          <p className="mt-2 text-sm text-gray-700">
            Quote for {quote.customers.name}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
          {canBeSent && (
            <button
              type="button"
              onClick={handleSendQuote}
              disabled={updating}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Send Quote
            </button>
          )}
          {canBeApproved && (
            <button
              type="button"
              onClick={() => updateQuoteStatus('approved')}
              disabled={updating}
              className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Approve
            </button>
          )}
          {canBeRejected && (
            <button
              type="button"
              onClick={() => updateQuoteStatus('rejected')}
              disabled={updating}
              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Reject
            </button>
          )}
        </div>
      </div>

      {/* Quote Content */}
      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Customer Info */}
          <div className="border-b border-gray-200 pb-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Customer Information</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.customers.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.customers.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.customers.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.customers.address}</dd>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="mt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Services</h3>
            <div className="mt-4 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Service
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Quantity
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Price
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quote.quote_services.map((service) => (
                      <tr key={service.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                          {service.service_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {service.quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${service.price}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${service.price * service.quantity}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-right sm:pl-6">
                        Total
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                        ${quote.total_amount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="mt-8 border-t border-gray-200 pt-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Valid Until</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(quote.valid_until).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(quote.created_at).toLocaleDateString()}
                </dd>
              </div>
              {quote.sent_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sent</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(quote.sent_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {quote.approved_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Approved</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(quote.approved_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {quote.rejected_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rejected</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(quote.rejected_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mt-8 border-t border-gray-200 pt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Notes</h3>
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-500">
                {quote.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 