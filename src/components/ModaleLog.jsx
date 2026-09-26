import React, { useState } from 'react';
import { X, History, Search, ShieldCheck } from 'lucide-react';

export default function ModaleLog({ isOpen, onClose, logs = [] }) {
  const [ricerca, setRicerca] = useState('');

  if (!isOpen) return null;

  const logsFiltrati = logs.filter(l =>
    l.azione.toLowerCase().includes(ricerca.toLowerCase()) ||
    l.operatore.toLowerCase().includes(ricerca.toLowerCase()) ||
    l.timestamp.toLowerCase().includes(ricerca.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] space-y-4 animate-in fade-in zoom-in duration-150">
        
        {/* Intestazione */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2.5 text-slate-900">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-black text-base">Registro Attività & Log di Sicurezza</h3>
              <p className="text-[11px] text-gray-500 font-medium">Storico permanente delle operazioni effettuate dagli operatori</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Barra di Ricerca */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"/>
          <input
            type="text"
            placeholder="Cerca per operatore, azione o data..."
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Lista degli eventi registrati */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
          {logsFiltrati.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs font-bold">
              Nessun evento corrisponde alla ricerca.
            </div>
          ) : (
            logsFiltrati.map(log => (
              <div key={log.id} className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-indigo-950">{log.operatore}</span>
                    <span className="text-[11px] text-gray-400">• {log.timestamp}</span>
                  </div>
                  <p className="text-slate-800 font-medium">{log.azione}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded-full shrink-0">
                  Registrato
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
          <div className="flex items-center space-x-1.5 text-gray-400 font-medium text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600"/>
            <span>Registro non modificabile • {logs.length} eventi archiviati</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
