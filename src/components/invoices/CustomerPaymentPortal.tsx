import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Invoice } from '../../lib/supabase';
import { BanknotesIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface CustomerPaymentPortalProps {
  invoice: Invoice;
  businessName: string;
  onPaymentComplete: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CustomerPaymentPortal({ invoice, businessName, onPaymentComplete }: CustomerPaymentPortalProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not initialized');

      // Redirect to Stripe Checkout
      if (invoice.stripe_payment_link) {
        window.location.href = invoice.stripe_payment_link;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const remainingAmount = invoice.total_amount - (invoice.amount_paid || 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
          <div className="flex items-center text-sm text-gray-500">
            <LockClosedIcon className="h-4 w-4 mr-1" />
            Secure Payment
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Invoice Total</span>
            <span className="font-medium">${invoice.total_amount.toFixed(2)}</span>
          </div>
          {invoice.amount_paid > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-medium text-green-600">${invoice.amount_paid.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-900 font-medium">Balance Due</span>
            <span className="text-lg font-semibold text-gray-900">${remainingAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handlePayment}
            disabled={loading || remainingAmount <= 0}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <BanknotesIcon className="h-5 w-5 mr-2" />
            {loading ? 'Processing...' : `Pay ${businessName}`}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Secure payment processing by Stripe
          </p>
        </div>
      </div>
    </div>
  );
} 