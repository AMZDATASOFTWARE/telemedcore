import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLES } from '@/lib/rbac';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { DollarSign, TrendingUp, Calendar as CalendarIcon, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function Financeiro({ telemedUser }) {
  const [loading, setLoading] = useState(true);
  const [faturamento, setFaturamento] = useState(0);
  const [consultas, setConsultas] = useState(0);
  
  // Estados para o Médico Avulso
  const [valorConsulta, setValorConsulta] = useState("");
  const [salvandoValor, setSalvandoValor] = useState(false);
  const [conectandoStripe, setConectandoStripe] = useState(false);
  
  const { toast } = useToast();

  const isMedicoAvulso = telemedUser?.role === ROLES.MEDICO_AVULSO;
  const isSupervisor = telemedUser?.role === ROLES.SUPERVISOR_EMPRESA;
  const isSuperAdmin = telemedUser?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    if (telemedUser) {
      if (isMedicoAvulso) {
        setValorConsulta(telemedUser.valor_consulta_padrao || "");
      }
      loadData();
    }
  }, [telemedUser]);

  async function loadData() {
    setLoading(true);
    try {
      let filter = {};

      // Correção: telemedUser já é a entidade do banco, usamos o id direto
      if (telemedUser.role === ROLES.MEDICO_VINCULADO || telemedUser.role === ROLES.MEDICO_AVULSO) {
        filter.id_medico = telemedUser.id;
      } else if (telemedUser.role === ROLES.SUPERVISOR_EMPRESA) {
        filter.id_empresa = telemedUser.id_empresa;
      }

      const agendamentos = await base44.entities.Agendamento.filter(filter);
      const confirmados = agendamentos.filter(a => a.estado === 1 || a.estado === 4); // Confirmado ou Finalizado
      
      setConsultas(confirmados.length);
      const total = confirmados.reduce((acc, curr) => acc + (Number(curr.valor_consulta) || 0), 0);
      setFaturamento(total);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ---- FUNÇÕES DO STRIPE CONNECT (MÉDICO AVULSO) ----
 async function handleConectarStripe() {
    if (!telemedUser) return;
    setConectandoStripe(true);
    try {
      const res = await base44.functions.invoke('criarStripeConnect', {
        email: telemedUser.email,
        nome: telemedUser.nome
      });
      
      // Se o backend retornou um erro estruturado
      if (res.error) {
        alert("Erro retornado pelo servidor: " + JSON.stringify(res.error));
        setConectandoStripe(false);
        return;
      }

      // Se deu tudo certo
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert("A URL do Stripe não foi retornada. Resposta: " + JSON.stringify(res.data));
        setConectandoStripe(false);
      }
    } catch (error) {
      // Se a conexão falhou totalmente (ex: erro 500)
      alert("Falha de comunicação: " + error.message);
      setConectandoStripe(false);
    }
  }

  async function handleConectarStripe() {
    if (!telemedUser) return;
    setConectandoStripe(true);
    try {
      const res = await base44.functions.invoke('criarStripeConnect', {
        email: telemedUser.email,
        nome: telemedUser.nome
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao conectar com Stripe.", variant: "destructive" });
      setConectandoStripe(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando métricas financeiras...</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Financeiro" 
        description={isMedicoAvulso ? "Controle os seus recebimentos e valores de consulta." : "Resumo de faturamento e extrato de repasses."} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={DollarSign}
          label={isMedicoAvulso ? "Faturamento Bruto" : "Total Faturado"}
          value={`R$ ${faturamento.toFixed(2)}`}
          color="green"
        />
        <StatCard
          icon={CalendarIcon}
          label="Consultas Pagas"
          value={consultas}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Ticket Médio"
          value={`R$ ${consultas > 0 ? (faturamento / consultas).toFixed(2) : '0.00'}`}
          color="purple"
        />
      </div>

      {/* ÁREA EXCLUSIVA PARA MÉDICO AVULSO CONFIGURAR O STRIPE */}
      {isMedicoAvulso && (
        <Card className="border-primary/30 shadow-md mt-8">
          <CardHeader className="bg-primary/5 pb-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-xl text-primary">
              <CreditCard className="w-6 h-6" />
              Configurações de Pagamento e Repasses
            </CardTitle>
            <CardDescription>
              Defina o valor da sua consulta e ligue a sua conta bancária para receber os honorários automaticamente.
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
                    placeholder="150.00"
                  />
                </div>
                <Button onClick={handleSalvarValor} disabled={salvandoValor} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  {salvandoValor ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Preço
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Este valor será cobrado ao paciente no Portal de Agendamentos.</p>
            </div>

            {/* Secção: Stripe Connect */}
            <div className="space-y-3 pt-6 border-t border-border">
              <label className="text-sm font-bold text-foreground">Conta para Recebimentos</label>
              
              {telemedUser?.stripe_connect_account_id ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-4 text-green-800">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-base">Conta Bancária Ligada (Ativa)</p>
                    <p className="text-sm opacity-90 mt-1">Os repasses serão transferidos automaticamente para a sua conta bancária após cada consulta.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800 mb-4">
                    Para receber o dinheiro das consultas agendadas, precisa de ligar uma conta bancária de forma segura através do Stripe. Demora menos de 2 minutos.
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

      {isSuperAdmin && (
        <div className="mt-8 p-6 border border-border rounded-xl text-center text-muted-foreground">
          <p>O Super Admin visualiza o faturamento geral na Dashboard Principal de KPIs.</p>
        </div>
      )}
    </div>
  );
}
