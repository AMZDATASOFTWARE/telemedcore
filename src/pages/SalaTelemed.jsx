import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ROLES } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Clock, Video, VideoOff } from 'lucide-react';
import PEPPanel from '@/components/telemed/PEPPanel';
import GeradorDocumentos from '@/components/telemed/GeradorDocumentos';

export default function SalaTelemed({ telemedUser }) {
  const { id } = useParams(); // ID do agendamento
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chamadaIniciada, setChamadaIniciada] = useState(false);

  // Verifica se o usuário logado é o paciente
  const isPaciente = telemedUser?.role === ROLES.PACIENTE;

  useEffect(() => {
    async function loadAgendamento() {
      try {
        const agends = await base44.entities.Agendamento.filter({ id });
        if (agends.length > 0) {
          setAgendamento(agends[0]);
        } else {
          toast({ title: "Erro", description: "Agendamento não encontrado.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Erro ao carregar sala:", error);
      } bits {
        setLoading(false);
      }
    }
    loadAgendamento();
  }, [id]);

  async function handleEntrarNaChamada() {
    setChamadaIniciada(true);
    try {
      // Se for o médico, atualiza o estado da consulta para "Em Atendimento" (3) no banco
      if (!isPaciente) {
        await base44.entities.Agendamento.update(id, { estado: 3 });
      }
    } catch (e) {
      console.error("Erro ao atualizar estado:", e);
    }
  }

  async function handleEncerrarAtendimento() {
    try {
      if (!isPaciente) {
        // Se for o médico, encerra a consulta de vez mudando para Finalizado (4)
        await base44.entities.Agendamento.update(id, { estado: 4 });
        toast({ title: "Atendimento Concluído", description: "A consulta foi encerrada e salva." });
        navigate('/agenda');
      } else {
        // Se for o paciente, apenas sai da sala e volta para o portal dele
        toast({ title: "Sala Encerrada", description: "Você saiu da videoconferência." });
        navigate('/portal-paciente');
      }
    } catch (e) {
      console.error(e);
      navigate(isPaciente ? '/portal-paciente' : '/agenda');
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!agendamento) return <div className="p-8 text-center text-red-500">Sala inválida ou expirada.</div>;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      
      {/* Header Superior da Sala */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h1 className="font-bold text-sm lg:text-lg truncate">Sala de Telemedicina</h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-1 hidden md:flex">
            <Clock className="w-4 h-4" /> {new Date(agendamento.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 text-xs font-bold">
            {isPaciente ? "PAINEL DO PACIENTE" : "PAINEL DO MÉDICO"}
          </span>
        </div>
      </header>

      {/* Área Split Screen */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        
        {/* LADO ESQUERDO: O MOTOR DO VÍDEO WEBRTC */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 bg-zinc-950 relative flex flex-col p-2 lg:p-4">
          
          {!chamadaIniciada ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 animate-bounce">
                <Video className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="px-4 space-y-2">
                <h2 className="text-white text-xl font-bold">A sua sala privada está pronta</h2>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                  Clique no botão abaixo para ativar a câmara, o microfone e conectar-se instantaneamente de forma segura.
                </p>
              </div>
              <Button onClick={handleEntrarNaChamada} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 text-base font-bold shadow-xl">
                {isPaciente ? "Entrar na Consulta de Vídeo" : "Iniciar Transmissão de Vídeo"}
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full relative">
              
              {/* IFRAME WEBRTC EMBUTIDO COM PARÂMETROS PREMIUM */}
              <iframe
                src={`https://meet.jit.si/telemedcore-sala-exclusiva-${id}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.toolbarButtons=['microphone','camera','toggle-camera','chat','tileview']&interfaceConfig.VIDEO_LAYOUT_FIT='both'`}
                allow="camera; microphone; display-capture; autoplay"
                className="w-full flex-1 bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl"
                title="Chamada de Vídeo Telemedicina"
              />

              {/* Botão Flutuante Superior para Sair/Encerrar sem quebrar o layout */}
              <div className="absolute top-3 left-3 z-30">
                <Button 
                  variant="destructive" 
                  onClick={handleEncerrarAtendimento}
                  className="h-9 rounded-lg px-4 text-xs font-bold shadow-md opacity-90 hover:opacity-100 bg-red-600 hover:bg-red-700"
                >
                  {isPaciente ? "Sair da Sala" : "Encerrar Atendimento"}
                </Button>
              </div>

            </div>
          )}
        </div>

        {/* LADO DIREITO: PRONTUÁRIO MÉDICO (SÓ APARECE SE NÃO FOR PACIENTE) */}
        {!isPaciente && (
          <div className="flex-1 lg:flex-none lg:w-[480px] xl:w-[580px] bg-secondary/10 flex flex-col border-t lg:border-t-0 lg:border-l border-border overflow-hidden">
            <Tabs defaultValue="pep" className="flex flex-col h-full overflow-hidden">
              <div className="px-4 lg:px-6 pt-3 pb-2 bg-card border-b border-border shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pep" className="text-xs lg:text-sm font-semibold">Evolução Clínica (PEP)</TabsTrigger>
                  <TabsTrigger value="documentos" className="text-xs lg:text-sm font-semibold">Receitas & Atestados</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <TabsContent value="pep" className="m-0 h-full">
                  <PEPPanel agendamento={agendamento} />
                </TabsContent>
                <TabsContent value="documentos" className="m-0 h-full">
                  <GeradorDocumentos agendamento={agendamento} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

      </div>
    </div>
  );
}
