import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const POST: APIRoute = async ({ request }) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    return new Response('Stripe secret key not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // If webhook secret is not set, parse body directly in dev/testing
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook Error] ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`[Stripe Order Success] Session ID: ${session.id}`);
    console.log(`Customer: ${session.customer_details?.email} (${session.customer_details?.name || 'Anonymous'})`);
    console.log(`Amount: $${((session.amount_total || 0) / 100).toFixed(2)} USD`);

    if (session.shipping_details) {
      console.log(`Shipping to:`, session.shipping_details.address);
    }

    // Here we can trigger order confirmation emails or log into local database
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
