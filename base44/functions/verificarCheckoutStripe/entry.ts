import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    
    // Inicializa o Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    
    // O segredo do Webhook gerado no painel do Stripe (STRIPE_WEBHOOK_SECRET)
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;

    // Verifica se a requisição realmente veio do Stripe (Segurança)
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error(`⚠️ Erro de assinatura do Webhook: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Escuta especificamente o evento de pagamento concluído com sucesso
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Recupera os metadados que enviamos na criação do checkout
      const { id_medico, id_paciente, data_hora_inicio, data_hora_fim, valor_consulta } = session.metadata;

      // 1. Grava o agendamento oficial no banco de dados como CONFIRMADO (Estado = 1)
      await base44.asServiceRole.entities.Agendamento.create({
        id_medico: id_medico,
        id_paciente: id_paciente,
        data_hora_inicio: data_hora_inicio,
        data_hora_fim: data_hora_fim,
        estado: 1, // 1 = Confirmado
        valor_consulta: Number(valor_consulta),
        status_pagamento_stripe: 'pago',
        stripe_session_id: session.id
      });

      console.log(`✅ Agendamento confirmado para o paciente ${id_paciente} com o médico ${id_medico}`);
    }

    // Retorna 200 para avisar o Stripe que recebemos o evento com sucesso
    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
