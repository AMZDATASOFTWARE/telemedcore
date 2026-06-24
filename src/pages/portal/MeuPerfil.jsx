import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Phone, Mail, Check, Loader2, LogOut } from 'lucide-react';

export default function MeuPerfil({ paciente, onUpdate }) {
  const [form, setForm] = useState({
    nome: paciente.nome || '',
    telefone: paciente.telefone || '',
    cpf: paciente.cpf ? '***.***.***-**' : '', // CPF mascarado
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSalvar() {
    setSaving(true);
    try {
      const updates = {
        nome: form.nome,
        telefone: form.telefone,
      };
      // Só atualiza CPF se o usuário digitou algo diferente da máscara
      if (form.cpf && !form.cpf.includes('*')) {
        updates.cpf = form.cpf;
      }
      await base44.entities.UsuarioTelemed.update(paciente.id, updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onUpdate) onUpdate();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    await base44.auth.logout('/');
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary">
            {paciente.nome?.charAt(0) || 'P'}
          </span>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">{paciente.nome}</p>
          <p className="text-sm text-primary">Paciente</p>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Dados pessoais
        </h3>

        <div>
          <Label className="text-xs text-muted-foreground">Nome completo</Label>
          <Input
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
            className="mt-1 h-11"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">E-mail (não editável)</Label>
          <div className="mt-1 h-11 flex items-center px-3 rounded-md border border-input bg-secondary/50 text-sm text-muted-foreground gap-2">
            <Mail className="w-4 h-4" />
            {paciente.email}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Telefone</Label>
          <Input
            value={form.telefone}
            onChange={e => setForm({ ...form, telefone: e.target.value })}
            className="mt-1 h-11"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="w-3 h-3" /> CPF (criptografado)
          </Label>
          <Input
            value={form.cpf}
            onChange={e => setForm({ ...form, cpf: e.target.value })}
            className="mt-1 h-11"
            placeholder="000.000.000-00"
            onFocus={() => {
              if (form.cpf.includes('*')) setForm({ ...form, cpf: '' });
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">Seus dados são criptografados e protegidos pela LGPD.</p>
        </div>

        <Button
          className="w-full h-11 gap-2"
          onClick={handleSalvar}
          disabled={saving || saved}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Salvo com sucesso!</>
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>

      {/* Privacidade */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Privacidade e segurança
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Seus dados de saúde são protegidos conforme a LGPD
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Comunicações via TLS 1.3 (criptografia de ponta a ponta)
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Dados médicos acessíveis apenas por você e seu médico
          </p>
        </div>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full h-11 gap-2 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleLogout}>
        <LogOut className="w-4 h-4" /> Sair da conta
      </Button>
    </div>
  );
}
