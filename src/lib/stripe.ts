import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export async function createPaymentLink(invoice: {
  id: string;
  total_amount: number;
  customer: {
    name: string;
    email: string;
  };
}) {
  try {
    // Call your backend API to create a payment link
    const response = await fetch('/api/create-payment-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId: invoice.id,
        amount: invoice.total_amount,
        customerName: invoice.customer.name,
        customerEmail: invoice.customer.email,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment link');
    }

    const { paymentLink } = await response.json();
    return paymentLink;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

export async function handlePayment(paymentLink: string) {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    // Redirect to the payment link
    window.location.href = paymentLink;
  } catch (error) {
    console.error('Error handling payment:', error);
    throw error;
  }
} 