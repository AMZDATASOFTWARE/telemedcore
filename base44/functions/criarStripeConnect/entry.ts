import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { email, nome } = await req.json();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

    // Criar conta Express para split de pagamentos
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: email || user.email,
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
      individual: { email: email || user.email },
      metadata: { user_id: user.id, nome: nome || user.full_name },
    });

    const appUrl = Deno.env.get('APP_URL') || 'https://localhost:5173';

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/onboarding-assinatura?tipo=medico&refresh=true`,
      return_url: `${appUrl}/?stripe_connect=sucesso`,
      type: 'account_onboarding',
    });

    // Salvar o ID da conta Connect no usuário
    try {
      const usuarios = await base44.asServiceRole.entities.UsuarioTelemed.filter({ user_id: user.id });
      if (usuarios.length > 0) {
        await base44.asServiceRole.entities.UsuarioTelemed.update(usuarios[0].id, {
          stripe_connect_account_id: account.id,
        });
      }
    } catch (e) { console.error('Erro ao salvar stripe_connect_account_id:', e); }

    return Response.json({ url: accountLink.url, account_id: account.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});