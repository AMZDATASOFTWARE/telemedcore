import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Calendar, Video, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ESTADO_AGENDAMENTO, ESTADO_COLORS } from '@/lib/rbac';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function isConsultaEmBreve(dataHora) {
  const diff = moment(dataHora).diff(moment(), 'minutes');
  return diff >= 0 && diff <= 15;
}

export default function MinhasConsultas({ paciente }) {
  const [consultas, setConsultas] = useState([]);
  const [medicos, setMedicos] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('proximas');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const all = await base44.entities.Agendamento.filter({ id_paciente: paciente.id });
        setConsultas(all.sort((a, b) => new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio)));

        // Buscar nomes dos médicos
        const ids = [...new Set(all.map(a => a.id_medico).filter(Boolean))];
        const medicosMap = {};
        await Promise.all(ids.map(async id => {
          const res = await base44.entities.UsuarioTelemed.filter({ id });
          if (res[0]) medicosMap[id] = res[0];
        }));
        setMedicos(medicosMap);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [paciente.id]);

  const proximas = consultas.filter(c => moment(c.data_hora_inicio).isAfter(moment()) && c.estado !== 5);
  const passadas = consultas.filter(c => moment(c.data_hora_inicio).isBefore(moment()) || c.estado === 5);

  const lista = tab === 'proximas' ? proximas : passadas;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Carregando consultas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="grid grid-cols-2 bg-secondary rounded-2xl p-1">
        <button
          onClick={() => setTab('proximas')}
          className={`py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'proximas' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
        >
          Próximas ({proximas.length})
        </button>
        <button
          onClick={() => setTab('passadas')}
          className={`py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'passadas' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
        >
          Histórico ({passadas.length})
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma consulta {tab === 'proximas' ? 'agendada' : 'no histórico'}</p>
          {tab === 'proximas' && (
            <p className="text-sm mt-1">Use "Buscar Médico" para agendar</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(consulta => {
            const medico = medicos[consulta.id_medico];
            const emBreve = isConsultaEmBreve(consulta.data_hora_inicio);
            const estadoKey = consulta.estado ?? 0;
            return (
              <div key={consulta.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{medico?.nome || 'Médico'}</p>
                    <p className="text-sm text-primary">{medico?.especialidade || 'Consulta'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${ESTADO_COLORS[estadoKey]}`}>
                    {ESTADO_AGENDAMENTO[estadoKey]}
                  </span>
                </div>

                {/* Data/hora */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {moment(consulta.data_hora_inicio).format('D [de] MMM, ddd')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {moment(consulta.data_hora_inicio).format('HH:mm')}
                  </span>
                </div>

                {/* Valor */}
                {consulta.valor_consulta && (
                  <p className="text-sm text-muted-foreground">
                    💳 R$ {Number(consulta.valor_consulta).toFixed(2)} · {consulta.status_pagamento_stripe === 'pago' ? '✅ Pago' : '⏳ Pendente'}
                  </p>
                )}

                {/* Botão entrar na videochamada */}
                {emBreve && consulta.link_video_webrtc && (
                  <a href={`/sala-telemed/${consulta.id}`} className="block">
                    <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white gap-2 animate-pulse">
                      <Video className="w-5 h-5" />
                      Entrar na Videochamada
                    </Button>
                  </a>
                )}

                {/* Botão entrar (em atendimento) */}
                {consulta.estado === 3 && consulta.link_video_webrtc && !emBreve && (
                  <a href={`/sala-telemed/${consulta.id}`} className="block">
                    <Button className="w-full h-12 gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                      <Video className="w-5 h-5" />
                      Entrar na Consulta
                    </Button>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}