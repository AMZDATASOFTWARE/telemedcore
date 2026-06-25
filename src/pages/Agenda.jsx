import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES, hasPermission } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import moment from 'moment';

export default function Agenda({ telemedUser }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const role = telemedUser?.role;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const all = await base44.entities.Agendamento.list('-data_hora_inicio', 100);
      setAppointments(filterByRole(all));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function filterByRole(list) {
    if (role === ROLES.SUPER_ADMIN) return list;
    if (role === ROLES.SUPERVISOR_EMPRESA) return list.filter(a => a.id_empresa === telemedUser.id_empresa);
    if (role === ROLES.MEDICO_VINCULADO || role === ROLES.MEDICO_AVULSO) return list.filter(a => a.id_medico === telemedUser.id);
    if (role === ROLES.PACIENTE) return list.filter(a => a.id_paciente === telemedUser.id);
    return [];
  }

  const filtered = appointments.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return moment(a.data_hora_inicio).format('DD/MM/YYYY HH:mm').includes(s) || (a.observacoes || '').toLowerCase().includes(s);
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Agenda" description="Gerencie seus agendamentos">
        {hasPermission(role, 'agendamento', 'create') && (
          <Button onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
          </Button>
        )}
      </PageHeader>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Data / Hora</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Duração</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Valor</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Pagamento</th>
                {/* Coluna do Botão Adicionada */}
                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum agendamento encontrado</td></tr>
              )}
              {filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{moment(apt.data_hora_inicio).format('DD/MM/YYYY HH:mm')}</td>
                  <td className="p-4 text-muted-foreground">
                    {moment(apt.data_hora_fim).diff(moment(apt.data_hora_inicio), 'minutes')} min
                  </td>
                  <td className="p-4 text-foreground">{apt.valor_consulta ? `R$ ${apt.valor_consulta.toFixed(2)}` : '-'}</td>
                  <td className="p-4"><StatusBadge estado={apt.estado} /></td>
                  <td className="p-4">
                    <span className={`text-xs font-medium ${apt.status_pagamento_stripe === 'pago' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {apt.status_pagamento_stripe || 'pendente'}
                    </span>
                  </td>
                  {/* Botão de Entrar na Sala Adicionado */}
                  <td className="p-4 text-right">
                    {(apt.estado === 1 || apt.estado === 3) && (
                      <a href={`/sala-telemed/${apt.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                          Entrar na Sala
                        </Button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewAppointmentDialog open={showNew} onClose={() => setShowNew(false)} telemedUser={telemedUser} onCreated={load} />
    </div>
  );
}

function NewAppointmentDialog({ open, onClose, telemedUser, onCreated }) {
  const [form, setForm] = useState({ data_hora_inicio: '', data_hora_fim: '', valor_consulta: '', observacoes: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Agendamento.create({
        id_medico: telemedUser.role.includes('MEDICO') ? telemedUser.id : undefined,
        id_paciente: telemedUser.role === 'PACIENTE' ? telemedUser.id : undefined,
        id_empresa: telemedUser.id_empresa || undefined,
        data_hora_inicio: form.data_hora_inicio,
        data_hora_fim: form.data_hora_fim,
        valor_consulta: form.valor_consulta ? parseFloat(form.valor_consulta) : undefined,
        observacoes: form.observacoes,
        estado: 0,
        estado_label: 'Agendado',
        status_pagamento_stripe: 'pendente',
      });
      onCreated();
      onClose();
      setForm({ data_hora_inicio: '', data_hora_fim: '', valor_consulta: '', observacoes: '' });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Início</Label>
            <Input type="datetime-local" value={form.data_hora_inicio} onChange={(e) => setForm({ ...form, data_hora_inicio: e.target.value })} required />
          </div>
          <div>
            <Label>Fim</Label>
            <Input type="datetime-local" value={form.data_hora_fim} onChange={(e) => setForm({ ...form, data_hora_fim: e.target.value })} required />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={form.valor_consulta} onChange={(e) => setForm({ ...form, valor_consulta: e.target.value })} placeholder="150.00" />
          </div>
          <div>
            <Label>Observações</Label>
            <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações opcionais" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Salvando...' : 'Agendar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
