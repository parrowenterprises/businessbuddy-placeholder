import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceStatus } from '../lib/supabase';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format, parseISO, addDays } from 'date-fns';

interface InvoiceWithDetails extends Invoice {
  customers: {
    name: string;
    email: string;
    phone: string;
  };
  jobs: {
    id: string;
  };
}

const statusColors: Record<InvoiceStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'recent' | 'overdue' | 'all'>('recent');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
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
            phone
          ),
          jobs (
            id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update status of overdue invoices
      const updatedInvoices = (data || []).map(invoice => {
        if (invoice.status === 'sent' && new Date(invoice.due_date) < new Date()) {
          return { ...invoice, status: 'overdue' as InvoiceStatus };
        }
        return invoice;
      });

      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  const generatePaymentLink = async (invoiceId: string) => {
    setUpdating(true);
    try {
      // TODO: Implement Stripe payment link generation
      console.log('Generating payment link for invoice:', invoiceId);
    } catch (error) {
      console.error('Error generating payment link:', error);
    } finally {
      setUpdating(false);
    }
  };

  const markAsPaid = async (invoiceId: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;

      await loadInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.customers.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    const now = new Date();
    const invoiceDate = parseISO(invoice.created_at);
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'recent' && invoiceDate >= addDays(now, -30)) ||
      (dateFilter === 'overdue' && invoice.status === 'overdue');

    return matchesSearch && matchesStatus && matchesDate;
  });

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
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your invoices and track payments
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="sm:w-48">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusColors).map(([status, { label }]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:w-48">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <select
            id="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'recent' | 'overdue' | 'all')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="recent">Last 30 Days</option>
            <option value="overdue">Overdue</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or invoice ID..."
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {filteredInvoices.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Invoice ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Customer
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Due Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredInvoices.map((invoice) => {
                      const statusStyle = statusColors[invoice.status];
                      return (
                        <tr key={invoice.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            <Link
                              to={`/app/invoices/${invoice.id}`}
                              className="hover:text-primary"
                            >
                              {invoice.id.slice(0, 8)}...
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {invoice.customers.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            ${invoice.total_amount}
                            {invoice.amount_paid > 0 && (
                              <span className="text-gray-500 ml-1">
                                (${invoice.amount_paid} paid)
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusStyle.bg} ${statusStyle.text}`}>
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {invoice.status === 'sent' && !invoice.stripe_payment_link && (
                              <button
                                type="button"
                                onClick={() => generatePaymentLink(invoice.id)}
                                disabled={updating}
                                className="text-primary hover:text-primary/90 font-medium disabled:opacity-50"
                              >
                                Generate Payment Link
                              </button>
                            )}
                            {invoice.status === 'sent' && (
                              <button
                                type="button"
                                onClick={() => markAsPaid(invoice.id)}
                                disabled={updating}
                                className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50 ml-4"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link
                              to={`/app/invoices/${invoice.id}`}
                              className="text-primary hover:text-primary/90"
                            >
                              View<span className="sr-only">, invoice {invoice.id}</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No invoices found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 