import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
        return new Response(JSON.stringify({ error: "O utilizador não está logado no Base44." }), { status: 200, headers: corsHeaders });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
        return new Response(JSON.stringify({ error: "A chave STRIPE_SECRET_KEY não foi encontrada nas variáveis de ambiente." }), { status: 200, headers: corsHeaders });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    
    const medicos = await base44.asServiceRole.entities.UsuarioTelemed.filter({ user_id: user.id });
    if (!medicos || medicos.length === 0) {
         return new Response(JSON.stringify({ error: "Médico não encontrado na base de dados para o ID: " + user.id }), { status: 200, headers: corsHeaders });
    }

    const medico = medicos[0];
    let accountId = medico.stripe_connect_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: user.email || 'medico@telemed.com',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      await base44.asServiceRole.entities.UsuarioTelemed.update(medico.id, {
        stripe_connect_account_id: accountId
      });
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/financeiro`,
      return_url: `${appUrl}/financeiro?stripe_onboarding=success`,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Ocorreu um erro no servidor: ${error.message}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
