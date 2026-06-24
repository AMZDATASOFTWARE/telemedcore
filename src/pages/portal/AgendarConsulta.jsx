import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

// Gera slots de 30min entre 8h e 18h
function generateSlots(date) {
  const slots = [];
  const start = moment(date).set({ hour: 8, minute: 0, second: 0 });
  const end = moment(date).set({ hour: 18, minute: 0, second: 0 });
  while (start.isBefore(end)) {
    slots.push(start.clone());
    start.add(30, 'minutes');
  }
  return slots;
}

export default function AgendarConsulta({ medico, paciente, onBack }) {
  const [selectedDate, setSelectedDate] = useState(moment().add(1, 'day'));
  const [ocupados, setOcupados] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const valorConsulta = medico.valor_consulta_padrao || 150;

  useEffect(() => {
    async function loadOcupados() {
      setLoading(true);
      setSelectedSlot(null);
      try {
        const ini = selectedDate.clone().startOf('day').toISOString();
        const fim = selectedDate.clone().endOf('day').toISOString();
        const agendamentos = await base44.entities.Agendamento.filter({ id_medico: medico.id });
        const dodia = agendamentos.filter(a =>
          moment(a.data_hora_inicio).isSame(selectedDate, 'day') &&
          a.estado !== 5 // não cancelados
        );
        setOcupados(dodia.map(a => moment(a.data_hora_inicio).format('HH:mm')));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadOcupados();
  }, [selectedDate, medico.id]);

  async function handlePagar() {
    if (!selectedSlot) return;
    setPaying(true);
    try {
      const inicio = selectedDate.clone().set({
        hour: selectedSlot.hour(),
        minute: selectedSlot.minute(),
        second: 0,
      });
      const fim = inicio.clone().add(30, 'minutes');

      const res = await base44.functions.invoke('checkoutConsulta', {
        id_medico: medico.id,
        id_paciente: paciente.id,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
        valor_consulta: valorConsulta,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  }

  // Próximos 7 dias
  const dias = Array.from({ length: 7 }, (_, i) => moment().add(i + 1, 'days'));
  const slots = generateSlots(selectedDate);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-foreground">{medico.nome}</p>
          <p className="text-sm text-primary">{medico.especialidade || 'Clínico Geral'}</p>
        </div>
      </div>

      {/* Valor */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Valor da consulta</p>
          <p className="text-2xl font-bold text-foreground">R$ {Number(valorConsulta).toFixed(2)}</p>
        </div>
        <CreditCard className="w-8 h-8 text-primary opacity-60" />
      </div>

      {/* Seleção de data */}
      <div>
        <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Escolha a data
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dias.map(dia => {
            const isSelected = dia.isSame(selectedDate, 'day');
            return (
              <button
                key={dia.format('YYYY-MM-DD')}
                onClick={() => setSelectedDate(dia)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <span className="text-xs font-medium">{dia.format('ddd').toUpperCase()}</span>
                <span className="text-lg font-bold">{dia.format('D')}</span>
                <span className="text-xs">{dia.format('MMM')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seleção de horário */}
      <div>
        <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Horários disponíveis
        </p>
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map(slot => {
              const hora = slot.format('HH:mm');
              const ocupado = ocupados.includes(hora);
              const isSelected = selectedSlot && selectedSlot.isSame(slot);
              return (
                <button
                  key={hora}
                  disabled={ocupado}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    ocupado
                      ? 'bg-muted text-muted-foreground line-through cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
                  }`}
                >
                  {hora}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo e botão pagar */}
      {selectedSlot && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="font-semibold text-foreground">Resumo do agendamento</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>📅 {selectedDate.format('dddd, D [de] MMMM')}</p>
            <p>🕐 {selectedSlot.format('HH:mm')} — {selectedSlot.clone().add(30, 'm').format('HH:mm')}</p>
            <p>👨‍⚕️ {medico.nome}</p>
          </div>
          <Button
            className="w-full h-12 text-base gap-2"
            onClick={handlePagar}
            disabled={paying}
          >
            {paying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecionando...</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Pagar R$ {Number(valorConsulta).toFixed(2)}</>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">Pagamento seguro via Stripe. O agendamento só é confirmado após o pagamento.</p>
        </div>
      )}
    </div>
  );
}
