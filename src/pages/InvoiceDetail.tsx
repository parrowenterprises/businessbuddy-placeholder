import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceStatus, JobService } from '../lib/supabase';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { createPaymentLink, handlePayment } from '../lib/stripe';

interface InvoiceWithDetails extends Invoice {
  customers: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  jobs: {
    id: string;
    job_services: JobService[];
    notes?: string;
  };
}

const statusColors: Record<InvoiceStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  useEffect(() => {
    // Check for successful payment
    if (searchParams.get('payment') === 'success') {
      // Reload invoice data to get updated status
      loadInvoice();
      // Clear the URL parameter
      navigate(`/app/invoices/${id}`, { replace: true });
    }
  }, [searchParams, id]);

  async function loadInvoice() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            email,
            phone,
            address
          ),
          jobs (
            id,
            job_services (*),
            notes
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      navigate('/app/invoices');
    } finally {
      setLoading(false);
    }
  }

  const generatePaymentLink = async () => {
    if (!invoice) return;
    setUpdating(true);
    try {
      const paymentLink = await createPaymentLink({
        id: invoice.id,
        total_amount: invoice.total_amount - (invoice.amount_paid || 0),
        customer: {
          name: invoice.customers.name,
          email: invoice.customers.email,
        },
      });

      const { error } = await supabase
        .from('invoices')
        .update({
          stripe_payment_link: paymentLink,
        })
        .eq('id', invoice.id);

      if (error) throw error;

      await loadInvoice();
    } catch (error) {
      console.error('Error generating payment link:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentClick = async () => {
    if (!invoice?.stripe_payment_link) return;
    try {
      await handlePayment(invoice.stripe_payment_link);
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const markAsPaid = async () => {
    if (!invoice) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (error) throw error;

      await loadInvoice();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    } finally {
      setUpdating(false);
    }
  };

  const sendInvoice = async () => {
    if (!invoice) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (error) throw error;

      await loadInvoice();
    } catch (error) {
      console.error('Error sending invoice:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Invoice not found</p>
      </div>
    );
  }

  const statusStyle = statusColors[invoice.status];
  const canSend = invoice.status === 'draft';
  const canGeneratePaymentLink = invoice.status === 'sent' && !invoice.stripe_payment_link;
  const canMarkAsPaid = invoice.status === 'sent' || invoice.status === 'overdue';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoice</h1>
          <p className="mt-2 text-sm text-gray-700">
            Invoice for {invoice.customers.name}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
          {canSend && (
            <button
              type="button"
              onClick={sendInvoice}
              disabled={updating}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Send Invoice
            </button>
          )}
          {canGeneratePaymentLink && (
            <button
              type="button"
              onClick={generatePaymentLink}
              disabled={updating}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              <BanknotesIcon className="h-4 w-4 mr-2" />
              Generate Payment Link
            </button>
          )}
          {canMarkAsPaid && (
            <button
              type="button"
              onClick={markAsPaid}
              disabled={updating}
              className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <BanknotesIcon className="h-4 w-4 mr-2" />
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Customer Info */}
          <div className="border-b border-gray-200 pb-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Customer Information</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{invoice.customers.address}</dd>
              </div>
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <PhoneIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={`tel:${invoice.customers.phone}`} className="text-primary hover:text-primary/90">
                    {invoice.customers.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={`mailto:${invoice.customers.email}`} className="text-primary hover:text-primary/90">
                    {invoice.customers.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Due Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(parseISO(invoice.due_date), 'MMMM d, yyyy')}
                </dd>
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
                    {invoice.jobs.job_services.map((service) => (
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
                        ${invoice.total_amount}
                      </td>
                    </tr>
                    {invoice.amount_paid > 0 && (
                      <>
                        <tr>
                          <td colSpan={3} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-right sm:pl-6">
                            Amount Paid
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-green-600">
                            ${invoice.amount_paid}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-right sm:pl-6">
                            Balance Due
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-red-600">
                            ${invoice.total_amount - invoice.amount_paid}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Link */}
          {invoice.stripe_payment_link && (
            <div className="mt-8 border-t border-gray-200 pt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Payment Link</h3>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePaymentClick}
                  className="inline-flex items-center text-primary hover:text-primary/90"
                >
                  Pay Online
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(invoice.stripe_payment_link!);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  title="Copy payment link"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 border-t border-gray-200 pt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Notes</h3>
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-500">
                {invoice.notes}
              </div>
            </div>
          )}

          {/* Job Reference */}
          <div className="mt-8 border-t border-gray-200 pt-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Related Job</h3>
            <div className="mt-2">
              <Link
                to={`/app/jobs/${invoice.jobs.id}`}
                className="text-primary hover:text-primary/90"
              >
                View Job Details
              </Link>
              {invoice.jobs.notes && (
                <div className="mt-2 text-sm text-gray-500">
                  {invoice.jobs.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 