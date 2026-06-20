import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, FileText } from 'lucide-react';
import moment from 'moment';

export default function Prontuarios({ telemedUser }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const role = telemedUser?.role;
  const isRestricted = role === ROLES.SUPER_ADMIN || role === ROLES.SUPERVISOR_EMPRESA;

  useEffect(() => {
    if (isRestricted) return;
    load();
  }, [isRestricted]);

  async function load() {
    setLoading(true);
    try {
      const all = await base44.entities.EvolucaoClinica.list('-created_date', 100);
      setRecords(filterByRole(all));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function filterByRole(list) {
    if (role === ROLES.MEDICO_VINCULADO || role === ROLES.MEDICO_AVULSO) return list.filter(r => r.id_medico === telemedUser.id);
    if (role === ROLES.PACIENTE) return list.filter(r => r.id_paciente === telemedUser.id);
    return [];
  }

  // RBAC: SUPER_ADMIN and SUPERVISOR_EMPRESA cannot access clinical records
  if (isRestricted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-heading font-semibold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground text-sm mt-1">Conforme LGPD, prontuários clínicos são acessíveis apenas para médicos e pacientes.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const canCreate = role === ROLES.MEDICO_VINCULADO || role === ROLES.MEDICO_AVULSO;

  return (
    <div>
      <PageHeader title="Prontuários" description="Evoluções clínicas (PEP)">
        {canCreate && (
          <Button onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova Evolução
          </Button>
        )}
      </PageHeader>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por CID, conduta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid gap-4">
        {records.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Nenhum prontuário encontrado
          </div>
        )}
        {records.filter(r => {
          if (!search) return true;
          const s = search.toLowerCase();
          return (r.texto_livre || '').toLowerCase().includes(s) || (r.cid || '').toLowerCase().includes(s) || (r.conduta || '').toLowerCase().includes(s);
        }).map((rec) => (
          <div key={rec.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-foreground">Evolução Clínica</p>
                <p className="text-xs text-muted-foreground mt-0.5">{moment(rec.data_registro || rec.created_date).format('DD/MM/YYYY HH:mm')}</p>
              </div>
              {rec.cid && <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">{rec.cid}</span>}
            </div>
            {rec.texto_livre && <p className="text-sm text-foreground/80 line-clamp-3">{rec.texto_livre}</p>}
            {rec.conduta && <p className="text-xs text-muted-foreground mt-2"><strong>Conduta:</strong> {rec.conduta}</p>}
          </div>
        ))}
      </div>

      {canCreate && <NewEvolucaoDialog open={showNew} onClose={() => setShowNew(false)} telemedUser={telemedUser} onCreated={load} />}
    </div>
  );
}

function NewEvolucaoDialog({ open, onClose, telemedUser, onCreated }) {
  const [form, setForm] = useState({ texto_livre: '', cid: '', conduta: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.EvolucaoClinica.create({
        id_medico: telemedUser.id,
        id_paciente: '',
        id_agendamento: '',
        texto_livre: form.texto_livre,
        cid: form.cid,
        conduta: form.conduta,
        data_registro: new Date().toISOString(),
      });
      onCreated();
      onClose();
      setForm({ texto_livre: '', cid: '', conduta: '' });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Evolução Clínica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Texto Livre (Evolução)</Label>
            <Textarea rows={5} value={form.texto_livre} onChange={(e) => setForm({ ...form, texto_livre: e.target.value })} placeholder="Descreva a evolução clínica..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CID-10</Label>
              <Input value={form.cid} onChange={(e) => setForm({ ...form, cid: e.target.value })} placeholder="Ex: J06.9" />
            </div>
            <div>
              <Label>Conduta</Label>
              <Input value={form.conduta} onChange={(e) => setForm({ ...form, conduta: e.target.value })} placeholder="Conduta prescrita" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}