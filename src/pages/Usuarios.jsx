import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES, ROLE_LABELS, isAdmin } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Search, UserCheck, UserX } from 'lucide-react';

export default function Usuarios({ telemedUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const role = telemedUser?.role;

  useEffect(() => {
    async function load() {
      try {
        const all = await base44.entities.UsuarioTelemed.list('-created_date', 100);
        if (role === ROLES.SUPERVISOR_EMPRESA) {
          setUsers(all.filter(u => u.id_empresa === telemedUser.id_empresa));
        } else {
          setUsers(all);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [role]);

  if (!isAdmin(role)) {
    return <div className="text-center text-muted-foreground py-16">Acesso não autorizado</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.nome.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.cpf.includes(s);
  });

  return (
    <div>
      <PageHeader title="Usuários" description="Gestão de usuários do sistema" />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, e-mail ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-4 font-medium text-muted-foreground">E-mail</th>
                <th className="text-left p-4 font-medium text-muted-foreground">CPF</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Perfil</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{u.nome}</td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4 text-muted-foreground">{u.cpf}</td>
                  <td className="p-4">
                    <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.ativo !== false ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium"><UserCheck className="w-3.5 h-3.5" /> Ativo</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium"><UserX className="w-3.5 h-3.5" /> Inativo</span>
                    )}
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