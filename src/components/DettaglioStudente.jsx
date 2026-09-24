import React, { useState } from 'react';
import { X, CheckCircle, Clock, AlertOctagon, Paperclip, User, ArrowRightLeft, Printer } from 'lucide-react';

export default function DettaglioStudente({ studente, lezioni = [], onClose, onUpdateLezioneCompleta }) {
  const [filtroStato, setFiltroStato] = useState('tutte');
  const [editingLezioneId, setEditingLezioneId] = useState(null);
  const [moveForm, setMoveForm] = useState({ data: '', oraInizio: '', oraFine: '' });

  if (!studente) return null;

  const lezioniStudente = lezioni.filter(l => (l.studentiIds || []).includes(studente.id));

  const svolte = lezioniStudente.filter(l => l.stato === 'svolta');
  const inProgramma = lezioniStudente.filter(l => (!l.stato || l.stato === 'attiva'));
  const annullate = lezioniStudente.filter(l => l.stato === 'annullata');

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

  // Funzione per stampare il report dello studente
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header Studente & Tasto Stampa */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl print:hidden">
              <User className="w-6 h-6"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xl text-slate-900">{studente.nome} {studente.cognome}</h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-md hidden print:inline-block">FUORI CLASSE - REPORT STUDENTE</span>
              </div>
              <p className="text-xs text-gray-500">
                Data nascita: <strong className="text-slate-800">{studente.dataNascita || 'N.D.'}</strong> • Scuole: {studente.scuola || 'N.D.'}
              </p>
              {studente.genitoreNome && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Genitore / Contatto: <strong>{studente.genitoreNome}</strong> ({studente.genitoreEmail || 'N.D.'})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handlePrintReport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-xs shadow-sm transition-all"
              title="Stampa / Esporta PDF"
            >
              <Printer className="w-4 h-4"/>
              <span>Stampa Report</span>
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5"/></button>
          </div>
        </div>

        {/* CONTATORI RIEPILOGATIVI */}
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
            Riepilogo Lezioni Studente
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 print:hidden"/>
              <div>
                <div className="text-xl font-black text-emerald-950">{svolte.length}</div>
                <div className="text-[11px] font-bold text-emerald-800">Svolte</div>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl flex items-center space-x-3">
              <Clock className="w-6 h-6 text-sky-600 shrink-0 print:hidden"/>
              <div>
                <div className="text-xl font-black text-sky-950">{inProgramma.length}</div>
                <div className="text-[11px] font-bold text-sky-800">In Programma</div>
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-300 p-3 rounded-2xl flex items-center space-x-3">
              <AlertOctagon className="w-6 h-6 text-slate-600 shrink-0 print:hidden"/>
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
            <Paperclip className="w-4 h-4 mr-1.5 text-amber-700 print:hidden"/> Note e Materiali Didattici
          </h4>
          <p className="text-xs text-amber-900 font-medium">
            {studente.note || "Nessun materiale didattico o nota registrata per questo studente."}
          </p>
        </div>

        {/* Storico e Gestione Diretta Lezioni */}
        <div className="space-y-3">
          <div className="flex justify-between items-center print:hidden">
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

          <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-200 max-h-60 overflow-y-auto print:max-h-none print:overflow-visible">
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
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] flex items-center space-x-1 print:hidden"
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

                  {/* Form inline per lo spostamento diretto dalla scheda studente */}
                  {editingLezioneId === l.id && (
                    <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-2 text-xs print:hidden">
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

        <div className="pt-3 border-t border-gray-100 flex justify-end print:hidden">
          <button onClick={onClose} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
