import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText } from 'lucide-react';
import GeradorDocumentos from './GeradorDocumentos';

export default function PEPPanel({ agendamento, telemedUser }) {
  const [evolucao, setEvolucao] = useState(null);
  const [form, setForm] = useState({ texto_livre: '', cid: '', conduta: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [paciente, setPaciente] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [evols, pacs] = await Promise.all([
          agendamento.id_agendamento
            ? base44.entities.EvolucaoClinica.filter({ id_agendamento: agendamento.id })
            : base44.entities.EvolucaoClinica.filter({ id_agendamento: agendamento.id }),
          agendamento.id_paciente
            ? base44.entities.UsuarioTelemed.filter({ id: agendamento.id_paciente })
            : Promise.resolve([]),
        ]);
        if (evols.length > 0) {
          setEvolucao(evols[0]);
          setForm({
            texto_livre: evols[0].texto_livre || '',
            cid: evols[0].cid || '',
            conduta: evols[0].conduta || '',
          });
        }
        if (pacs.length > 0) setPaciente(pacs[0]);
      } catch (e) { console.error(e); }
    }
    load();
  }, [agendamento.id]);

  async function handleSave() {
    setSaving(true);
    try {
      const data = {
        id_medico: telemedUser.id,
        id_paciente: agendamento.id_paciente || '',
        id_agendamento: agendamento.id,
        texto_livre: form.texto_livre,
        cid: form.cid,
        conduta: form.conduta,
        data_registro: new Date().toISOString(),
      };
      if (evolucao) {
        await base44.entities.EvolucaoClinica.update(evolucao.id, data);
      } else {
        const novo = await base44.entities.EvolucaoClinica.create(data);
        setEvolucao(novo);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-foreground text-sm">Prontuário Eletrônico (PEP)</h3>
          {paciente && <p className="text-xs text-muted-foreground">Paciente: {paciente.nome}</p>}
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">✓ Salvo!</span>}
      </div>

      <Tabs defaultValue="evolucao" className="flex-1 flex flex-col">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="evolucao" className="flex-1 text-xs">Evolução</TabsTrigger>
          <TabsTrigger value="documentos" className="flex-1 text-xs">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="evolucao" className="flex-1 flex flex-col space-y-3 mt-0">
          <div>
            <Label className="text-xs">Evolução Clínica *</Label>
            <Textarea
              rows={6}
              value={form.texto_livre}
              onChange={(e) => setForm({ ...form, texto_livre: e.target.value })}
              placeholder="Paciente relata... ao exame... conduta..."
              className="text-sm mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">CID-10</Label>
              <Input
                value={form.cid}
                onChange={(e) => setForm({ ...form, cid: e.target.value })}
                placeholder="Ex: J06.9"
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Conduta</Label>
              <Input
                value={form.conduta}
                onChange={(e) => setForm({ ...form, conduta: e.target.value })}
                placeholder="Conduta prescrita"
                className="text-sm mt-1"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Salvando...' : evolucao ? 'Atualizar Prontuário' : 'Salvar Prontuário'}
          </Button>
        </TabsContent>

        <TabsContent value="documentos" className="mt-0 flex-1 overflow-y-auto">
          <GeradorDocumentos agendamento={agendamento} evolucao={evolucao} paciente={paciente} medico={telemedUser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}