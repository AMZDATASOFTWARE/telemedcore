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
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { id_medico, id_paciente, data_hora_inicio, data_hora_fim, valor_consulta } = body;

    if (!id_medico || !id_paciente || !data_hora_inicio || !data_hora_fim || !valor_consulta) {
      return new Response(JSON.stringify({ error: 'Dados obrigatórios ausentes' }), { status: 400, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';

    const medicos = await base44.asServiceRole.entities.UsuarioTelemed.filter({ id: id_medico });
    const medico = medicos[0];

    const configs = await base44.asServiceRole.entities.ConfiguracaoGlobal.filter({});
    const taxaPercentual = (configs.length > 0 && configs[0].taxa_plataforma_percentual) 
      ? Number(configs[0].taxa_plataforma_percentual) 
      : 10; 

    const valorCentavos = Math.round(valor_consulta * 100);
    const taxaPlataforma = Math.round(valorCentavos * (taxaPercentual / 100));

    const sessionParams: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: `Consulta com Dr(a). ${medico?.nome || 'Médico'}` },
          unit_amount: valorCentavos,
        },
        quantity: 1,
      }],
      customer_email: user.email,
      metadata: {
        id_medico,
        id_paciente,
        data_hora_inicio,
        data_hora_fim,
        valor_consulta: String(valor_consulta),
        user_id: user.id,
      },
      success_url: `${appUrl}/portal-paciente?tab=consultas&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/portal-paciente?tab=buscar`,
    };

    if (medico?.stripe_connect_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: taxaPlataforma,
        transfer_data: {
          destination: medico.stripe_connect_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
