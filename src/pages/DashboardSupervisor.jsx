import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { Users, DollarSign, Clock, CheckCircle } from 'lucide-react';
import moment from 'moment';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardSupervisor({ telemedUser }) {
  const [medicos, setMedicos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meds, agends] = await Promise.all([
          base44.entities.UsuarioTelemed.filter({ id_empresa: telemedUser.id_empresa }),
          base44.entities.Agendamento.filter({ id_empresa: telemedUser.id_empresa }, '-data_hora_inicio', 200),
        ]);
        setMedicos(meds.filter(u => u.role?.includes('MEDICO')));
        setAgendamentos(agends);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [telemedUser.id_empresa]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const pagos = agendamentos.filter(a => a.status_pagamento_stripe === 'pago');
  const pendentes = agendamentos.filter(a => a.status_pagamento_stripe === 'pendente');
  const totalFaturado = pagos.reduce((s, a) => s + (a.valor_consulta || 0), 0);
  const totalPendente = pendentes.reduce((s, a) => s + (a.valor_consulta || 0), 0);

  // Group by last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const m = moment().subtract(5 - i, 'months');
    return {
      mes: m.format('MMM'),
      key: m.format('YYYY-MM'),
      faturado: 0,
    };
  });
  pagos.forEach(a => {
    const key = moment(a.data_hora_inicio).format('YYYY-MM');
    const found = last6Months.find(m => m.key === key);
    if (found) found.faturado += (a.valor_consulta || 0);
  });

  // Repasses pendentes por médico
  const repassesPorMedico = {};
  pendentes.forEach(a => {
    if (!a.id_medico) return;
    if (!repassesPorMedico[a.id_medico]) {
      const med = medicos.find(m => m.id === a.id_medico);
      repassesPorMedico[a.id_medico] = { nome: med?.nome || 'Médico', total: 0, consultas: 0 };
    }
    repassesPorMedico[a.id_medico].total += (a.valor_consulta || 0);
    repassesPorMedico[a.id_medico].consultas += 1;
  });

  return (
    <div>
      <PageHeader title="Dashboard da Clínica" description="Visão geral financeira e de médicos vinculados" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Médicos Ativos" value={medicos.filter(m => m.ativo).length} color="blue" />
        <StatCard icon={CheckCircle} label="Consultas Pagas" value={pagos.length} color="green" />
        <StatCard icon={DollarSign} label="Total Faturado" value={`R$ ${totalFaturado.toLocaleString('pt-BR')}`} color="purple" />
        <StatCard icon={Clock} label="Repasse Pendente" value={`R$ ${totalPendente.toLocaleString('pt-BR')}`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">Faturamento — Últimos 6 Meses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`R$ ${v.toFixed(2)}`, 'Faturado']} />
              <Bar dataKey="faturado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Médicos list */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">Médicos Vinculados</h3>
          <div className="space-y-3">
            {medicos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum médico vinculado</p>}
            {medicos.map(m => {
              const consultasMed = agendamentos.filter(a => a.id_medico === m.id && a.status_pagamento_stripe === 'pago').length;
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.nome}</p>
                    <p className="text-xs text-muted-foreground">{m.especialidade || 'Clínica Geral'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{consultasMed} pagas</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Repasses Pendentes */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="font-heading font-semibold text-foreground">Repasses Pendentes por Médico</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Consultas finalizadas aguardando repasse via Stripe Connect</p>
        </div>
        <div className="divide-y divide-border">
          {Object.keys(repassesPorMedico).length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">Nenhum repasse pendente 🎉</div>
          )}
          {Object.entries(repassesPorMedico).map(([id, info]) => (
            <div key={id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{info.nome}</p>
                <p className="text-xs text-muted-foreground">{info.consultas} consulta(s) pendente(s)</p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold text-amber-600">R$ {info.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">aguardando repasse</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}