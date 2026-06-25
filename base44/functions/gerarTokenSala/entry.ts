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
      return new Response(JSON.stringify({ error: 'Utilizador não autenticado.' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { id_agendamento } = body;

    if (!id_agendamento) {
      return new Response(JSON.stringify({ error: 'ID da consulta é obrigatório.' }), { status: 400, headers: corsHeaders });
    }

    // 2. Busca a consulta no banco de dados para garantir que existe
    const consultas = await base44.asServiceRole.entities.Agendamento.filter({ id: id_agendamento });
    if (consultas.length === 0) {
      return new Response(JSON.stringify({ error: 'Consulta não encontrada ou expirada.' }), { status: 404, headers: corsHeaders });
    }
    const consulta = consultas[0];

    // 3. O CORAÇÃO DA SEGURANÇA (Anti-Invasão)
    // Se quem clicou no botão não for nem o médico nem o paciente da consulta, rua!
    if (consulta.id_medico !== user.id && consulta.id_paciente !== user.id) {
      return new Response(JSON.stringify({ error: 'Acesso negado por violação de privacidade.' }), { status: 403, headers: corsHeaders });
    }

    // 4. Geração de URL Segura usando a API Nativa (Sem dependências externas = Zero Erros 503)
    // Cria um código criptográfico de 32 caracteres impossível de adivinhar
    const secureToken = crypto.randomUUID().replace(/-/g, '');
    
    // Constrói a sala blindada
    const secureRoomUrl = `https://meet.jit.si/telemedcore-secure-${id_agendamento}-${secureToken}`;

    // Devolve a chave de acesso ao Frontend
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
