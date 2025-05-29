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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <CustomerPaymentPortal
            invoice={invoice}
            businessName={businessProfile.business_name}
          />
        </div>
      </div>
    </div>
  );
} 