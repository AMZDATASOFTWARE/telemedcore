import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES, hasPermission } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';

export default function Financeiro({ telemedUser }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = telemedUser?.role;
  const hasAccess = hasPermission(role, 'financeiro', 'read');

  useEffect(() => {
    if (!hasAccess) return;
    async function load() {
      try {
        const all = await base44.entities.Agendamento.list('-created_date', 200);
        setAppointments(filterByRole(all));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [role, hasAccess]);

  if (!hasAccess) {
    return <div className="text-center text-muted-foreground py-16">Acesso não autorizado</div>;
  }

  function filterByRole(list) {
    if (role === ROLES.SUPER_ADMIN) return list;
    if (role === ROLES.SUPERVISOR_EMPRESA) return list.filter(a => a.id_empresa === telemedUser.id_empresa);
    if (role === ROLES.MEDICO_VINCULADO || role === ROLES.MEDICO_AVULSO) return list.filter(a => a.id_medico === telemedUser.id);
    return [];
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const paid = appointments.filter(a => a.status_pagamento_stripe === 'pago');
  const pending = appointments.filter(a => a.status_pagamento_stripe === 'pendente');
  const failed = appointments.filter(a => a.status_pagamento_stripe === 'falhou');
  const totalRevenue = paid.reduce((s, a) => s + (a.valor_consulta || 0), 0);
  const pendingAmount = pending.reduce((s, a) => s + (a.valor_consulta || 0), 0);

  return (
    <div>
      <PageHeader title="Financeiro" description="Visão geral de faturamento e pagamentos" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Receita Total" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="green" />
        <StatCard icon={TrendingUp} label="Consultas Pagas" value={paid.length} color="blue" />
        <StatCard icon={CreditCard} label="Valores Pendentes" value={`R$ ${pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="amber" />
        <StatCard icon={AlertCircle} label="Pagamentos com Falha" value={failed.length} color="red" />
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-heading font-semibold text-foreground">Últimas Transações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Valor</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.slice(0, 20).map(apt => (
                <tr key={apt.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 text-foreground">{new Date(apt.data_hora_inicio).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 font-medium text-foreground">{apt.valor_consulta ? `R$ ${apt.valor_consulta.toFixed(2)}` : '-'}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      apt.status_pagamento_stripe === 'pago' ? 'bg-emerald-100 text-emerald-800' :
                      apt.status_pagamento_stripe === 'falhou' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {apt.status_pagamento_stripe || 'pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}