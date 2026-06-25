// 🔥 MODO DETETIVE ATIVADO
  async function handleEntrarNaChamada() {
    setGerandoToken(true);
    try {
      console.log("A pedir autorização ao servidor para a sala:", id);
      
      // Invoca o backend
      const res = await base44.functions.invoke('gerarTokenSala', { id_agendamento: id });
      console.log("Resposta bruta do servidor:", res);

      // Deteta erros de comunicação com a Cloud do Base44 (ex: Função não existe)
      if (res.error) {
        alert("O servidor Base44 rejeitou a chamada (A função foi enviada para o GitHub?):\n\n" + JSON.stringify(res.error));
        setGerandoToken(false);
        return;
      }

      // Deteta erros processados pelo nosso código (ex: Tentativa de Invasão)
      if (res.data?.error) {
        toast({ title: "Acesso Bloqueado", description: res.data.error, variant: "destructive" });
        alert("O nosso código Backend bloqueou o acesso:\n\n" + res.data.error);
        setGerandoToken(false);
        return;
      }

      // Sucesso Absoluto!
      if (res.data?.token && res.data?.url) {
        setSecureRoomUrl(res.data.url);
        setChamadaIniciada(true);
        if (!isPaciente) {
          await base44.entities.Agendamento.update(id, { estado: 3 });
        }
      } else {
        alert("O servidor respondeu, mas não enviou o Token. Resposta:\n" + JSON.stringify(res.data));
      }
      
    } catch (e) {
      console.error("Falha ao validar segurança:", e);
      alert("O Frontend não conseguiu contactar o servidor (Erro de Código):\n\n" + e.message);
    } finally {
      setGerandoToken(false);
    }
  }
