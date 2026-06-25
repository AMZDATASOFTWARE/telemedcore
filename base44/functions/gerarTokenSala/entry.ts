import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as djwt from 'npm:djwt@3.0.1';

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

    // 1. BLINDAGEM CFM/LGPD: Busca a consulta no banco de dados
    const consultas = await base44.asServiceRole.entities.Agendamento.filter({ id: id_agendamento });
    if (consultas.length === 0) {
      return new Response(JSON.stringify({ error: 'Consulta não encontrada ou expirada.' }), { status: 404, headers: corsHeaders });
    }
    const consulta = consultas[0];

    // 2. VERIFICAÇÃO DE INVASÃO: O utilizador logado pertence a esta consulta exata?
    if (consulta.id_medico !== user.id && consulta.id_paciente !== user.id) {
      console.error(`TENTATIVA DE INVASÃO BLOQUEADA: Utilizador ${user.id} tentou aceder à sala ${id_agendamento}`);
      return new Response(JSON.stringify({ error: 'Acesso negado por violação de privacidade. Você não é o médico nem o paciente desta consulta.' }), { status: 403, headers: corsHeaders });
    }

    // 3. GERAÇÃO DO TOKEN SEGURO DE CURTA DURAÇÃO (1 Hora)
    // Em produção, coloque isto nas variáveis de ambiente do Base44
    const secret = Deno.env.get('JWT_SECRET') || 'telemedcore_chave_secreta_criptografia_2026';
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );

    const payload = {
      iss: "telemedcore-auth",
      sub: user.id,
      room: id_agendamento,
      context: { role: user.id === consulta.id_medico ? 'medico' : 'paciente' },
      exp: djwt.getNumericDate(60 * 60), // O token expira implacavelmente em 60 minutos
    };

    const secureToken = await djwt.create({ alg: "HS256", typ: "JWT" }, payload, key);
    
    // Gera uma URL blindada de sala que é impossível de adivinhar
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
