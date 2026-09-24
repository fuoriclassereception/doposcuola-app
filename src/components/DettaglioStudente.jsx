import React, { useState } from 'react';
import { X, CheckCircle, Clock, AlertOctagon, Paperclip, User, ArrowRightLeft, Printer, Sliders } from 'lucide-react';

export default function DettaglioStudente({ studente, lezioni = [], onClose, onUpdateLezioneCompleta }) {
  const [filtroStato, setFiltroStato] = useState('tutte');
  const [editingLezioneId, setEditingLezioneId] = useState(null);
  const [moveForm, setMoveForm] = useState({ data: '', oraInizio: '', oraFine: '' });

  // Opzioni di stampa personalizzabili dalla reception
  const [opzioniStampa, setOpzioniStampa] = useState({
    includiSvolte: true,
    includiProgramma: true,
    includiAnnullate: true,
    includiContabilita: true,
    tariffaOraria: 25 // Tariffa di esempio per il calcolo del saldo/totale
  });

  const [mostraImpostazioniStampa, setMostraImpostazioniStampa] = useState(false);

  if (!studente) return null;

  const lezioniStudente = lezioni.filter(l => (l.studentiIds || []).includes(studente.id));

  const svolte = lezioniStudente.filter(l => l.stato === 'svolta');
  const inProgramma = lezioniStudente.filter(l => (!l.stato || l.stato === 'attiva'));
  const annullate = lezioniStudente.filter(l => l.stato === 'annullata');

  // Calcolo ore e totali
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
  const saldoStimato = totaleOre * opzioniStampa.tariffaOraria;

  const lezioniFiltrate = lezioniStudente.filter(l => {
    if (filtroStato === 'svolta') return l.stato === 'svolta';
    if (filtroStato === 'programma') return (!l.stato || l.stato === 'attiva');
    if (filtroStato === 'annullata') return l.stato === 'annullata';
    return true;
  });

  const handleStartEditLezione = (l) => {
    setEditingLezioneId(l.id);
    setMoveForm({ data: l.data, oraInizio: l.oraInizio, oraFine: l.oraFine });
  };

  const handleSaveMoveFromStudentCard = (l) => {
    if (onUpdateLezioneCompleta) {
      onUpdateLezioneCompleta({
        lezioneId: l.id,
        data: moveForm.data,
        oraInizio: moveForm.oraInizio,
        oraFine: moveForm.oraFine,
        insegnanteId: l.insegnanteId,
        isGruppo: l.isGruppo
      });
    }
    setEditingLezioneId(null);
  };

  // GENERAZIONE STAMPA CON FILTRI E SALDO CONTABILE
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Abilita i pop-up per stampare il report.");
      return;
    }

    // Filtra le lezioni in base alle preferenze di stampa scelte dalla reception
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
          .stat-lbl { font-size: 10px; text-transform: uppercase; color: #441; font-weight: bold; }
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header Studente & Tasti */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl">
              <User className="w-6 h-6"/>
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">{studente.nome} {studente.cognome}</h3>
              <p className="text-xs text-gray-500">
                Data nascita: <strong className="text-slate-800">{studente.dataNascita || 'N.D.'}</strong> • Scuole: {studente.scuola || 'N.D.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMostraImpostazioniStampa(!mostraImpostazioniStampa)}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold rounded-xl text-xs shadow-sm transition-all"
              title="Configura cosa stampare"
            >
              <Sliders className="w-4 h-4"/>
              <span>Opzioni Stampa</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              <Printer className="w-4 h-4"/>
              <span>Stampa A4</span>
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5"/></button>
          </div>
        </div>

        {/* PANNELLO CONFIGURAZIONE OPZIONI DI STAMPA */}
        {mostraImpostazioniStampa && (
          <div className="bg-amber-50/80 border border-amber-300 p-4 rounded-2xl space-y-3 text-xs animate-in fade-in duration-150">
            <h4 className="font-extrabold text-amber-950 uppercase tracking-wide">Configura il Report da Stampare</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opzioniStampa.includiSvolte}
                  onChange={(e) => setOpzioniStampa({ ...opzioniStampa, includiSvolte: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Includi Lezioni Svolte</span>
              </label>

              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opzioniStampa.includiProgramma}
                  onChange={(e) => setOpzioniStampa({ ...opzioniStampa, includiProgramma: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Includi In Programma</span>
              </label>

              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opzioniStampa.includiAnnullate}
                  onChange={(e) => setOpzioniStampa({ ...opzioniStampa, includiAnnullate: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Includi Annullate</span>
              </label>

              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opzioniStampa.includiContabilita}
                  onChange={(e) => setOpzioniStampa({ ...opzioniStampa, includiContabilita: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Includi Riepilogo Saldo & Ore</span>
              </label>
            </div>

            {opzioniStampa.includiContabilita && (
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                <span className="font-bold text-amber-900">Tariffa Oraria (€):</span>
                <input
                  type="number"
                  value={opzioniStampa.tariffaOraria}
                  onChange={(e) => setOpzioniStampa({ ...opzioniStampa, tariffaOraria: Number(e.target.value) || 0 })}
                  className="w-24 p-1 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 text-xs"
                />
              </div>
            )}
          </div>
        )}

        {/* CONTATORI RIEPILOGATIVI */}
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
            Riepilogo Lezioni & Ore
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0"/>
              <div>
                <div className="text-xl font-black text-emerald-950">{svolte.length} <span className="text-xs font-bold text-emerald-700">({oreSvolte.toFixed(1)}h)</span></div>
                <div className="text-[11px] font-bold text-emerald-800">Svolte</div>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl flex items-center space-x-3">
              <Clock className="w-6 h-6 text-sky-600 shrink-0"/>
              <div>
                <div className="text-xl font-black text-sky-950">{inProgramma.length} <span className="text-xs font-bold text-sky-700">({oreInProgramma.toFixed(1)}h)</span></div>
                <div className="text-[11px] font-bold text-sky-800">In Programma</div>
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-300 p-3 rounded-2xl flex items-center space-x-3">
              <AlertOctagon className="w-6 h-6 text-slate-600 shrink-0"/>
              <div>
                <div className="text-xl font-black text-slate-900">{annullate.length}</div>
                <div className="text-[11px] font-bold text-slate-700">Annullate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sezione Note / Compiti */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
          <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center">
            <Paperclip className="w-4 h-4 mr-1.5 text-amber-700"/> Note e Materiali Didattici
          </h4>
          <p className="text-xs text-amber-900 font-medium">
            {studente.note || "Nessun materiale didattico o nota registrata per questo studente."}
          </p>
        </div>

        {/* Storico e Gestione Lezioni */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Storico e Programmazione</h4>
            
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl text-[11px] font-extrabold">
              <button onClick={() => setFiltroStato('tutte')} className={`px-2.5 py-1 rounded-lg ${filtroStato === 'tutte' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>
                Tutte ({lezioniStudente.length})
              </button>
              <button onClick={() => setFiltroStato('programma')} className={`px-2.5 py-1 rounded-lg ${filtroStato === 'programma' ? 'bg-white text-sky-900 shadow-sm' : 'text-gray-500'}`}>
                In Programma
              </button>
              <button onClick={() => setFiltroStato('svolta')} className={`px-2.5 py-1 rounded-lg ${filtroStato === 'svolta' ? 'bg-white text-emerald-900 shadow-sm' : 'text-gray-500'}`}>
                Svolte
              </button>
              <button onClick={() => setFiltroStato('annullata')} className={`px-2.5 py-1 rounded-lg ${filtroStato === 'annullata' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>
                Annullate
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-200 max-h-60 overflow-y-auto">
            {lezioniFiltrate.length === 0 ? (
              <p className="p-4 text-center text-xs font-bold text-gray-400">Nessuna lezione trovata per questo filtro.</p>
            ) : (
              lezioniFiltrate.map(l => (
                <div key={l.id} className="p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900">{l.materia || 'Lezione'}</span>
                      <div className="text-[11px] text-gray-500 font-medium">📅 {l.data} • 🕒 {l.oraInizio} - {l.oraFine}</div>
                      {l.motivoAnnullamento && (
                        <p className="text-[10px] text-rose-700 font-bold mt-0.5">Motivo annullamento: {l.motivoAnnullamento}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {(!l.stato || l.stato === 'attiva') && (
                        <button
                          onClick={() => handleStartEditLezione(l)}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] flex items-center space-x-1"
                        >
                          <ArrowRightLeft className="w-3 h-3"/>
                          <span>Sposta Lezione</span>
                        </button>
                      )}

                      {l.stato === 'svolta' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">Svolta</span>}
                      {(!l.stato || l.stato === 'attiva') && <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">In Programma</span>}
                      {l.stato === 'annullata' && (
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md line-through">
                          {l.tipoAnnullamento === 'addebito' ? 'Annullata (Con Addebito)' : 'Annullata (Gratuita)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {editingLezioneId === l.id && (
                    <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Nuovo Giorno</label>
                          <input
                            type="date"
                            value={moveForm.data}
                            onChange={(e) => setMoveForm({ ...moveForm, data: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Ora Inizio</label>
                          <input
                            type="time"
                            value={moveForm.oraInizio}
                            onChange={(e) => setMoveForm({ ...moveForm, oraInizio: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Ora Fine</label>
                          <input
                            type="time"
                            value={moveForm.oraFine}
                            onChange={(e) => setMoveForm({ ...moveForm, oraFine: e.target.value })}
                            className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-1">
                        <button onClick={() => setEditingLezioneId(null)} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 font-bold rounded-lg text-[11px]">
                          Annulla
                        </button>
                        <button onClick={() => handleSaveMoveFromStudentCard(l)} className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg text-[11px]">
                          Salva Spostamento
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
