import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES, hasPermission, ESTADO_AGENDAMENTO } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Calendar, Users, DollarSign, FileText, Clock, Building2 } from 'lucide-react';
import moment from 'moment';

export default function Dashboard({ telemedUser }) {
  const [stats, setStats] = useState({ agendamentos: [], empresas: [], usuarios: [] });
  const [loading, setLoading] = useState(true);
  const role = telemedUser?.role;

  useEffect(() => {
    async function load() {
      try {
        const promises = [];
        
        if (hasPermission(role, 'agendamento', 'read')) {
          promises.push(base44.entities.Agendamento.list('-created_date', 50));
        } else {
          promises.push(Promise.resolve([]));
        }

        if (role === ROLES.SUPER_ADMIN) {
          promises.push(base44.entities.Empresa.list());
          promises.push(base44.entities.UsuarioTelemed.list());
        } else {
          promises.push(Promise.resolve([]));
          promises.push(Promise.resolve([]));
        }

        const [agendamentos, empresas, usuarios] = await Promise.all(promises);
        setStats({ agendamentos, empresas, usuarios });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const today = moment().format('YYYY-MM-DD');
  const todayAppointments = stats.agendamentos.filter(a => moment(a.data_hora_inicio).format('YYYY-MM-DD') === today);
  const activeAppointments = stats.agendamentos.filter(a => a.estado < 4);

  function filterByRole(list) {
    if (role === ROLES.SUPER_ADMIN) return list;
    if (role === ROLES.SUPERVISOR_EMPRESA) return list.filter(a => a.id_empresa === telemedUser.id_empresa);
    if (role === ROLES.MEDICO_VINCULADO || role === ROLES.MEDICO_AVULSO) return list.filter(a => a.id_medico === telemedUser.id);
    if (role === ROLES.PACIENTE) return list.filter(a => a.id_paciente === telemedUser.id);
    return [];
  }

  const filtered = filterByRole(stats.agendamentos);
  const filteredToday = filterByRole(todayAppointments);
  const revenue = filtered.filter(a => a.status_pagamento_stripe === 'pago').reduce((s, a) => s + (a.valor_consulta || 0), 0);

  return (
    <div>
      <PageHeader
        title={`Olá, ${telemedUser?.nome?.split(' ')[0] || 'Usuário'}`}
        description={moment().format('dddd, D [de] MMMM [de] YYYY')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {role === ROLES.SUPER_ADMIN ? (
          <>
            <StatCard icon={Building2} label="Empresas Ativas" value={stats.empresas.filter(e => e.ativo).length} color="blue" />
            <StatCard icon={Users} label="Usuários Cadastrados" value={stats.usuarios.length} color="green" />
            <StatCard icon={DollarSign} label="Receita Total" value={`R$ ${revenue.toLocaleString('pt-BR')}`} color="purple" />
            <StatCard icon={Calendar} label="Consultas Hoje" value={todayAppointments.length} color="amber" />
          </>
        ) : (
          <>
            <StatCard icon={Calendar} label="Consultas Hoje" value={filteredToday.length} color="blue" />
            <StatCard icon={Clock} label="Consultas Ativas" value={filterByRole(activeAppointments).length} color="green" />
            {hasPermission(role, 'financeiro', 'read') && (
              <StatCard icon={DollarSign} label="Faturamento" value={`R$ ${revenue.toLocaleString('pt-BR')}`} color="purple" />
            )}
            <StatCard icon={FileText} label="Total Consultas" value={filtered.length} color="amber" />
          </>
        )}
      </div>

      {/* Upcoming appointments */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-heading font-semibold text-foreground">Próximas Consultas</h2>
        </div>
        <div className="divide-y divide-border">
          {filteredToday.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhuma consulta agendada para hoje
            </div>
          )}
          {filteredToday.slice(0, 5).map((apt) => (
            <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {moment(apt.data_hora_inicio).format('HH:mm')} - {moment(apt.data_hora_fim).format('HH:mm')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {apt.valor_consulta ? `R$ ${apt.valor_consulta.toFixed(2)}` : 'Valor não definido'}
                </p>
              </div>
              <StatusBadge estado={apt.estado} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}