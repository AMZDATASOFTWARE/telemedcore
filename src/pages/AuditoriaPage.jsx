import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES, hasPermission } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Search, Shield } from 'lucide-react';

export default function AuditoriaPage({ telemedUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const role = telemedUser?.role;
  const hasAccess = hasPermission(role, 'auditoria', 'read');

  useEffect(() => {
    if (!hasAccess) return;
    async function load() {
      try {
        const all = await base44.entities.Auditoria.list('-created_date', 200);
        if (role === ROLES.SUPERVISOR_EMPRESA) {
          setLogs(all.filter(l => l.id_empresa === telemedUser.id_empresa));
        } else {
          setLogs(all);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [role, hasAccess]);

  if (!hasAccess) {
    return <div className="text-center text-muted-foreground py-16">Acesso não autorizado</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const acaoColors = {
    INSERT: 'bg-emerald-100 text-emerald-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    VIEW: 'bg-muted text-muted-foreground',
    LOGIN: 'bg-purple-100 text-purple-800',
    LOGOUT: 'bg-muted text-muted-foreground',
    EXPORT: 'bg-amber-100 text-amber-800',
  };

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.nome_usuario || '').toLowerCase().includes(s) || l.acao.toLowerCase().includes(s) || l.tabela_alvo.toLowerCase().includes(s);
  });

  return (
    <div>
      <PageHeader title="Auditoria" description="Registro de ações do sistema (LGPD)" />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por usuário, ação ou tabela..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Data/Hora</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ação</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tabela</th>
                <th className="text-left p-4 font-medium text-muted-foreground">IP</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum registro de auditoria</td></tr>
              )}
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 text-foreground text-xs">{new Date(log.created_date).toLocaleString('pt-BR')}</td>
                  <td className="p-4 text-foreground">{log.nome_usuario || '-'}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${acaoColors[log.acao] || acaoColors.VIEW}`}>
                      {log.acao}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{log.tabela_alvo}</td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">{log.ip || '-'}</td>
                  <td className="p-4 text-muted-foreground text-xs max-w-[200px] truncate">{log.detalhes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}