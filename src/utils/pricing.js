/**
 * src/utils/pricing.js
 * Motore di calcolo prezzi e contabilità per FuoriClasse
 */

// Listino orario standard per grado scolastico e gruppo
export const LISTINO_ORARIO_DEFAULT = {
  elementari: 18,
  medie: 22,
  superiori: 26,
  universita: 30,
  gruppo: 12 // Tariffa oraria pro-capite per lezione di gruppo
};

/**
 * Calcola la durata in ore (es. 1h 30m -> 1.5)
 */
export function calcolaDurataOre(oraInizio, oraFine) {
  if (!oraInizio || !oraFine) return 1;
  const [hI, mI] = oraInizio.split(':').map(Number);
  const [hF, mF] = oraFine.split(':').map(Number);
  const minuti = (hF * 60 + mF) - (hI * 60 + mI);
  return minuti > 0 ? Number((minuti / 60).toFixed(2)) : 1;
}

/**
 * Determina la tariffa oraria di base di uno studente
 */
export function getTariffaOrariaStudente(studente, isGruppo = false) {
  if (isGruppo) {
    return LISTINO_ORARIO_DEFAULT.gruppo;
  }
  if (!studente) return LISTINO_ORARIO_DEFAULT.medie;

  // 1. Convenzione famiglia / Tariffa riservata allievo
  if (studente.haTariffaRiservata && studente.tariffaRiservataValore) {
    return Number(studente.tariffaRiservataValore);
  }

  // 2. Grado scolastico
  const cat = (studente.categoriaTariffaria || studente.scuola || 'medie').toLowerCase();
  if (cat.includes('elem') || cat.includes('prima')) return LISTINO_ORARIO_DEFAULT.elementari;
  if (cat.includes('sup') || cat.includes('liceo') || cat.includes('tec') || cat.includes('prof')) return LISTINO_ORARIO_DEFAULT.superiori;
  if (cat.includes('univ')) return LISTINO_ORARIO_DEFAULT.universita;
  return LISTINO_ORARIO_DEFAULT.medie;
}

/**
 * Calcola il costo esatto di una lezione per uno studente specifico
 * Gerarchia:
 * 1. Prezzo personalizzato (override forfettario o per studente)
 * 2. Prezzo snapshot congelato (se già svolta in passato)
 * 3. Tariffa oraria (riservata o standard) * durata in ore
 */
export function calcolaCostoLezione(lezione, studente) {
  if (!lezione) return 0;

  // Se la lezione è già stata congelata in passato con prezzo fisso
  if (lezione.prezzoApplicato !== undefined && lezione.prezzoApplicato !== null && lezione.prezzoApplicato !== '') {
    return Number(lezione.prezzoApplicato);
  }

  // Se c'è un prezzo forfettario/personalizzato impostato manualmente
  if (lezione.prezzoPersonalizzato !== undefined && lezione.prezzoPersonalizzato !== null && lezione.prezzoPersonalizzato !== '') {
    return Number(lezione.prezzoPersonalizzato);
  }

  // Calcolo automatico su durata
  const ore = calcolaDurataOre(lezione.oraInizio, lezione.oraFine);
  const tariffaOraria = getTariffaOrariaStudente(studente, Boolean(lezione.isGruppo));
  return Number((ore * tariffaOraria).toFixed(2));
}

/**
 * Genera l'estratto conto cronologico unificato di uno studente:
 * Unisce i versamenti registrati e le lezioni svolte (o con penale),
 * calcolando il saldo progressivo riga per riga.
 */
export function generaEstrattoConto(studente, lezioni = []) {
  if (!studente) return { movimenti: [], totaleVersato: 0, totaleConsumato: 0, saldo: 0 };

  const movimenti = [];

  // 1. Versamenti e ricariche plafond
  (studente.storicoRicariche || []).forEach((mov, idx) => {
    const importo = Number(mov.importo ?? mov.pagato) || 0;
    movimenti.push({
      id: mov.id || `ricarica_${idx}`,
      tipo: 'accredito',
      data: mov.data || '1970-01-01',
      ora: '00:00',
      descrizione: mov.causale || mov.tipoPacchetto || 'Ricarica Plafond',
      metodo: mov.metodo || 'Contanti',
      note: mov.note || '',
      variazione: +importo,
      riferimentoOriginale: mov,
      indiceRicarica: idx
    });
  });

  // 2. Lezioni svolte o con penale 100%
  const lezioniAddebitabili = lezioni.filter(l => 
    l && 
    (l.studentiIds || []).includes(studente.id) &&
    (l.stato === 'svolta' || (l.stato === 'annullata' && l.tipoAnnullamento === 'penale'))
  );

  lezioniAddebitabili.forEach(lez => {
    const costo = calcolaCostoLezione(lez, studente);
    const ore = calcolaDurataOre(lez.oraInizio, lez.oraFine);
    const isPenale = lez.stato === 'annullata' && l.tipoAnnullamento === 'penale';

    movimenti.push({
      id: `lez_${lez.id}`,
      tipo: 'addebito',
      data: lez.data || '1970-01-01',
      ora: lez.oraInizio || '00:00',
      descrizione: isPenale 
        ? `Penale Annullamento: ${lez.materia || 'Lezione'} (${ore}h)` 
        : `Lezione: ${lez.materia || 'Lezione'} (${ore}h)`,
      metodo: 'Plafond',
      note: lez.note || lez.noteAnnullamento || '',
      variazione: -costo,
      lezioneId: lez.id,
      riferimentoOriginale: lez
    });
  });

  // Ordina cronologicamente (dal più vecchio al più recente) per calcolare il saldo progressivo
  movimenti.sort((a, b) => a.data.localeCompare(b.data) || a.ora.localeCompare(b.ora));

  let saldoProgressivo = 0;
  let totaleVersato = 0;
  let totaleConsumato = 0;

  const movimentiConSaldo = movimenti.map(m => {
    saldoProgressivo += m.variazione;
    if (m.variazione > 0) totaleVersato += m.variazione;
    else totaleConsumato += Math.abs(m.variazione);

    return {
      ...m,
      saldoProgressivo: Number(saldoProgressivo.toFixed(2))
    };
  });

  return {
    // Restituisce i movimenti ordinati dal più recente al più vecchio per la vista a schermo
    movimenti: movimentiConSaldo.reverse(),
    totaleVersato: Number(totaleVersato.toFixed(2)),
    totaleConsumato: Number(totaleConsumato.toFixed(2)),
    saldo: Number(saldoProgressivo.toFixed(2))
  };
}
