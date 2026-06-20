import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES, ESTADO_AGENDAMENTO, isMedico } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/pt-br';
import { useNavigate } from 'react-router-dom';

moment.locale('pt-br');

// Slot color per estado
const SLOT_COLORS = {
  0: 'bg-blue-100 border-blue-400 text-blue-900',       // Agendado
  1: 'bg-cyan-100 border-cyan-400 text-cyan-900',        // Confirmado
  2: 'bg-amber-100 border-amber-400 text-amber-900',     // Aguardando
  3: 'bg-purple-100 border-purple-500 text-purple-900',  // Em Atendimento
  4: 'bg-slate-100 border-slate-300 text-slate-500',     // Finalizado
  5: 'bg-red-100 border-red-300 text-red-500',           // Cancelado
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 - 19:00

export default function AgendaCalendario({ telemedUser }) {
  const [view, setView] = useState('week'); // 'day' | 'week'
  const [currentDate, setCurrentDate] = useState(moment());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const role = telemedUser?.role;

  useEffect(() => { load(); }, [currentDate]);

  async function load() {
    setLoading(true);
    try {
      const all = await base44.entities.Agendamento.list('-data_hora_inicio', 200);
      const filtered = filterByRole(all);
      setAppointments(filtered);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function filterByRole(list) {
    if (role === ROLES.SUPER_ADMIN) return list;
    if (role === ROLES.SUPERVISOR_EMPRESA) return list.filter(a => a.id_empresa === telemedUser.id_empresa);
    if (isMedico(role)) return list.filter(a => a.id_medico === telemedUser.id);
    if (role === ROLES.PACIENTE) return list.filter(a => a.id_paciente === telemedUser.id);
    return [];
  }

  function getDays() {
    if (view === 'day') return [currentDate.clone()];
    const start = currentDate.clone().startOf('week');
    return Array.from({ length: 7 }, (_, i) => start.clone().add(i, 'days'));
  }

  function getApptsForDayHour(day, hour) {
    return appointments.filter(a => {
      const start = moment(a.data_hora_inicio);
      return start.isSame(day, 'day') && start.hour() === hour;
    });
  }

  function navigate_period(dir) {
    const unit = view === 'day' ? 'day' : 'week';
    setCurrentDate(prev => prev.clone().add(dir, unit));
  }

  const days = getDays();

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Agenda" description="Visualização de consultas por dia e semana">
        <div className="flex items-center gap-2">
          <Button variant={view === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setView('day')}>Dia</Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setView('week')}>Semana</Button>
        </div>
      </PageHeader>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(ESTADO_AGENDAMENTO).map(([estado, label]) => (
          <span key={estado} className={`text-xs px-2 py-1 rounded border ${SLOT_COLORS[estado]}`}>{label}</span>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="outline" size="icon" onClick={() => navigate_period(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="font-heading font-semibold text-foreground">
          {view === 'day' ? currentDate.format('dddd, D [de] MMMM [de] YYYY') : `Semana de ${days[0].format('D MMM')} a ${days[6].format('D MMM YYYY')}`}
        </span>
        <Button variant="outline" size="icon" onClick={() => navigate_period(1)}><ChevronRight className="w-4 h-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(moment())}>Hoje</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-auto flex-1">
          <div className="min-w-[600px]">
            {/* Header row */}
            <div className={`grid border-b border-border ${view === 'week' ? 'grid-cols-8' : 'grid-cols-2'}`}>
              <div className="p-3 text-xs text-muted-foreground border-r border-border bg-secondary/30">Hora</div>
              {days.map(d => (
                <div key={d.format('YYYY-MM-DD')} className={`p-3 text-center border-r border-border last:border-0 bg-secondary/30 ${d.isSame(moment(), 'day') ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  <div className="text-xs font-medium uppercase">{d.format('ddd')}</div>
                  <div className={`text-lg font-heading ${d.isSame(moment(), 'day') ? 'w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto' : ''}`}>
                    {d.format('D')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time rows */}
            {HOURS.map(hour => (
              <div key={hour} className={`grid border-b border-border ${view === 'week' ? 'grid-cols-8' : 'grid-cols-2'}`}>
                <div className="p-2 text-xs text-muted-foreground border-r border-border flex items-start pt-2">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {days.map(d => {
                  const apts = getApptsForDayHour(d, hour);
                  return (
                    <div key={d.format('YYYY-MM-DD') + hour} className="border-r border-border last:border-0 p-1 min-h-[60px] relative">
                      {apts.map(apt => (
                        <div
                          key={apt.id}
                          className={`mb-1 p-1.5 rounded border-l-4 cursor-pointer hover:opacity-80 transition-opacity text-xs ${SLOT_COLORS[apt.estado ?? 0]}`}
                          title={ESTADO_AGENDAMENTO[apt.estado]}
                        >
                          <div className="font-semibold">{moment(apt.data_hora_inicio).format('HH:mm')}</div>
                          <div className="truncate">{ESTADO_AGENDAMENTO[apt.estado ?? 0]}</div>
                          {apt.estado === 3 && isMedico(role) && (
                            <button
                              onClick={() => navigate(`/sala-telemed/${apt.id}`)}
                              className="mt-1 flex items-center gap-1 bg-purple-600 text-white px-1.5 py-0.5 rounded text-xs"
                            >
                              <Video className="w-3 h-3" /> Entrar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}