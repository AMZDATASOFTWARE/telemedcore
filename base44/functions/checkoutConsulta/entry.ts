import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id_medico, id_paciente, data_hora_inicio, data_hora_fim, valor_consulta } = await req.json();

    if (!id_medico || !id_paciente || !data_hora_inicio || !data_hora_fim || !valor_consulta) {
      return Response.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const appUrl = Deno.env.get('APP_URL') || 'https://localhost:5173';

    // Buscar médico para obter stripe_connect_account_id
    const medicos = await base44.asServiceRole.entities.UsuarioTelemed.filter({ id: id_medico });
    const medico = medicos[0];

    // --- LÓGICA DINÂMICA DA TAXA ---
    const configs = await base44.asServiceRole.entities.ConfiguracaoGlobal.filter({});
    const taxaPercentual = (configs.length > 0 && configs[0].taxa_plataforma_percentual) 
      ? Number(configs[0].taxa_plataforma_percentual) 
      : 10; // 10% como padrão de segurança se a tabela estiver vazia

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

    // Se médico tem conta Stripe Connect, usar transfer_data para split
    if (medico?.stripe_connect_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: taxaPlataforma,
        transfer_data: {
          destination: medico.stripe_connect_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
