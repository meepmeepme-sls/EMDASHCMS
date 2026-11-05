import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export interface CartCheckoutItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  option?: string;
  isDigitalDownload?: boolean;
  quantity: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const items: CartCheckoutItem[] = body?.items || [];
    const shippingRateId: string = body?.shippingRateId || 'usps_ground';

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const siteOrigin =
      process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      new URL(request.url).origin;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const isSandboxKey = !stripeSecretKey || stripeSecretKey.includes('placeholder') || stripeSecretKey.startsWith('sk_test_demo');

    // Fallback sandbox simulation if secret key is not set or placeholder
    if (isSandboxKey) {
      console.warn('[Stripe Checkout] STRIPE_SECRET_KEY not set or demo. Simulating checkout redirect.');
      const hasDigital = items.some((i) => i.isDigitalDownload);
      const fakeSessionId = `sim_session_${Date.now()}`;
      const simUrl = `${siteOrigin}/checkout/success?session_id=${fakeSessionId}&mode=sandbox${hasDigital ? '&digital=1' : ''}`;
      return new Response(JSON.stringify({ url: simUrl, mode: 'sandbox' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecretKey);

    const hasPhysical = items.some((i) => !i.isDigitalDownload);

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const imageUrl = item.image
        ? (item.image.startsWith('http') ? item.image : `${siteOrigin}${item.image.startsWith('/') ? '' : '/'}${item.image}`)
        : undefined;

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title + (item.option ? ` (${item.option})` : ''),
            images: imageUrl ? [imageUrl] : [],
            metadata: {
              productId: String(item.productId),
              slug: item.slug,
              option: item.option || '',
              isDigital: item.isDigitalDownload ? 'true' : 'false',
            },
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/cart`,
      metadata: {
        hasDigital: items.some((i) => i.isDigitalDownload) ? 'true' : 'false',
        hasPhysical: hasPhysical ? 'true' : 'false',
        totalItems: String(items.reduce((acc, i) => acc + i.quantity, 0)),
      },
    };

    if (hasPhysical) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ['US', 'CA'],
      };

      const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 895, currency: 'usd' },
            display_name: 'USPS Ground Advantage (3-5 business days)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1495, currency: 'usd' },
            display_name: 'USPS Priority Mail (1-3 business days)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 1 },
              maximum: { unit: 'business_day', value: 3 },
            },
          },
        },
      ];

      if (shippingRateId === 'usps_priority') {
        shippingOptions.reverse();
      }

      sessionParams.shipping_options = shippingOptions;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Stripe Checkout Error]', err);
    return new Response(
      JSON.stringify({
        error: err.message || 'Unable to initiate checkout session.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
