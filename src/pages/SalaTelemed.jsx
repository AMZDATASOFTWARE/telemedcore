import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Loader2, UserRound, Clock } from 'lucide-react';
import PEPPanel from '@/components/telemed/PEPPanel';
import GeradorDocumentos from '@/components/telemed/GeradorDocumentos';

export default function SalaTelemed() {
  const { id } = useParams(); // ID do agendamento
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Controles de Mídia WebRTC
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chamadaIniciada, setChamadaIniciada] = useState(false);

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
      } finally {
        setLoading(false);
      }
    }
    loadAgendamento();

    // Limpa a câmara ao sair da página
    return () => stopMediaTracks();
  }, [id]);

  // Função nativa WebRTC para capturar Câmara e Microfone
  async function startMedia() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
      setChamadaIniciada(true);
      
      // Atualiza o estado da consulta para "Em Atendimento" (3)
      await base44.entities.Agendamento.update(id, { estado: 3 });
      
    } catch (error) {
      console.error("Erro ao aceder à câmara:", error);
      toast({ 
        title: "Erro de Permissão", 
        description: "Não foi possível aceder à câmara ou microfone. Verifique as permissões do navegador.", 
        variant: "destructive" 
      });
    }
  }

  function stopMediaTracks() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  function toggleMic() {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  }

  function toggleCam() {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
      }
    }
  }

  async function handleEncerrar() {
    stopMediaTracks();
    // Atualiza para Finalizado (4)
    try {
      await base44.entities.Agendamento.update(id, { estado: 4 });
      toast({ title: "Consulta Finalizada", description: "O atendimento foi encerrado com sucesso." });
      navigate('/agenda');
    } catch (e) {
      console.error("Erro ao encerrar:", e);
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!agendamento) return <div className="p-8 text-center text-red-500">Sala inválida ou expirada.</div>;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      
      {/* Header Minimalista da Sala */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h1 className="font-bold text-lg">Sala de Telemedicina</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(agendamento.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            ID: {agendamento.id.split('-')[0].toUpperCase()}
          </span>
        </div>
      </header>

      {/* Container Principal: Split Screen */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* LADO ESQUERDO: VÍDEO WEBRTC */}
        <div className="flex-1 bg-zinc-950 relative flex flex-col items-center justify-center p-4">
          
          {!chamadaIniciada ? (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                <VideoIcon className="w-10 h-10 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">Pronto para iniciar?</h2>
                <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">Ao entrar na sala, o paciente será notificado e a câmara será ligada.</p>
              </div>
              <Button onClick={startMedia} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 text-lg font-bold shadow-lg shadow-emerald-900/20">
                Iniciar Atendimento
              </Button>
            </div>
          ) : (
            <>
              {/* Vídeo do Paciente (Simulado para Layout) */}
              <div className="w-full h-full relative rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <div className="text-center">
                  <UserRound className="w-20 h-20 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500 font-medium">A aguardar conexão do paciente...</p>
                </div>
                
                {/* O seu Vídeo Local (Picture in Picture) */}
                <div className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-700 z-10">
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover mirror"
                    style={{ transform: 'scaleX(-1)' }} // Efeito espelho para parecer natural
                  />
                  {!camOn && (
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                      <VideoOff className="w-6 h-6 text-red-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Controles da Chamada */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-800 z-20 shadow-xl">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleMic}
                  className={`rounded-full w-12 h-12 border-0 ${micOn ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleCam}
                  className={`rounded-full w-12 h-12 border-0 ${camOn ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                >
                  {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>

                <div className="w-px h-8 bg-zinc-700 mx-2" />

                <Button 
                  variant="destructive" 
                  onClick={handleEncerrar}
                  className="rounded-full px-6 h-12 font-bold gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
                >
                  <PhoneOff className="w-5 h-5" /> Encerrar
                </Button>
              </div>
            </>
          )}
        </div>

        {/* LADO DIREITO: PRONTUÁRIO ELETRÓNICO (PEP) */}
        <div className="w-full lg:w-[500px] xl:w-[600px] h-full bg-secondary/30 flex flex-col border-l border-border">
          <Tabs defaultValue="pep" className="flex flex-col h-full">
            <div className="px-6 pt-4 pb-2 bg-card border-b border-border">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pep">Evolução Clínica</TabsTrigger>
                <TabsTrigger value="documentos">Receitas & Atestados</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="pep" className="m-0 h-full">
                <PEPPanel agendamento={agendamento} />
              </TabsContent>
              <TabsContent value="documentos" className="m-0 h-full">
                <GeradorDocumentos agendamento={agendamento} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>
    </div>
  );
}
