import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { DollarSign, Users, Activity, TrendingUp, AlertTriangle, RefreshCw, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuperAdminDashboard({ telemedUser }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeData, setStripeData] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [erros, setErros] = useState([]);

  const isSuperAdmin = telemedUser?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadAll();
  }, [isSuperAdmin]);

  async function loadAll() {
    setLoading(true);
    try {
      const [empList, stripeRes] = await Promise.all([
        base44.entities.Empresa.list('-created_date', 200),
        base44.functions.invoke('stripeAdminKPIs', {}).catch(() => ({ data: null })),
      ]);
      setEmpresas(empList);
      if (stripeRes?.data) setStripeData(stripeRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  if (!isSuperAdmin) {
    return <div className="text-center text-muted-foreground py-16">Acesso restrito ao Super Admin</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const ativas = empresas.filter(e => e.stripe_subscription_status === 'active' || e.stripe_subscription_status === 'trialing');
  const inadimplentes = empresas.filter(e => e.stripe_subscription_status === 'past_due' || e.stripe_subscription_status === 'unpaid');
  const canceladas = empresas.filter(e => e.stripe_subscription_status === 'canceled');

  const mrr = stripeData?.mrr || (ativas.filter(e => e.plano === 'enterprise').length * 697 + ativas.filter(e => e.plano === 'profissional').length * 147 + ativas.filter(e => e.plano === 'basico').length * 197);

  const STATUS_COLORS = {
    active: 'bg-emerald-100 text-emerald-800',
    trialing: 'bg-blue-100 text-blue-800',
    past_due: 'bg-amber-100 text-amber-800',
    canceled: 'bg-red-100 text-red-800',
    unpaid: 'bg-red-100 text-red-800',
    incomplete: 'bg-muted text-muted-foreground',
  };

  return (
    <div>
      <PageHeader title="Super Admin — KPIs" description="Métricas globais da plataforma MedConnect">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={DollarSign}
          label="MRR (Receita Mensal Recorrente)"
          value={`R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          color="green"
        />
        <StatCard
          icon={CheckCircle}
          label="Assinaturas Ativas"
          value={stripeData?.active_subscriptions ?? ativas.length}
          color="blue"
        />
        <StatCard
          icon={Building2}
          label="Total de Empresas"
          value={empresas.length}
          color="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Inadimplentes"
          value={stripeData?.past_due ?? inadimplentes.length}
          color="red"
        />
      </div>

      {/* Stripe KPIs extra */}
      {stripeData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">ARR (Anual)</p>
            <p className="text-2xl font-heading font-bold text-foreground">
              R$ {(stripeData.mrr * 12).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">Churn Rate (mês)</p>
            <p className="text-2xl font-heading font-bold text-foreground">{stripeData.churn_rate ?? '—'}%</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">Novos este mês</p>
            <p className="text-2xl font-heading font-bold text-foreground">{stripeData.new_this_month ?? '—'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela de empresas */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground">Empresas & Assinaturas</h2>
            <span className="text-xs text-muted-foreground">{empresas.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Empresa</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Plano</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {empresas.slice(0, 15).map(emp => (
                  <tr key={emp.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-foreground truncate max-w-[160px]">{emp.razao_social}</p>
                      <p className="text-xs text-muted-foreground">{emp.cnpj}</p>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs capitalize">{emp.plano || '—'}</td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[emp.stripe_subscription_status] || STATUS_COLORS.incomplete}`}>
                        {emp.stripe_subscription_status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
                {empresas.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Nenhuma empresa cadastrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status breakdown + inadimplentes */}
        <div className="space-y-4">
          {/* Distribuição de status */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-foreground mb-4">Distribuição de Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Ativas', count: ativas.length, color: 'bg-emerald-500' },
                { label: 'Inadimplentes', count: inadimplentes.length, color: 'bg-amber-500' },
                { label: 'Canceladas', count: canceladas.length, color: 'bg-red-500' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: empresas.length > 0 ? `${(count / empresas.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inadimplentes alert */}
          {inadimplentes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">Inadimplentes ({inadimplentes.length})</h3>
              </div>
              <div className="space-y-2">
                {inadimplentes.map(emp => (
                  <div key={emp.id} className="flex justify-between items-center text-sm">
                    <span className="text-amber-800 font-medium truncate">{emp.razao_social}</span>
                    <span className="text-amber-600 text-xs ml-2">{emp.stripe_subscription_status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Planos distribuição */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-foreground mb-4">Por Plano</h2>
            <div className="space-y-2">
              {['enterprise', 'profissional', 'basico'].map(plano => {
                const cnt = empresas.filter(e => e.plano === plano).length;
                return (
                  <div key={plano} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{plano}</span>
                    <span className="font-medium text-foreground">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}