import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Invoice, InvoiceStatus } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface InvoiceHistoryProps {
  customerId?: string;
}

interface InvoiceWithDetails extends Invoice {
  customers: {
    name: string;
    email: string;
  };
}

const statusColors: Record<InvoiceStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
};

export default function InvoiceHistory({ customerId }: InvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'created_at' | 'due_date' | 'total_amount'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadInvoices();
  }, [customerId]);

  async function loadInvoices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            email
          )
        `)
        .eq('user_id', user.id)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

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

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4" />
    ) : (
      <ChevronDownIcon className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer"
              onClick={() => handleSort('created_at')}
            >
              <div className="flex items-center gap-1">
                Date
                <SortIcon field="created_at" />
              </div>
            </th>
            {!customerId && (
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Customer
              </th>
            )}
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('total_amount')}
            >
              <div className="flex items-center gap-1">
                Amount
                <SortIcon field="total_amount" />
              </div>
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('due_date')}
            >
              <div className="flex items-center gap-1">
                Due Date
                <SortIcon field="due_date" />
              </div>
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {invoices.map((invoice) => {
            const statusStyle = statusColors[invoice.status];
            return (
              <tr key={invoice.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                  {format(parseISO(invoice.created_at), 'MMM d, yyyy')}
                </td>
                {!customerId && (
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {invoice.customers.name}
                  </td>
                )}
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
    </div>
  );
} 