import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Invoice, Profile } from '../lib/supabase';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface InvoiceWithDetails extends Invoice {
  customers: {
    name: string;
    email: string;
  };
}

export default function PaymentSuccess() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [businessProfile, setBusinessProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      if (!invoiceId) return;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            email
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      setInvoice(data);

      // Load business profile
      if (data) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user_id)
          .single();

        if (profileError) throw profileError;
        setBusinessProfile(profile);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice || !businessProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="mt-2 text-lg text-gray-600">
            Thank you for your payment to {businessProfile.business_name}
          </p>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-5">
            <h2 className="text-lg font-medium text-gray-900">Payment Details</h2>
            <div className="mt-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number</span>
                <span className="font-medium">#{invoice.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium">${invoice.amount_paid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {new Date(invoice.paid_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            A receipt has been sent to {invoice.customers.email}
          </p>
          <p className="mt-4">
            <Link
              to="/"
              className="text-primary hover:text-primary/90 font-medium"
            >
              Return to Homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 