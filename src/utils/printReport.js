export function stampaReportStudente(studente, lezioniStudente, opzioniStampa) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Abilita i pop-up per stampare il report.");
    return;
  }

  const svolte = lezioniStudente.filter(l => l.stato === 'svolta');
  const inProgramma = lezioniStudente.filter(l => (!l.stato || l.stato === 'attiva'));
  const annullate = lezioniStudente.filter(l => l.stato === 'annullata');

  const calcolaOre = (lista) => {
    return lista.reduce((acc, l) => {
      const [hStart, mStart] = (l.oraInizio || '00:00').split(':').map(Number);
      const [hEnd, mEnd] = (l.oraFine || '00:00').split(':').map(Number);
      const durata = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);
      return acc + (durata > 0 ? durata / 60 : 1);
    }, 0);
  };

  const oreSvolte = calcolaOre(svolte);
  const oreInProgramma = calcolaOre(inProgramma);
  const totaleOre = oreSvolte + oreInProgramma;
  const saldoStimato = totaleOre * (opzioniStampa.tariffaOraria || 0);

  const lezioniPerStampa = lezioniStudente.filter(l => {
    const isSvolta = l.stato === 'svolta';
    const isProgramma = (!l.stato || l.stato === 'attiva');
    const isAnnullata = l.stato === 'annullata';

    if (isSvolta && !opzioniStampa.includiSvolte) return false;
    if (isProgramma && !opzioniStampa.includiProgramma) return false;
    if (isAnnullata && !opzioniStampa.includiAnnullate) return false;
    return true;
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>Prospetto Amministrativo - ${studente.nome} ${studente.cognome}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 25px; font-size: 13px; line-height: 1.4; }
        .header { border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .school-title { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .report-subtitle { font-size: 11px; color: #555; text-transform: uppercase; font-weight: bold; }
        .info-box { background: #fcfcfc; border: 1px solid #ccc; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; text-align: center; }
        .stat-card { border: 1px solid #bbb; padding: 10px; border-radius: 6px; background: #fff; }
        .stat-val { font-size: 16px; font-weight: 900; }
        .stat-lbl { font-size: 10px; text-transform: uppercase; color: #555; font-weight: bold; }
        .accounting-box { border: 2px solid #333; background: #f9f9f9; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .accounting-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
        .accounting-total { border-top: 1px solid #333; padding-top: 8px; margin-top: 8px; font-weight: 900; font-size: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; font-size: 12px; }
        th { background: #eaeaea; font-weight: bold; text-transform: uppercase; font-size: 10px; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #555; border-top: 1px solid #ccc; padding-top: 15px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="school-title">Fuori Classe</div>
          <div class="report-subtitle">Centro Studi e Doposcuola • Prospetto Situazione Studente</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #555;">
          Emissione: ${new Date().toLocaleDateString('it-IT')}
        </div>
      </div>

      <div class="info-box">
        <div class="info-grid">
          <div><strong>Studente:</strong> ${studente.nome} ${studente.cognome}</div>
          <div><strong>Data di Nascita:</strong> ${studente.dataNascita || 'N.D.'}</div>
          <div><strong>Scuola / Classe:</strong> ${studente.scuola || 'N.D.'}</div>
          <div><strong>Genitore / Contatto:</strong> ${studente.genitoreNome || 'N.D.'} (${studente.genitoreEmail || 'N.D.'})</div>
        </div>
        ${studente.note ? `<div style="margin-top: 10px; border-top: 1px dashed #bbb; padding-top: 8px;"><strong>Note Didattiche:</strong> ${studente.note}</div>` : ''}
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val" style="color: #047857;">${svolte.length} (${oreSvolte.toFixed(1)}h)</div>
          <div class="stat-lbl">Lezioni Svolte</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" style="color: #0369a1;">${inProgramma.length} (${oreInProgramma.toFixed(1)}h)</div>
          <div class="stat-lbl">In Programma</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" style="color: #b91c1c;">${annullate.length}</div>
          <div class="stat-lbl">Annullate</div>
        </div>
      </div>

      ${opzioniStampa.includiContabilita ? `
        <div class="accounting-box">
          <div style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 8px; color: #333;">Riepilogo Saldo & Contabilità</div>
          <div class="accounting-row"><span>Totale Ore Registrate (Svolte + In Programma):</span> <strong>${totaleOre.toFixed(1)} ore</strong></div>
          <div class="accounting-row"><span>Tariffa Oraria di Riferimento:</span> <strong>€ ${opzioniStampa.tariffaOraria.toFixed(2)} /h</strong></div>
          <div class="accounting-row accounting-total"><span>Saldo / Importo Totale Stimato:</span> <span>€ ${saldoStimato.toFixed(2)}</span></div>
        </div>
      ` : ''}

      <h3 style="font-size: 13px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">Dettaglio Movimenti / Lezioni</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Orario</th>
            <th>Materia / Attività</th>
            <th>Stato</th>
            <th>Note / Motivazione</th>
          </tr>
        </thead>
        <tbody>
          ${lezioniPerStampa.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: #777;">Nessuna lezione corrispondente ai filtri selezionati.</td></tr>' : 
            lezioniPerStampa.map(l => `
              <tr>
                <td>${l.data}</td>
                <td>${l.oraInizio} -${l.oraFine}</td>
                <td><strong>${l.materia || 'Lezione'}</strong></td>
                <td>${l.stato === 'svolta' ? 'Svolta' : (!l.stato || l.stato === 'attiva' ? 'In Programma' : 'Annullata')}</td>
                <td>${l.motivoAnnullamento || '-'}</td>
              </tr>
            `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>Fuori Classe - Centro Studi & Doposcuola</div>
        <div>Firma Responsabile Segreteria: ________________________</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
