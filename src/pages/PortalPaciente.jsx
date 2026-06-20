import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Calendar, FileText, User, Loader2, Activity } from 'lucide-react';
import BuscarMedicos from './portal/BuscarMedicos';
import MinhasConsultas from './portal/MinhasConsultas';
import MeusDocumentos from './portal/MeusDocumentos';
import MeuPerfil from './portal/MeuPerfil';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'buscar',    label: 'Buscar',    icon: Search },
  { id: 'consultas', label: 'Consultas', icon: Calendar },
  { id: 'documentos',label: 'Docs',     icon: FileText },
  { id: 'perfil',    label: 'Perfil',   icon: User },
];

export default function PortalPaciente() {
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('consultas');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);

  useEffect(() => {
    // Checar parâmetros de retorno do Stripe
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const payment = params.get('payment');
    const sessionId = params.get('session_id');

    if (tabParam) setTab(tabParam);

    async function load() {
      setLoading(true);
      try {
        const me = await base44.auth.me();
        const users = await base44.entities.UsuarioTelemed.filter({ user_id: me.id });
        if (!users[0] || users[0].role !== 'PACIENTE') {
          navigate('/');
          return;
        }
        setPaciente(users[0]);

        // Confirmar pagamento se retornou do Stripe
        if (payment === 'success' && sessionId) {
          setConfirmandoPagamento(true);
          try {
            await base44.functions.invoke('confirmarConsultaStripe', { session_id: sessionId });
            setPaymentSuccess(true);
          } catch (e) { console.error(e); }
          finally { setConfirmandoPagamento(false); }
          // Limpar URL
          window.history.replaceState({}, '', '/portal-paciente?tab=consultas');
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!paciente) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header fixo */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 pt-10 pb-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-heading font-bold text-foreground leading-none">MedConnect</h1>
              <p className="text-xs text-muted-foreground">Olá, {paciente.nome?.split(' ')[0]}</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{paciente.nome?.charAt(0)}</span>
          </div>
        </div>

        {/* Banner pagamento confirmado */}
        {paymentSuccess && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-emerald-600 text-lg">✅</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Consulta agendada!</p>
              <p className="text-xs text-emerald-600">Pagamento confirmado. Você receberá um lembrete por e-mail.</p>
            </div>
          </div>
        )}

        {confirmandoPagamento && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-700">Confirmando seu pagamento...</p>
          </div>
        )}
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
        {tab === 'buscar' && <BuscarMedicos paciente={paciente} />}
        {tab === 'consultas' && <MinhasConsultas paciente={paciente} />}
        {tab === 'documentos' && <MeusDocumentos paciente={paciente} />}
        {tab === 'perfil' && <MeuPerfil paciente={paciente} onUpdate={() => {}} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-2 pb-safe-area-bottom">
        <div className="grid grid-cols-4 py-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}