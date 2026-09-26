// Listino Tariffe Ufficiali FuoriClasse
export const TARIFFE_STANDARD = {
  elementari: {
    id: 'elementari',
    label: 'Scuola Primaria (Elementari)',
    sigla: 'ELE',
    prezzoOrarioDefault: 18.00,
    coloreBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  medie: {
    id: 'medie',
    label: 'Scuola Secondaria I Grado (Medie)',
    sigla: 'MED',
    prezzoOrarioDefault: 22.00,
    coloreBadge: 'bg-sky-100 text-sky-800 border-sky-300'
  },
  superiori: {
    id: 'superiori',
    label: 'Scuola Secondaria II Grado (Superiori)',
    sigla: 'SUP',
    prezzoOrarioDefault: 26.00,
    coloreBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  gruppo: {
    id: 'gruppo',
    label: 'Gruppo Studio / Condiviso',
    sigla: 'GRP',
    prezzoOrarioDefault: 12.00,
    coloreBadge: 'bg-amber-100 text-amber-800 border-amber-300'
  }
};

// Calcolo tariffa effettiva applicata
export function getTariffaEffettiva(studente, isLezioneGruppo = false) {
  if (!studente) return 22.00;

  if (isLezioneGruppo) {
    return TARIFFE_STANDARD.gruppo.prezzoOrarioDefault;
  }

  if (studente.haTariffaRiservata && Number(studente.tariffaRiservataValore) > 0) {
    return Number(studente.tariffaRiservataValore);
  }

  const cat = studente.categoriaTariffaria || 'medie';
  const tariffaObj = TARIFFE_STANDARD[cat] || TARIFFE_STANDARD.medie;
  return tariffaObj.prezzoOrarioDefault;
}

// Calcolo metriche borsellino economico
export function getStatoBorsellino(studente) {
  if (!studente) {
    return { totaleVersato: 0, totaleConsumato: 0, creditoResiduo: 0, daSaldare: 0, totalePattuito: 0 };
  }

  const totaleVersato = Number(studente.totaleVersato || studente.totalePagato || 0);
  const totaleConsumato = Number(studente.totaleConsumato || 0);
  const creditoResiduo = Number((totaleVersato - totaleConsumato).toFixed(2));
  
  const totalePattuito = Number(studente.totalePattuito || studente.totaleDovuto || 0);
  const daSaldare = Math.max(0, Number((totalePattuito - totaleVersato).toFixed(2)));

  return {
    totaleVersato,
    totaleConsumato,
    creditoResiduo,
    daSaldare,
    totalePattuito
  };
}
