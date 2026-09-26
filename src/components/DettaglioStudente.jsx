import React, { useState } from 'react';
import { X, CheckCircle, Clock, AlertOctagon, Paperclip, User, ArrowRightLeft, Printer, Sliders, Ban, RotateCcw } from 'lucide-react';
import { stampaReportStudente } from '../utils/printReport';
import ModalePin from './ModalePin';

export default function DettaglioStudente({ studente, lezioni = [], onClose, onUpdateLezioneCompleta, onUpdateLezioneStatus }) {
  const [filtroStato, setFiltroStato] = useState('tutte');
  const [editingLezioneId, setEditingLezioneId] = useState(null);
  const [moveForm, setMoveForm] = useState({ data: '', oraInizio: '', oraFine: '' });

  // Stato Modale Pin Unificato
  const [pinConfig, setPinConfig] = useState({ isOpen: false, callback: null, description: '' });

  // Stato per annullamento lezione
  const [lezioneDaAnnullare, setLezioneDaAnnullare] = useState(null);
  const [motivoAnnullamento, setMotivoAnnullamento] = useState('');
  const [tipoAnnullamento, setTipoAnnullamento] = useState('gratuito');

  // Opzioni stampa
  const [opzioniStampa, setOpzioniStampa] = useState({
    includiSvolte: true,
    includiProgramma: true,
    includiAnnullate: true,
    includiContabilita: true,
    tariffaOraria: 25
  });
  const [mostraImpostazioniStampa, setMostraImpostazioniStampa] = useState(false);

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

  const handleRequestMove = (l) => {
    setPinConfig({
      isOpen: true,
      description: `Spostamento lezione alle ore ${moveForm.oraInizio} del ${moveForm.data}`,
      callback: () => {
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
      }
    });
  };

  const handleRequestCancel = () => {
    if (!lezioneDaAnnullare) return;
    const lId = lezioneDaAnnullare.id;
    const mot = motivoAnnullamento || 'Motivo non specificato';
    const tip = tipoAnnullamento;

    setLezioneDaAnnullare(null);
    setPinConfig({
      isOpen: true,
      description: `Annullamento lezione di ${studente.nome}`,
      callback: () => {
        if (onUpdateLezioneStatus) {
          onUpdateLezioneStatus(lId, 'annullata', mot, tip);
        }
      }
    });
  };

  const handleRequestRestore = (lezioneId) => {
    setPinConfig({
      isOpen: true,
      description: `Ripristino lezione di ${studente.nome}`,
      callback: () => {
        if (onUpdateLezioneStatus) {
          onUpdateLezioneStatus(lezioneId, 'attiva', '', '');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto relative">
        
        {/* Header */}
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
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold rounded-xl text-xs transition-all"
            >
              <Sliders className="w-4 h-4"/>
              <span>Opzioni Stampa</span>
            </button>

            <button
              onClick={() => stampaReportStudente(studente, lezioniStudente, opzioniStampa)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              <Printer className="w-4 h-4"/>
              <span>Stampa A4</span>
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5"/></button>
          </div>
        </div>

        {/* Opzioni Stampa */}
        {mostraImpostazioniStampa && (
          <div className="bg-amber-50/80 border border-amber-300 p-4 rounded-2xl space-y-3 text-xs animate-in fade-in duration-150">
            <h4 className="font-extrabold text-amber-950 uppercase tracking-wide">Configura il Report da Stampare</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" checked={opzioniStampa.includiSvolte} onChange={(e) => setOpzioniStampa({ ...opzioniStampa, includiSvolte: e.target.checked })} className="rounded text-slate-900"/>
                <span>Includi Lezioni Svolte</span>
              </label>
              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" checked={opzioniStampa.includiProgramma} onChange={(e) => setOpzioniStampa({ ...opzioniStampa, includiProgramma: e.target.checked })} className="rounded text-slate-900"/>
                <span>Includi In Programma</span>
              </label>
              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" checked={opzioniStampa.includiAnnullate} onChange={(e) => setOpzioniStampa({ ...opzioniStampa, includiAnnullate: e.target.checked })} className="rounded text-slate-900"/>
                <span>Includi Annullate</span>
              </label>
              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" checked={opzioniStampa.includiContabilita} onChange={(e) => setOpzioniStampa({ ...opzioniStampa, includiContabilita: e.target.checked })} className="rounded text-slate-900"/>
                <span>Includi Riepilogo Saldo & Ore</span>
              </label>
            </div>
            {opzioniStampa.includiContabilita && (
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                <span className="font-bold text-amber-900">Tariffa Oraria (€):</span>
                <input type="number" value={opzioniStampa.tariffaOraria} onChange={(e) => setOpzioniStampa({ ...opzioniStampa, tariffaOraria: Number(e.target.value) || 0 })} className="w-24 p-1 bg-white border border-amber-300 rounded-lg font-bold text-xs"/>
              </div>
            )}
          </div>
        )}

        {/* Contatori */}
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Riepilogo Lezioni</label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0"/>
              <div>
                <div className="text-xl font-black text-emerald-950">{svolte.length}</div>
                <div className="text-[11px] font-bold text-emerald-800">Svolte</div>
              </div>
            </div>
            <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl flex items-center space-x-3">
              <Clock className="w-6 h-6 text-sky-600 shrink-0"/>
              <div>
                <div className="text-xl font-black text-sky-950">{inProgramma.length}</div>
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

        {/* Note */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
          <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center">
            <Paperclip className="w-4 h-4 mr-1.5 text-amber-700"/> Note e Materiali Didattici
          </h4>
          <p className="text-xs text-amber-900 font-medium">
            {studente.note || "Nessun materiale didattico o nota registrata per questo studente."}
          </p>
        </div>

        {/* Storico con FORM SPOSTA ATTIVO */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Storico e Programmazione</h4>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl text-[11px] font-extrabold">
              <button onClick={() => setFiltroStato('tutte')} className={`px-2.5 py-1 rounded-lg ${filtroStato === 'tutte' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Tutte ({lezioniStudente.length})</button>
              <button onClick={() => setFiltroStato('programma')} className={`px-2.5 py-1 rounded-lg ${filtroStato === 'programma' ? 'bg-white text-sky-900 shadow-sm' : 'text-gray-500'}`}>In Programma</button>
              <button onClick={() => setFiltroStato('svolta')} className={`px-2.5 py-1 rounded-lg ${filtroStato === 'svolta' ? 'bg-white text-emerald-900 shadow-sm' : 'text-gray-500'}`}>Svolte</button>
              <button onClick={() => setFiltroStato('annullata')} className={`px-2.5 py-1 rounded-lg ${filtroStato === 'annullata' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Annullate</button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-200 max-h-64 overflow-y-auto">
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
                        <>
                          <button onClick={() => handleStartEditLezione(l)} className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer">
                            <ArrowRightLeft className="w-3 h-3"/><span>Sposta</span>
                          </button>
                          <button onClick={() => { setLezioneDaAnnullare(l); setMotivoAnnullamento(''); setTipoAnnullamento('gratuito'); }} className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer">
                            <Ban className="w-3 h-3"/><span>Annulla</span>
                          </button>
                        </>
                      )}

                      {l.stato === 'svolta' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">Svolta</span>}
                      {(!l.stato || l.stato === 'attiva') && <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">In Programma</span>}
                      
                      {l.stato === 'annullata' && (
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md line-through">
                            {l.tipoAnnullamento === 'addebito' ? 'Annullata (Con Addebito)' : 'Annullata (Gratuita)'}
                          </span>
                          <button 
                            onClick={() => handleRequestRestore(l.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1 shadow-sm cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3"/><span>Ripristina</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FORM PER RISCHEDULARE / SPOSTARE LA LEZIONE */}
                  {editingLezioneId === l.id && (
                    <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-2 text-xs animate-in fade-in duration-100">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Nuovo Giorno</label>
                          <input type="date" value={moveForm.data} onChange={(e) => setMoveForm({ ...moveForm, data: e.target.value })} className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"/>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Ora Inizio</label>
                          <input type="time" value={moveForm.oraInizio} onChange={(e) => setMoveForm({ ...moveForm, oraInizio: e.target.value })} className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"/>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Ora Fine</label>
                          <input type="time" value={moveForm.oraFine} onChange={(e) => setMoveForm({ ...moveForm, oraFine: e.target.value })} className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"/>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-1">
                        <button onClick={() => setEditingLezioneId(null)} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 font-bold rounded-lg text-[11px]">Annulla</button>
                        <button onClick={() => handleRequestMove(l)} className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg text-[11px]">Salva Spostamento</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MODALE PER ANNULLAMENTO LEZIONE CON MOTIVO E PENALE */}
        {lezioneDaAnnullare && (
          <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 space-y-4">
              <h4 className="font-extrabold text-slate-900 text-sm">Disdici / Annulla Lezione</h4>
              <p className="text-xs text-gray-500">Specifica il motivo della cancellazione e la gestione dell'addebito:</p>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Motivo Annullamento</label>
                  <input type="text" placeholder="Es. Malattia, Impegno..." value={motivoAnnullamento} onChange={(e) => setMotivoAnnullamento(e.target.value)} className="w-full p-2 border border-gray-300 rounded-xl font-bold text-slate-900"/>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo Gestione</label>
                  <select value={tipoAnnullamento} onChange={(e) => setTipoAnnullamento(e.target.value)} className="w-full p-2 border border-gray-300 rounded-xl font-bold text-slate-900">
                    <option value="gratuito">Gratuito (Annullamento senza addebito)</option>
                    <option value="addebito">Con Addebito / Penalità</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button onClick={() => setLezioneDaAnnullare(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs">Indietro</button>
                <button onClick={handleRequestCancel} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs">Conferma Annullamento</button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE PIN ISOLATO TOUCH */}
        <ModalePin
          isOpen={pinConfig.isOpen}
          descrizione={pinConfig.description}
          onClose={() => setPinConfig({ isOpen: false, callback: null, description: '' })}
          onSuccess={() => {
            if (pinConfig.callback) pinConfig.callback();
            setPinConfig({ isOpen: false, callback: null, description: '' });
          }}
        />

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">Chiudi</button>
        </div>
      </div>
    </div>
  );
}
