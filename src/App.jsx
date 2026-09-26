// ---------- RICARICA PACCHETTO ORE STUDENTE ----------
  const handleRicaricaPacchetto = async (studenteId, datiRicarica) => {
    const std = studenti.find(s => s.id === studenteId);
    if (!std) return;

    const nuoveOreAcquistate = Number(((std.oreAcquistate || 0) + datiRicarica.oreDaAggiungere).toFixed(1));
    const nuovoTotaleDovuto = Number(((std.totaleDovuto || 0) + datiRicarica.costoDaAggiungere).toFixed(2));
    const nuovoTotalePagato = Number(((std.totalePagato || 0) + datiRicarica.pagatoDaAggiungere).toFixed(2));

    const nuovaRicaricaEntry = {
      data: datiRicarica.data || new Date().toLocaleDateString('it-IT'),
      ore: datiRicarica.oreDaAggiungere,
      costo: datiRicarica.costoDaAggiungere,
      pagato: datiRicarica.pagatoDaAggiungere,
      metodo: datiRicarica.metodoPagamento,
      note: datiRicarica.note || ''
    };

    const storicoEsistente = std.storicoRicariche || [];

    try {
      await updateDoc(doc(db, 'studenti', studenteId), {
        oreAcquistate: nuoveOreAcquistate,
        totaleDovuto: nuovoTotaleDovuto,
        totalePagato: nuovoTotalePagato,
        storicoRicariche: [nuovaRicaricaEntry, ...storicoEsistente]
      });

      aggiungiLog(`Ricarica Pacchetto FuoriClasse: ${std.nome} ${std.cognome} (+${datiRicarica.oreDaAggiungere}h, versati ${datiRicarica.pagatoDaAggiungere}€ via ${datiRicarica.metodoPagamento}${datiRicarica.note ? ' - Nota: ' + datiRicarica.note : ''})`);
    } catch (err) {
      console.error("Errore ricarica pacchetto ore:", err);
    }
  };
