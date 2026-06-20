import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { session_id } = await req.json();
    if (!session_id) return Response.json({ error: 'session_id required' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return Response.json({ ok: false, error: 'Pagamento não confirmado' }, { status: 400 });
    }

    const meta = session.metadata;

    // Criar agendamento confirmado
    const agendamento = await base44.asServiceRole.entities.Agendamento.create({
      id_medico: meta.id_medico,
      id_paciente: meta.id_paciente,
      data_hora_inicio: meta.data_hora_inicio,
      data_hora_fim: meta.data_hora_fim,
      estado: 1, // Confirmado
      estado_label: 'Confirmado',
      valor_consulta: parseFloat(meta.valor_consulta),
      status_pagamento_stripe: 'pago',
      link_video_webrtc: `https://meet.jit.si/medconnect-${meta.id_medico.slice(0, 8)}-${Date.now()}`,
    });

    return Response.json({ ok: true, agendamento_id: agendamento.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});