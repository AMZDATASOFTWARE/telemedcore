import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, CheckCircle, ArrowRight, CreditCard, Users, Loader2 } from 'lucide-react';

const STEPS = {
  MEDICO: ['perfil', 'stripe_connect', 'concluido'],
  EMPRESA: ['perfil', 'convidar', 'concluido'],
};

export default function OnboardingPosAssinatura() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const tipo = params.get('tipo') || 'medico'; // 'medico' | 'empresa'

  const [step, setStep] = useState('verificando');
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '', crm: '', especialidade: '', razao_social: '', cnpj: '' });
  const [saving, setSaving] = useState(false);
  const [stripeConnectUrl, setStripeConnectUrl] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    async function verificar() {
      if (!sessionId) {
        setStep('perfil');
        return;
      }
      try {
        const res = await base44.functions.invoke('verificarCheckoutStripe', { session_id: sessionId });
        if (res.data?.ok) {
          setSessionData(res.data);
          setStep('perfil');
        } else {
          setStep('erro');
        }
      } catch (e) {
        // Allow if no session (direct access)
        setStep('perfil');
      }
    }
    verificar();
  }, [sessionId]);

  async function handleSalvarPerfil() {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      const stripeCustomerId = sessionData?.customer_id;
      const stripeSubscriptionStatus = sessionData ? 'active' : 'trialing';

      let empresaId = null;

      if (tipo === 'medico') {
        // Criar empresa exclusiva para médico avulso
        const empresa = await base44.entities.Empresa.create({
          razao_social: `Consultório ${form.nome || me.full_name}`,
          cnpj: form.cpf, // CPF como identificador fiscal
          stripe_subscription_status: stripeSubscriptionStatus,
          plano: 'profissional',
          ativo: true,
        });
        empresaId = empresa.id;

        await base44.entities.UsuarioTelemed.create({
          user_id: me.id,
          nome: form.nome || me.full_name,
          cpf: form.cpf,
          email: me.email,
          role: 'MEDICO_AVULSO',
          telefone: form.telefone,
          crm: form.crm,
          especialidade: form.especialidade,
          id_empresa: empresaId,
          ativo: true,
        });

        // Gerar link Stripe Connect
        try {
          const connectRes = await base44.functions.invoke('criarStripeConnect', { email: me.email, nome: form.nome || me.full_name });
          if (connectRes.data?.url) setStripeConnectUrl(connectRes.data.url);
        } catch (e) { console.error('Stripe Connect:', e); }

        // Enviar contrato por e-mail
        await base44.functions.invoke('enviarContratoEmail', {
          email: me.email,
          nome: form.nome || me.full_name,
          tipo: 'medico_avulso',
          cpf: form.cpf,
          crm: form.crm,
          especialidade: form.especialidade,
        });

        setStep('stripe_connect');
      } else {
        // Empresa / Clínica
        const empresa = await base44.entities.Empresa.create({
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          stripe_subscription_status: stripeSubscriptionStatus,
          plano: 'enterprise',
          ativo: true,
        });
        empresaId = empresa.id;

        await base44.entities.UsuarioTelemed.create({
          user_id: me.id,
          nome: form.nome || me.full_name,
          cpf: form.cpf,
          email: me.email,
          role: 'SUPERVISOR_EMPRESA',
          telefone: form.telefone,
          id_empresa: empresaId,
          ativo: true,
        });

        // Enviar contrato
        await base44.functions.invoke('enviarContratoEmail', {
          email: me.email,
          nome: form.nome || me.full_name,
          tipo: 'empresa',
          razao_social: form.razao_social,
          cnpj: form.cnpj,
        });

        setStep('convidar');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (step === 'verificando') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando seu pagamento...</p>
        </div>
      </div>
    );
  }

  if (step === 'erro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-card rounded-2xl border border-destructive/20 p-8">
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">Erro ao verificar pagamento</h2>
          <p className="text-muted-foreground mb-6">Não conseguimos confirmar seu pagamento. Entre em contato com o suporte.</p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Configure sua conta</h1>
          <p className="text-muted-foreground mt-1.5">
            {sessionData ? '✅ Pagamento confirmado! ' : ''}Preencha seus dados para começar.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          {/* STEP: perfil */}
          {step === 'perfil' && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-foreground">Seus dados</h2>
              <div>
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Dr. João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CPF *</Label>
                  <Input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
              </div>

              {tipo === 'medico' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CRM *</Label>
                    <Input value={form.crm} onChange={e => setForm({ ...form, crm: e.target.value })} placeholder="CRM/SP 12345" />
                  </div>
                  <div>
                    <Label>Especialidade</Label>
                    <Input value={form.especialidade} onChange={e => setForm({ ...form, especialidade: e.target.value })} placeholder="Clínico Geral" />
                  </div>
                </div>
              )}

              {tipo === 'empresa' && (
                <>
                  <div>
                    <Label>Razão Social *</Label>
                    <Input value={form.razao_social} onChange={e => setForm({ ...form, razao_social: e.target.value })} placeholder="Clínica ABC Ltda" />
                  </div>
                  <div>
                    <Label>CNPJ *</Label>
                    <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
                  </div>
                </>
              )}

              <Button
                className="w-full gap-2"
                disabled={saving || !form.nome || !form.cpf || (tipo === 'medico' && !form.crm) || (tipo === 'empresa' && (!form.razao_social || !form.cnpj))}
                onClick={handleSalvarPerfil}
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <>Continuar <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>
          )}

          {/* STEP: stripe_connect (médico) */}
          {step === 'stripe_connect' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-heading font-semibold text-foreground text-lg">Conecte sua conta bancária</h2>
              <p className="text-sm text-muted-foreground">
                Para receber pagamentos de consultas diretamente, conecte sua conta bancária via Stripe Connect. Você receberá automaticamente a cada consulta realizada.
              </p>
              {stripeConnectUrl ? (
                <a href={stripeConnectUrl} target="_blank" rel="noreferrer">
                  <Button className="w-full gap-2" size="lg">
                    <CreditCard className="w-4 h-4" /> Conectar conta bancária (Stripe)
                  </Button>
                </a>
              ) : (
                <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
                  Link de conexão bancária será enviado para seu e-mail em breve.
                </div>
              )}
              <Button variant="ghost" className="w-full text-sm" onClick={() => navigate('/')}>
                Fazer depois · Ir para o Dashboard
              </Button>
            </div>
          )}

          {/* STEP: convidar (empresa) */}
          {step === 'convidar' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-semibold text-foreground text-lg">Convide sua equipe médica</h2>
              <p className="text-sm text-muted-foreground">
                Sua empresa foi cadastrada com sucesso! Agora convide seus médicos para a plataforma. Eles receberão um e-mail com as instruções de acesso.
              </p>
              <Button className="w-full gap-2" size="lg" onClick={() => navigate('/usuarios')}>
                <Users className="w-4 h-4" /> Gerenciar Médicos
              </Button>
              <Button variant="ghost" className="w-full text-sm" onClick={() => navigate('/')}>
                Ir para o Dashboard
              </Button>
            </div>
          )}

          {/* STEP: concluido */}
          {step === 'concluido' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-heading font-semibold text-foreground">Tudo pronto!</h2>
              <p className="text-sm text-muted-foreground">Seu contrato foi enviado por e-mail. Bem-vindo ao MedConnect!</p>
              <Button className="w-full" onClick={() => navigate('/')}>Acessar Dashboard</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}