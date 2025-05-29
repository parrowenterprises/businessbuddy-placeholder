import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Invoice, Profile } from '../lib/supabase';
import CustomerPaymentPortal from '../components/invoices/CustomerPaymentPortal';

interface InvoiceWithDetails extends Invoice {
  customers: {
    name: string;
    email: string;
  };
}

export default function PaymentPortal() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [businessProfile, setBusinessProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
    loadBusinessProfile();
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
    } catch (error) {
      console.error('Error loading invoice:', error);
      navigate('/');
    }
  }

  async function loadBusinessProfile() {
    try {
      if (!invoice) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', invoice.user_id)
        .single();

      if (error) throw error;
      setBusinessProfile(data);
    } catch (error) {
      console.error('Error loading business profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const handlePaymentComplete = () => {
    navigate(`/pay/${invoiceId}/success`);
  };

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{businessProfile.business_name}</h1>
          <p className="mt-2 text-gray-600">Invoice Payment</p>
        </div>

        <CustomerPaymentPortal
          invoice={invoice}
          businessName={businessProfile.business_name}
          onPaymentComplete={handlePaymentComplete}
        />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Contact {businessProfile.business_name} at{' '}
            <a href={`tel:${businessProfile.phone}`} className="text-primary hover:text-primary/90">
              {businessProfile.phone}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 