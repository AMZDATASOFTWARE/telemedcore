import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Video, Shield, Users, FileText, Clock, Star, CheckCircle, ArrowRight, Building2, Stethoscope, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  { icon: Video, title: 'Videoconsulta HD', desc: 'Integração com Google Meet e Microsoft Teams para atendimentos de alta qualidade.' },
  { icon: Shield, title: 'LGPD Compliance', desc: 'Prontuários protegidos com controle de acesso por perfil e auditoria completa.' },
  { icon: FileText, title: 'Prontuário Digital', desc: 'PEP completo com geração automática de receitas, atestados e laudos em PDF.' },
  { icon: Clock, title: 'Agenda Inteligente', desc: 'Sincronização automática com Google Calendar e lembretes por e-mail via Gmail.' },
  { icon: Users, title: 'Multi-Tenant', desc: 'Gestão completa de equipes médicas com diferentes perfis e permissões.' },
  { icon: Star, title: 'Pagamentos Integrados', desc: 'Cobranças automáticas e split de pagamentos via Stripe Connect.' },
];

const TESTIMONIALS = [
  { name: 'Dr. Carlos Mendes', role: 'Cardiologista', text: 'A plataforma transformou minha prática. Atendo pacientes de todo o Brasil com segurança jurídica total.', avatar: 'CM' },
  { name: 'Clínica São Paulo Saúde', role: 'Supervisora', text: 'Gerenciar 40 médicos ficou simples. O controle financeiro e de agendamentos é impecável.', avatar: 'SP' },
  { name: 'Dra. Ana Lima', role: 'Dermatologista', text: 'Os prontuários digitais economizam 2 horas por dia. Recomendo para todos os colegas.', avatar: 'AL' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-body">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">MedConnect</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <Activity className="w-3 h-3" /> Telemedicina de Nova Geração
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-foreground leading-tight mb-6">
            A plataforma completa<br />
            <span className="text-primary">para Telemedicina B2B</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Gerencie consultas, prontuários, equipes médicas e pagamentos em um único lugar. 
            Seguro, conforme LGPD e pronto para escalar.
          </p>

          {/* CTAs principais */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link to="/pricing?tipo=medico">
              <Button size="lg" className="w-full sm:w-auto gap-3 text-base h-14 px-8">
                <Stethoscope className="w-5 h-5" />
                Sou Médico Avulso
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/pricing?tipo=empresa">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-3 text-base h-14 px-8 border-2">
                <Building2 className="w-5 h-5" />
                Sou Empresa / Clínica
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Portal Paciente */}
          <div>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <User className="w-4 h-4" />
                Portal do Paciente — Entrar / Cadastrar
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 text-center">
            {[['2.400+', 'Médicos Ativos'], ['180+', 'Clínicas Parceiras'], ['98%', 'Satisfação'], ['R$12M+', 'Transacionados']].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-heading font-bold text-primary">{n}</p>
                <p className="text-xs text-muted-foreground mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-3">Tudo que você precisa em uma plataforma</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Desenvolvido para atender clínicas, hospitais e médicos autônomos com a mais alta segurança.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos preview + CTA */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-3">Planos que crescem com você</h2>
          <p className="text-muted-foreground mb-10">Comece com 14 dias grátis. Sem cartão de crédito.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing?tipo=medico">
              <Button size="lg" className="gap-2">
                <Stethoscope className="w-4 h-4" /> Ver planos para Médicos
              </Button>
            </Link>
            <Link to="/pricing?tipo=empresa">
              <Button size="lg" variant="outline" className="gap-2">
                <Building2 className="w-4 h-4" /> Ver planos para Empresas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-foreground text-center mb-14">O que nossos clientes dizem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, avatar }) => (
              <div key={name} className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{avatar}</div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{text}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">Pronto para transformar sua prática médica?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">Junte-se a milhares de profissionais que já usam o MedConnect.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing?tipo=medico">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                <Stethoscope className="w-4 h-4" /> Começar como Médico
              </Button>
            </Link>
            <Link to="/pricing?tipo=empresa">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                <Building2 className="w-4 h-4" /> Começar como Empresa
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-primary-foreground/70">
            {['14 dias grátis', 'Sem cartão de crédito', 'Suporte humanizado', 'Cancele quando quiser'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary-foreground/60" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">MedConnect</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 MedConnect. Todos os direitos reservados. LGPD compliant.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Termos</a>
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}