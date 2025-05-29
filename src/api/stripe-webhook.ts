import Stripe from 'stripe';
import { supabase } from '../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      endpointSecret!
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }

  try {
    // Handle the event
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        
        // Find the invoice by payment intent ID
        const { data: invoices, error: findError } = await supabase
          .from('invoices')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (findError) throw findError;
        if (!invoices) throw new Error('Invoice not found');

        // Update invoice status
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            status: 'paid',
            amount_paid: paymentIntent.amount / 100, // Convert from cents
            paid_at: new Date().toISOString(),
          })
          .eq('id', invoices.id);

        if (updateError) throw updateError;

        // Update job status if payment is complete
        if (invoices.amount_paid >= invoices.total_amount) {
          const { error: jobError } = await supabase
            .from('jobs')
            .update({
              status: 'paid',
              payment_status: 'paid',
            })
            .eq('id', invoices.job_id);

          if (jobError) throw jobError;
        }
        break;

      case 'payment_intent.payment_failed':
        // Handle failed payment if needed
        break;

      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process webhook' }),
    };
  }
} 