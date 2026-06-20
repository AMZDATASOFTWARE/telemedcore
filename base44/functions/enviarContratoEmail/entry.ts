import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { email, nome, tipo, cpf, crm, especialidade, razao_social, cnpj } = body;

    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    let contratoHtml = '';
    if (tipo === 'medico_avulso') {
      contratoHtml = `
        <h2>Contrato de Prestação de Serviços — Médico Avulso</h2>
        <p><strong>Data:</strong> ${dataAtual}</p>
        <p><strong>Contratado:</strong> ${nome}</p>
        <p><strong>CPF:</strong> ${cpf || 'Não informado'}</p>
        <p><strong>CRM:</strong> ${crm || 'Não informado'}</p>
        <p><strong>Especialidade:</strong> ${especialidade || 'Não informada'}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <hr/>
        <h3>Objeto do Contrato</h3>
        <p>O presente instrumento tem por objeto a prestação de serviços de telemedicina através da plataforma MedConnect, nos termos da Lei nº 13.989/2020 e resoluções do CFM.</p>
        <h3>Obrigações do Médico</h3>
        <ul>
          <li>Manter CRM ativo e em situação regular</li>
          <li>Respeitar o sigilo médico e a LGPD (Lei 13.709/2018)</li>
          <li>Emitir documentação médica conforme legislação vigente</li>
        </ul>
        <h3>Remuneração</h3>
        <p>Conforme plano contratado, com split automático via Stripe Connect.</p>
        <p style="margin-top: 32px; font-size: 12px; color: #666;">MedConnect Telemedicina LTDA · CNPJ 00.000.000/0001-00</p>
      `;
    } else {
      contratoHtml = `
        <h2>Contrato de Prestação de Serviços — Empresa</h2>
        <p><strong>Data:</strong> ${dataAtual}</p>
        <p><strong>Razão Social:</strong> ${razao_social || nome}</p>
        <p><strong>CNPJ:</strong> ${cnpj || 'Não informado'}</p>
        <p><strong>Responsável:</strong> ${nome}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <hr/>
        <h3>Objeto do Contrato</h3>
        <p>Licença de uso da plataforma MedConnect para gestão de equipe médica e atendimentos de telemedicina, conforme plano contratado.</p>
        <h3>Obrigações da Empresa</h3>
        <ul>
          <li>Garantir que todos os médicos vinculados possuam CRM ativo</li>
          <li>Implementar políticas de proteção de dados conforme LGPD</li>
          <li>Manter pagamento em dia conforme plano escolhido</li>
        </ul>
        <p style="margin-top: 32px; font-size: 12px; color: #666;">MedConnect Telemedicina LTDA · CNPJ 00.000.000/0001-00</p>
      `;
    }

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `✅ Contrato MedConnect — Bem-vindo(a), ${nome}!`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1a1a2e;">
          <div style="background: #1d6fb8; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">MedConnect</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Telemedicina de Nova Geração</p>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Olá, <strong>${nome}</strong>! Bem-vindo(a) ao MedConnect.</p>
            <p>Seu cadastro foi realizado com sucesso. Abaixo está o seu contrato de prestação de serviços:</p>
            <div style="background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
              ${contratoHtml}
            </div>
            <p style="font-size: 13px; color: #6b7280;">Em caso de dúvidas, entre em contato com suporte@medconnect.com.br</p>
          </div>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});