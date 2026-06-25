import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
// Substituímos pela 'jose', o padrão ouro da indústria que nunca falha no Deno
import { SignJWT } from 'npm:jose@5.2.3';

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
      return new Response(JSON.stringify({ error: 'Utilizador não autenticado.' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { id_agendamento } = body;

    if (!id_agendamento) {
      return new Response(JSON.stringify({ error: 'ID da consulta é obrigatório.' }), { status: 400, headers: corsHeaders });
    }

    const consultas = await base44.asServiceRole.entities.Agendamento.filter({ id: id_agendamento });
    if (consultas.length === 0) {
      return new Response(JSON.stringify({ error: 'Consulta não encontrada ou expirada.' }), { status: 404, headers: corsHeaders });
    }
    const consulta = consultas[0];

    if (consulta.id_medico !== user.id && consulta.id_paciente !== user.id) {
      return new Response(JSON.stringify({ error: 'Acesso negado por violação de privacidade.' }), { status: 403, headers: corsHeaders });
    }

    // Geração do Token usando a biblioteca JOSE (Blindada)
    const secret = Deno.env.get('JWT_SECRET') || 'telemedcore_chave_secreta_criptografia_2026';
    const secretKey = new TextEncoder().encode(secret);

    const secureToken = await new SignJWT({ 
      room: id_agendamento,
      context: { role: user.id === consulta.id_medico ? 'medico' : 'paciente' }
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('telemedcore-auth')
      .setSubject(user.id)
      .setExpirationTime('1h') // Expira implacavelmente em 1 hora
      .sign(secretKey);
    
    const secureRoomUrl = `https://meet.jit.si/telemedcore-secure-${id_agendamento}-${secureToken.substring(secureToken.length - 10)}`;

    return new Response(JSON.stringify({ token: secureToken, url: secureRoomUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Erro no servidor: ${error.message}` }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }
});
