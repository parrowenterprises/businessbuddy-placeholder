import Stripe from 'stripe';
import { supabase } from '../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { invoiceId, amount, customerName } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount * 100, // Convert to cents
          product_data: {
            name: `Invoice #${invoiceId}`,
            description: `Payment for services - ${customerName}`,
          },
        },
      }],
      mode: 'payment',
      success_url: `${process.env.VITE_PUBLIC_APP_URL}/invoices/${invoiceId}?success=true`,
      cancel_url: `${process.env.VITE_PUBLIC_APP_URL}/invoices/${invoiceId}?success=false`,
    });

    // Update invoice with payment intent ID
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_checkout_session_id: session.id,
      })
      .eq('id', invoiceId);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Error creating payment link:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create payment link' }),
    };
  }
} 