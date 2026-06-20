import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

    // Buscar assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({ status: 'active', limit: 100 });
    const trialing = await stripe.subscriptions.list({ status: 'trialing', limit: 100 });
    const pastDue = await stripe.subscriptions.list({ status: 'past_due', limit: 100 });

    // Calcular MRR
    let mrr = 0;
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        const amount = price.unit_amount || 0;
        if (price.recurring?.interval === 'year') {
          mrr += amount / 12 / 100;
        } else {
          mrr += amount / 100;
        }
      }
    }

    // Novos este mês
    const startOfMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000);
    const newThisMonth = subscriptions.data.filter(s => s.created >= startOfMonth).length;

    // Churn simplificado (canceladas este mês)
    const canceled = await stripe.subscriptions.list({ status: 'canceled', limit: 100, created: { gte: startOfMonth } });
    const totalActive = subscriptions.data.length + trialing.data.length;
    const churnRate = totalActive > 0 ? ((canceled.data.length / totalActive) * 100).toFixed(1) : '0.0';

    return Response.json({
      mrr: Math.round(mrr),
      active_subscriptions: subscriptions.data.length,
      trialing: trialing.data.length,
      past_due: pastDue.data.length,
      new_this_month: newThisMonth,
      churn_rate: churnRate,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});