import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { price_id, tipo, plan_id } = await req.json();
    if (!price_id) return Response.json({ error: 'price_id required' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

    const appUrl = Deno.env.get('APP_URL') || 'https://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        tipo: tipo || 'medico',
        plan_id: plan_id || '',
      },
      success_url: `${appUrl}/onboarding-assinatura?session_id={CHECKOUT_SESSION_ID}&tipo=${tipo || 'medico'}`,
      cancel_url: `${appUrl}/pricing?tipo=${tipo || 'medico'}`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: user.id,
          tipo: tipo || 'medico',
        },
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});