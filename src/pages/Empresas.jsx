import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Search, Building2 } from 'lucide-react';

export default function Empresas({ telemedUser }) {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isSuperAdmin = telemedUser?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    if (!isSuperAdmin) return;
    async function load() {
      try {
        const all = await base44.entities.Empresa.list('-created_date', 100);
        setEmpresas(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return <div className="text-center text-muted-foreground py-16">Acesso restrito ao Super Admin</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const filtered = empresas.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.razao_social.toLowerCase().includes(s) || e.cnpj.includes(s);
  });

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-800',
    trialing: 'bg-blue-100 text-blue-800',
    past_due: 'bg-amber-100 text-amber-800',
    canceled: 'bg-red-100 text-red-800',
    unpaid: 'bg-red-100 text-red-800',
    incomplete: 'bg-muted text-muted-foreground',
  };

  return (
    <div>
      <PageHeader title="Empresas" description="Gerenciamento de tenants" />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por razão social ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Nenhuma empresa encontrada
          </div>
        )}
        {filtered.map((emp) => (
          <div key={emp.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{emp.razao_social}</p>
                  <p className="text-xs text-muted-foreground">{emp.cnpj}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[emp.stripe_subscription_status] || statusColors.incomplete}`}>
                  {emp.stripe_subscription_status || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}