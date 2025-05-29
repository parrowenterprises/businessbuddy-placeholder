import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Quote, QuoteService, Profile } from '../../lib/supabase';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import QuotePreview from '../../components/quotes/QuotePreview';
import toast from 'react-hot-toast';

type QuoteWithDetails = Quote & {
  quote_services: QuoteService[];
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
};

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteWithDetails | null>(null);
  const [businessProfile, setBusinessProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [id]);

  async function loadQuote() {
    try {
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load business profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setBusinessProfile(profile);

      // Load quote with details
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_services(*),
          customers(id, name, email, phone, address)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  }

  const handleSendQuote = async () => {
    if (!quote) return;

    try {
      setSending(true);

      // Update quote status to sent
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      if (updateError) throw updateError;

      // TODO: Send email to customer
      // This would typically be handled by a server function
      // For now, we'll just show a success message

      toast.success('Quote sent to customer');
      loadQuote(); // Reload to get updated status
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Failed to send quote');
    } finally {
      setSending(false);
    }
  };

  const handleApproveQuote = async () => {
    if (!quote) return;

    try {
      // Update quote status
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      if (updateError) throw updateError;

      // Create a job from the quote
      const { error: jobError } = await supabase
        .from('jobs')
        .insert([
          {
            user_id: quote.user_id,
            customer_id: quote.customer_id,
            quote_id: quote.id,
            title: `Job from Quote #${quote.id.slice(0, 8)}`,
            description: quote.notes || '',
            status: 'draft',
            payment_status: 'unpaid',
            total_amount: quote.total_amount,
          },
        ]);

      if (jobError) throw jobError;

      toast.success('Quote approved and job created');
      loadQuote(); // Reload to get updated status
    } catch (error) {
      console.error('Error approving quote:', error);
      toast.error('Failed to approve quote');
    }
  };

  const handleRejectQuote = async () => {
    if (!quote) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      if (error) throw error;

      toast.success('Quote rejected');
      loadQuote(); // Reload to get updated status
    } catch (error) {
      console.error('Error rejecting quote:', error);
      toast.error('Failed to reject quote');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!quote || !businessProfile) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Quote not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Actions */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate('/quotes')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Quotes
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {quote.status === 'draft' && (
              <button
                type="button"
                onClick={handleSendQuote}
                disabled={sending}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send to Customer'}
              </button>
            )}
            {quote.status === 'sent' && (
              <>
                <button
                  type="button"
                  onClick={handleRejectQuote}
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApproveQuote}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quote Preview */}
        <QuotePreview
          quote={quote}
          businessProfile={businessProfile}
          onApprove={handleApproveQuote}
          onReject={handleRejectQuote}
        />
      </div>
    </MainLayout>
  );
} 