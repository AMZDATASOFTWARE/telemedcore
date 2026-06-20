import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { session_id } = await req.json();
    if (!session_id) return Response.json({ ok: false, error: 'session_id required' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const ok = session.payment_status === 'paid' || session.status === 'complete' || session.subscription !== null;

    return Response.json({
      ok,
      customer_id: session.customer,
      subscription_id: session.subscription,
      tipo: session.metadata?.tipo || 'medico',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});