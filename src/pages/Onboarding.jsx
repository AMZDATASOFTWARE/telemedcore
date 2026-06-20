import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, ArrowRight } from 'lucide-react';
import { ROLES, ROLE_LABELS } from '@/lib/rbac';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '', crm: '', especialidade: '', razao_social: '', cnpj: '' });
  const [saving, setSaving] = useState(false);

  const availableRoles = ['SUPERVISOR_EMPRESA', 'MEDICO_VINCULADO', 'MEDICO_AVULSO', 'PACIENTE'];

  async function handleSubmit() {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      let empresaId = null;

      if (role === ROLES.SUPERVISOR_EMPRESA && form.razao_social && form.cnpj) {
        const empresa = await base44.entities.Empresa.create({
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          stripe_subscription_status: 'trialing',
          plano: 'basico',
          ativo: true,
        });
        empresaId = empresa.id;
      }

      await base44.entities.UsuarioTelemed.create({
        user_id: me.id,
        nome: form.nome || me.full_name,
        cpf: form.cpf,
        email: me.email,
        role,
        telefone: form.telefone,
        crm: form.crm || undefined,
        especialidade: form.especialidade || undefined,
        id_empresa: empresaId || undefined,
        ativo: true,
      });

      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Bem-vindo ao MedConnect</h1>
          <p className="text-muted-foreground mt-2">Configure seu perfil para começar</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium">Qual é o seu perfil?</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {availableRoles.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${role === r ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                    >
                      <p className="font-semibold text-sm text-foreground">{ROLE_LABELS[r]}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" disabled={!role} onClick={() => setStep(2)}>
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" />
              </div>
              <div>
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>

              {(role === ROLES.MEDICO_VINCULADO || role === ROLES.MEDICO_AVULSO) && (
                <>
                  <div>
                    <Label>CRM</Label>
                    <Input value={form.crm} onChange={(e) => setForm({ ...form, crm: e.target.value })} placeholder="CRM/UF 00000" />
                  </div>
                  <div>
                    <Label>Especialidade</Label>
                    <Input value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} placeholder="Ex: Clínico Geral" />
                  </div>
                </>
              )}

              {role === ROLES.SUPERVISOR_EMPRESA && (
                <>
                  <div>
                    <Label>Razão Social da Empresa</Label>
                    <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} placeholder="Nome da empresa" />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                <Button onClick={handleSubmit} disabled={saving || !form.nome || !form.cpf} className="flex-1">
                  {saving ? 'Salvando...' : 'Finalizar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}