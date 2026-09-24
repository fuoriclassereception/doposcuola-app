import React, { useState } from 'react';
import { X, Calendar, CheckCircle, Clock, AlertOctagon, FileText, Download, User } from 'lucide-react';

export default function DettaglioStudente({ studente, lezioni = [], onClose }) {
  const [filtroStato, setFiltroStato] = useState('tutte');

  if (!studente) return null;

  // Calcolo delle lezioni dello studente
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Studente */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl">
              <User className="w-6 h-6"/>
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">{studente.nome} {studente.cognome}</h3>
              <p className="text-xs text-gray-500">
                Nato/a il: <strong className="text-slate-800">{studente.dataNascita || 'N.D.'}</strong> • Scuole: {studente.scuola || 'N.D.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* 📊 CONTATORI RIEPILOGATIVI LATO RECEPTION */}
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
            Riepilogo Lezioni Studente
          </label>
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

        {/* Tabella / Storico Lezioni con Filtri */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Storico e Programmazione</h4>
            
            {/* Filtri */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl text-[11px] font-extrabold">
              <button
                onClick={() => setFiltroStato('tutte')}
                className={`px-2.5 py-1 rounded-lg ${filtroStato === 'tutte' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}
              >
                Tutte ({lezioniStudente.length})
              </button>
              <button
                onClick={() => setFiltroStato('programma')}
                className={`px-2.5 py-1 rounded-lg ${filtroStato === 'programma' ? 'bg-white text-sky-900 shadow-sm' : 'text-gray-500'}`}
              >
                In Programma
              </button>
              <button
                onClick={() => setFiltroStato('svolta')}
                className={`px-2.5 py-1 rounded-lg ${filtroStato === 'svolta' ? 'bg-white text-emerald-900 shadow-sm' : 'text-gray-500'}`}
              >
                Svolte
              </button>
              <button
                onClick={() => setFiltroStato('annullata')}
                className={`px-2.5 py-1 rounded-lg ${filtroStato === 'annullata' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}
              >
                Annullate
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-200 max-h-52 overflow-y-auto">
            {lezioniFiltrate.length === 0 ? (
              <p className="p-4 text-center text-xs font-bold text-gray-400">Nessuna lezione trovata per questo filtro.</p>
            ) : (
              lezioniFiltrate.map(l => (
                <div key={l.id} className="p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900">{l.materia || 'Lezione'}</span>
                    <div className="text-[11px] text-gray-500 font-medium">📅 {l.data} • 🕒 {l.oraInizio} - {l.oraFine}</div>
                  </div>
                  <div>
                    {l.stato === 'svolta' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">Svolta</span>}
                    {(!l.stato || l.stato === 'attiva') && <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">In Programma</span>}
                    {l.stato === 'annullata' && <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md line-through">Annullata</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasto Chiudi */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
