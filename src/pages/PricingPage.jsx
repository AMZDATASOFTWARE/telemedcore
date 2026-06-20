import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, CheckCircle, ArrowLeft, Zap, Building2, Stethoscope, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const PLANS_MEDICO = [
  {
    id: 'medico_mensal',
    name: 'Médico Avulso',
    period: 'Mensal',
    price: 'R$ 197',
    priceDetail: '/mês',
    stripe_price_id: 'price_1TkJhLL04LdxLhj9mN1pRhT3',
    features: [
      'Agenda ilimitada',
      'Videoconsulta integrada',
      'Prontuário digital completo',
      'Emissão de receitas e atestados',
      'Split de pagamento via Stripe Connect',
      'Lembretes automáticos por e-mail',
      'Suporte via chat',
    ],
    highlight: false,
  },
  {
    id: 'medico_anual',
    name: 'Médico Avulso',
    period: 'Anual',
    price: 'R$ 147',
    priceDetail: '/mês · cobrado anualmente',
    stripe_price_id: 'price_1TkJlqL04LdxLhj9v4PnY9W0',
    savings: 'Economize R$ 600/ano',
    features: [
      'Tudo do plano Mensal',
      '2 meses grátis',
      'Onboarding dedicado',
      'Integração Google Calendar',
      'Relatórios financeiros avançados',
      'Suporte prioritário',
    ],
    highlight: true,
  },
];

const PLANS_EMPRESA = [
  {
    id: 'empresa_mensal',
    name: 'Empresa',
    period: 'Mensal',
    price: 'R$ 897',
    priceDetail: '/mês · até 10 médicos',
    stripe_price_id: 'price_1TkJsFL04LdxLhj9rPicgJf7',
    features: [
      'Até 10 médicos vinculados',
      'Dashboard de supervisão',
      'Relatórios consolidados',
      'Gestão de equipe médica',
      'Agenda multi-médico',
      'Suporte dedicado',
    ],
    highlight: false,
  },
  {
    id: 'empresa_anual',
    name: 'Empresa Enterprise',
    period: 'Anual',
    price: 'R$ 697',
    priceDetail: '/mês · médicos ilimitados',
    stripe_price_id: 'price_1TkJtOL04LdxLhj9kHM82K83',
    savings: 'Economize R$ 2.400/ano',
    features: [
      'Médicos ilimitados',
      'Tudo do plano Mensal',
      'Integração BigQuery (LGPD)',
      'Exportação Google Sheets/Slides',
      'Contrato personalizado',
      'SLA 99.9% garantido',
      'Suporte 24/7',
    ],
    highlight: true,
  },
];

export default function PricingPage() {
  const [tipo, setTipo] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('tipo') || 'medico';
  });
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();

  const plans = tipo === 'empresa' ? PLANS_EMPRESA : PLANS_MEDICO;

  async function handleSubscribe(plan) {
    setLoading(plan.id);
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      if (!isAuthed) {
        // Save intent and redirect to register
        sessionStorage.setItem('checkout_plan', JSON.stringify({ planId: plan.id, tipo, stripe_price_id: plan.stripe_price_id }));
        navigate(`/register?next=/pricing&plan=${plan.id}`);
        return;
      }
      // Invoke Stripe checkout backend function
      const res = await base44.functions.invoke('createStripeCheckout', {
        price_id: plan.stripe_price_id,
        tipo,
        plan_id: plan.id,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">MedConnect</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading font-extrabold text-foreground mb-3">Escolha seu plano</h1>
          <p className="text-muted-foreground text-lg">14 dias grátis · Sem cartão de crédito · Cancele quando quiser</p>
        </div>

        {/* Toggle tipo */}
        <div className="flex justify-center mb-10">
          <div className="bg-secondary rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setTipo('medico')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tipo === 'medico' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Stethoscope className="w-4 h-4" /> Médico Avulso
            </button>
            <button
              onClick={() => setTipo('empresa')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tipo === 'empresa' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Building2 className="w-4 h-4" /> Empresa / Clínica
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card rounded-2xl border-2 p-8 relative flex flex-col transition-shadow hover:shadow-lg ${plan.highlight ? 'border-primary shadow-md' : 'border-border'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> MAIS POPULAR
                </div>
              )}
              {plan.savings && (
                <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {plan.savings}
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{plan.period}</p>
                <h2 className="text-xl font-heading font-bold text-foreground mb-4">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-heading font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.priceDetail}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant={plan.highlight ? 'default' : 'outline'}
                className="w-full gap-2"
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? (
                  <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Aguarde...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Assinar agora</>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center bg-secondary/40 rounded-2xl p-8 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-2">Garantia de 30 dias</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Se não ficar satisfeito nos primeiros 30 dias, devolvemos 100% do valor pago. Sem perguntas.
          </p>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Entrar no portal</Link>
          </p>
        </div>
      </div>
    </div>
  );
}