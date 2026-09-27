// ---------- CASSA: CONFERMA PRESENZA CON CONSUMO FLESSIBILE ----------
  const handleConfermaPresenzaConScalo = async (lezione, durataOre, stato = 'svolta', motivo = '', tipo = 'gratuito') => {
    try {
      await updateDoc(doc(db, 'lezioni', lezione.id), {
        stato,
        motivoAnnullamento: motivo,
        tipoAnnullamento: tipo,
        oreScalate: durataOre
      });

      if (durataOre > 0 && (stato === 'svolta' || tipo === 'addebito')) {
        for (const sId of (lezione.studentiIds || [])) {
          const std = studenti.find(s => s.id === sId);
          if (std) {
            // Se la lezione ha una tariffa personalizzata salvata al momento della prenotazione, usa quella!
            let tariffaDaApplicare = lezione.tariffaOrariaApplicata !== undefined 
              ? Number(lezione.tariffaOrariaApplicata) 
              : null;

            // Se non c'è una tariffa specifica sulla lezione, calcola quella di base dello studente
            if (tariffaDaApplicare === null) {
              if (lezione.isGruppo) {
                tariffaDaApplicare = 12.00;
              } else if (std.haTariffaRiservata && Number(std.tariffaRiservataValore) > 0) {
                tariffaDaApplicare = Number(std.tariffaRiservataValore);
              } else if (std.categoriaTariffaria === 'elementari') {
                tariffaDaApplicare = 18.00;
              } else if (std.categoriaTariffaria === 'superiori') {
                tariffaDaApplicare = 26.00;
              } else {
                tariffaDaApplicare = 22.00;
              }
            }

            const costoLezione = Number((durataOre * tariffaDaApplicare).toFixed(2));
            const nuovoConsumato = Number(((std.totaleConsumato || 0) + costoLezione).toFixed(2));

            await updateDoc(doc(db, 'studenti', sId), {
              totaleConsumato: nuovoConsumato
            });
          }
        }
      }

      aggiungiLog(`Cassa FuoriClasse: Presenza confermata per lezione ${lezione.id} (${durataOre}h)`);
    } catch (err) {
      console.error("Errore conferma presenza:", err);
    }
  };
