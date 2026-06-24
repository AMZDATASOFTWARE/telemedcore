import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

export default async function (req: Request) {
  // CORS para permitir a chamada do Frontend
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticação de segurança
    const user = await base44.auth.me();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    
    // CORREÇÃO: Busca os dados do médico no banco usando o 'user_id' e não 'id'
    const medicos = await base44.asServiceRole.entities.UsuarioTelemed.filter({ user_id: user.id });
    if (medicos.length === 0) return new Response(JSON.stringify({ error: 'Médico não encontrado' }), { status: 404 });
    const medico = medicos[0];

    let accountId = medico.stripe_connect_account_id;

    // 1. Se o médico ainda não tem uma conta Stripe Connect, nós criamos uma agora
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      
      // Salva o ID da conta conectada no banco de dados do Base44
      await base44.asServiceRole.entities.UsuarioTelemed.update(medico.id, {
        stripe_connect_account_id: accountId
      });
    }

    // 2. Gera o link de "Onboarding" para o médico digitar os dados bancários
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/financeiro`, // Se ele fechar sem querer, volta pro financeiro
      return_url: `${appUrl}/financeiro?stripe_onboarding=success`, // Se der sucesso, volta pro financeiro
      type: 'account_onboarding',
    });

    // Retorna a URL para o frontend redirecionar o médico
    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error("Erro no Stripe Connect:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }
}
