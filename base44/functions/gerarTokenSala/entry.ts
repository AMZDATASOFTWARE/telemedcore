import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
      return new Response(JSON.stringify({ error: 'Utilizador não autenticado.' }), { status: 200, headers: corsHeaders });
    }

    const body = await req.json();
    const { id_agendamento } = body;

    if (!id_agendamento) {
      return new Response(JSON.stringify({ error: 'ID da consulta é obrigatório.' }), { status: 200, headers: corsHeaders });
    }

    const perfis = await base44.asServiceRole.entities.UsuarioTelemed.filter({ user_id: user.id });
    if (!perfis || perfis.length === 0) {
      return new Response(JSON.stringify({ error: 'Perfil médico ou de paciente não encontrado.' }), { status: 200, headers: corsHeaders });
    }
    const meuPerfilId = perfis[0].id;

    const consultas = await base44.asServiceRole.entities.Agendamento.filter({ id: id_agendamento });
    if (consultas.length === 0) {
      return new Response(JSON.stringify({ error: 'Consulta não encontrada.' }), { status: 200, headers: corsHeaders });
    }
    const consulta = consultas[0];

    if (consulta.id_medico !== meuPerfilId && consulta.id_paciente !== meuPerfilId) {
      return new Response(JSON.stringify({ error: 'Acesso negado por violação de privacidade.' }), { status: 200, headers: corsHeaders });
    }

    // 🔥 PROBLEMA 1 RESOLVIDO (HASH DETERMINÍSTICO): 
    // Misturamos o ID da consulta com um "Sal" secreto.
    // Assim, o Médico e o Paciente vão receber EXATAMENTE a mesma URL criptografada!
    const secretText = id_agendamento + "telemedcore_secreto_2026_super_seguro";
    const data = new TextEncoder().encode(secretText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Transformamos o hash em texto e cortamos os primeiros 20 caracteres
    const secureToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 20);

    // 🔥 PROBLEMA 2 RESOLVIDO (LIMITE DE 5 MINUTOS):
    // Apontamos a URL para o servidor open source do Freifunk (Alemanha) que não corta iframes.
    const secureRoomUrl = `https://meet.ffmuc.net/telemedcore-${secureToken}`;

    return new Response(JSON.stringify({ token: secureToken, url: secureRoomUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Erro no servidor: ${error.message}` }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }
});
