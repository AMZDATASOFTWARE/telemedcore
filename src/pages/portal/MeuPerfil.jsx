import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CreditCard, DollarSign, User } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function MeuPerfil() {
  const [usuario, setUsuario] = useState(null);
  const [valorConsulta, setValorConsulta] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvandoValor, setSalvandoValor] = useState(false);
  const [conectandoStripe, setConectandoStripe] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const authUser = await base44.auth.me();
        if (authUser) {
          const usuarios = await base44.entities.UsuarioTelemed.filter({ user_id: authUser.id });
          if (usuarios.length > 0) {
            setUsuario(usuarios[0]);
            setValorConsulta(usuarios[0].valor_consulta_padrao || "");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarPerfil();
  }, []);

  async function handleSalvarValor() {
    if (!usuario) return;
    setSalvandoValor(true);
    try {
      await base44.entities.UsuarioTelemed.update(usuario.id, {
        valor_consulta_padrao: Number(valorConsulta)
      });
      toast({ title: "Sucesso!", description: "O valor da sua consulta foi atualizado." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao guardar o valor.", variant: "destructive" });
    } finally {
      setSalvandoValor(false);
    }
  }

  async function handleConectarStripe() {
    if (!usuario) return;
    setConectandoStripe(true);
    try {
      // Chama a função do backend que gera o link de Onboarding do Stripe
      const res = await base44.functions.invoke('criimport React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CreditCard, DollarSign, User } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function MeuPerfil() {
  const [usuario, setUsuario] = useState(null);
  const [valorConsulta, setValorConsulta] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvandoValor, setSalvandoValor] = useState(false);
  const [conectandoStripe, setConectandoStripe] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const authUser = await base44.auth.me();
        if (authUser) {
          const usuarios = await base44.entities.UsuarioTelemed.filter({ user_id: authUser.id });
          if (usuarios.length > 0) {
            setUsuario(usuarios[0]);
            setValorConsulta(usuarios[0].valor_consulta_padrao || "");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarPerfil();
  }, []);

  async function handleSalvarValor() {
    if (!usuario) return;
    setSalvandoValor(true);
    try {
      await base44.entities.UsuarioTelemed.update(usuario.id, {
        valor_consulta_padrao: Number(valorConsulta)
      });
      toast({ title: "Sucesso!", description: "O valor da sua consulta foi atualizado." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao guardar o valor.", variant: "destructive" });
    } finally {
      setSalvandoValor(false);
    }
  }

  async function handleConectarStripe() {
    if (!usuario) return;
    setConectandoStripe(true);
    try {
      // Chama a função do backend que gera o link de Onboarding do Stripe
      const res = await base44.functions.invoke('criarStripeConnect', {
        email: usuario.email,
        nome: usuario.nome
      });
      
      if (res.data && res.data.url) {
        window.location.href = res.data.url; // Redireciona o médico para o Stripe
      } else {
        throw new Error("URL do Stripe não retornada.");
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível conectar com o Stripe.", variant: "destructive" });
      setConectandoStripe(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight">O Meu Perfil</h1>
        
        {/* Cartão de Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
              <p className="text-lg font-medium">{usuario?.nome}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">E-mail</p>
              <p className="text-lg">{usuario?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF / Documento</p>
              <p className="text-lg">{usuario?.cpf}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Conta</p>
              <p className="text-lg font-bold text-primary">{usuario?.role?.replace('_', ' ')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cartão Financeiro - Visível APENAS para MÉDICO_AVULSO */}
        {usuario?.role === 'MEDICO_AVULSO' && (
          <Card className="border-primary/30 shadow-md">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-xl text-primary">
                <DollarSign className="w-6 h-6" />
                Configurações Financeiras e Repasses
              </CardTitle>
              <CardDescription>
                Defina o valor da sua consulta para os pacientes e conecte a sua conta bancária para receber os pagamentos automaticamente.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8 pt-6">
              {/* Secção: Valor da Consulta */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">Valor Padrão da Consulta (R$)</label>
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                    <Input 
                      type="number" 
                      value={valorConsulta} 
                      onChange={(e) => setValorConsulta(e.target.value)} 
                      className="w-40 pl-9 text-lg font-semibold"
                      placeholder="Ex: 150.00"
                    />
                  </div>
                  <Button onClick={handleSalvarValor} disabled={salvandoValor} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    {salvandoValor ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Guardar Valor
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Este é o valor que aparecerá para os pacientes na hora do agendamento.</p>
              </div>

              {/* Secção: Stripe Connect */}
              <div className="space-y-3 pt-6 border-t border-border">
                <label className="text-sm font-bold text-foreground">Recebimentos (Conta Bancária)</label>
                
                {usuario.stripe_connect_account_id ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-4 text-green-800">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-base">Conta Bancária Conectada com Sucesso!</p>
                      <p className="text-sm opacity-90 mt-1">A sua conta está pronta para receber os repasses automáticos das consultas agendadas.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 mb-4">
                      Para receber o pagamento das suas consultas, precisa de cadastrar uma conta bancária segura através da nossa parceria com o Stripe. O processo leva menos de 2 minutos.
                    </p>
                    <Button onClick={handleConectarStripe} disabled={conectandoStripe} className="bg-[#635BFF] hover:bg-[#0A2540] text-white transition-colors">
                      {conectandoStripe ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                      Configurar Conta Bancária Agora
                    </Button>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
