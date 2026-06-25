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
    
    // 1. Verificação de Autenticação
    if (!user) {
      // Usamos status 200 com a chave "error" para o Frontend mostrar o alerta bonitinho
      return new Response(JSON.stringify({ error: 'Utilizador não autenticado.' }), { status: 200, headers: corsHeaders });
    }

    const body = await req.json();
    const { id_agendamento } = body;

    if (!id_agendamento) {
      return new Response(JSON.stringify({ error: 'ID da consulta é obrigatório.' }), { status: 200, headers: corsHeaders });
    }

    // 🔥 A CORREÇÃO: Descobre qual é o "ID de Perfil (UsuarioTelemed)" ligado a este login
    const perfis = await base44.asServiceRole.entities.UsuarioTelemed.filter({ user_id: user.id });
    if (!perfis || perfis.length === 0) {
      return new Response(JSON.stringify({ error: 'Perfil médico ou de paciente não encontrado.' }), { status: 200, headers: corsHeaders });
    }
    const meuPerfilId = perfis[0].id; // Este é o ID que está gravado na consulta!

    // Busca a consulta no banco de dados
    const consultas = await base44.asServiceRole.entities.Agendamento.filter({ id: id_agendamento });
    if (consultas.length === 0) {
      return new Response(JSON.stringify({ error: 'Consulta não encontrada ou expirada.' }), { status: 200, headers: corsHeaders });
    }
    const consulta = consultas[0];

    // O CORAÇÃO DA SEGURANÇA: Agora compara banana com banana! (Perfil com Perfil)
    if (consulta.id_medico !== meuPerfilId && consulta.id_paciente !== meuPerfilId) {
      return new Response(JSON.stringify({ error: 'Acesso negado por violação de privacidade (LGPD). Esta não é a sua consulta.' }), { status: 200, headers: corsHeaders });
    }

    // Geração de URL Segura 
    const secureToken = crypto.randomUUID().replace(/-/g, '');
    const secureRoomUrl = `https://meet.jit.si/telemedcore-secure-${id_agendamento}-${secureToken}`;

    // Devolve a chave de acesso com sucesso
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
