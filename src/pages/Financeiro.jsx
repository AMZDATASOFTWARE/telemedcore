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
