import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, useNavigate } from 'react-router-dom';
import { isMedico } from '@/lib/rbac';
import PEPPanel from '@/components/telemed/PEPPanel';
import { Button } from '@/components/ui/button';
import { PhoneOff, Maximize2, Minimize2 } from 'lucide-react';

export default function SalaTelemed({ telemedUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pepExpanded, setPepExpanded] = useState(false);
  const jitsiRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const apt = await base44.entities.Agendamento.filter({ id });
        if (apt.length > 0) setAgendamento(apt[0]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!agendamento || !jitsiRef.current) return;
    if (apiRef.current) return; // already loaded

    const roomName = `medconnect-${agendamento.id}`;

    // Load Jitsi Meet External API dynamically
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      if (!window.JitsiMeetExternalAPI) return;
      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: jitsiRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'hangup', 'chat', 'fullscreen'],
          SHOW_JITSI_WATERMARK: false,
        },
        userInfo: {
          displayName: telemedUser?.nome || 'Usuário',
        },
      });

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        handleEncerrar();
      });
    };
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [agendamento]);

  async function handleEncerrar() {
    if (agendamento && isMedico(telemedUser?.role)) {
      try {
        await base44.entities.Agendamento.update(agendamento.id, { estado: 4, estado_label: 'Finalizado' });
      } catch (e) { console.error(e); }
    }
    navigate('/agenda');
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!agendamento) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-muted-foreground">Agendamento não encontrado.</p>
      <Button className="mt-4" onClick={() => navigate('/agenda')}>Voltar à Agenda</Button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top bar */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="font-heading font-semibold text-sm text-foreground">Sala de Atendimento</span>
          <span className="text-xs text-muted-foreground">ID: {agendamento.id?.slice(0, 8)}</span>
        </div>
        <Button variant="destructive" size="sm" onClick={handleEncerrar}>
          <PhoneOff className="w-4 h-4 mr-1" /> Encerrar Consulta
        </Button>
      </div>

      {/* Main split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video panel */}
        <div className={`${pepExpanded ? 'hidden' : 'flex-1'} relative bg-slate-900 transition-all duration-300`}>
          <div ref={jitsiRef} className="absolute inset-0" />
          <button
            onClick={() => setPepExpanded(v => !v)}
            className="absolute top-3 right-3 z-10 bg-white/20 hover:bg-white/30 text-white rounded-lg p-1.5 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Divider handle */}
        {!pepExpanded && <div className="w-px bg-border" />}

        {/* PEP Panel */}
        <div className={`${pepExpanded ? 'flex-1' : 'w-2/5'} bg-background overflow-hidden flex flex-col transition-all duration-300`}>
          {pepExpanded && (
            <div className="p-2 border-b border-border flex justify-end">
              <button
                onClick={() => setPepExpanded(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <PEPPanel agendamento={agendamento} telemedUser={telemedUser} />
          </div>
        </div>
      </div>
    </div>
  );
}