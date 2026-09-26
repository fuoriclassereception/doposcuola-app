import React, { useState } from 'react';
import { Calendar, Users, GraduationCap, Wallet, Search, History } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, searchQuery, setSearchQuery, logs = [] }) {
  const [logSearch, setLogSearch] = useState('');

  // Filtra i log in base alla ricerca per trovare subito eventi passati
  const logsFiltrati = logs.filter(l => 
    l.azione.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.operatore.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.timestamp.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <aside className="w-64 bg-[#0f172a] text-gray-300 flex flex-col h-full overflow-hidden border-r border-slate-800">
      
      {/* Intestazione e Menu */}
      <div className="p-5">
        <h1 className="text-xl font-black text-white flex items-center mb-6">
          <span className="bg-amber-400 text-slate-900 p-1.5 rounded-lg mr-2 text-sm">FC</span> 
          Fuori Classe
        </h1>
        <nav className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Menu Principale</p>
          <button onClick={() => setActiveTab('planning')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'planning' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Calendar className="w-4 h-4"/> <span>Planning</span>
          </button>
          <button onClick={() => setActiveTab('insegnanti')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'insegnanti' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'}`}>
            <GraduationCap className="w-4 h-4"/> <span>Anagrafica Insegnanti</span>
          </button>
          <button onClick={() => setActiveTab('studenti')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'studenti' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users className="w-4 h-4"/> <span>Anagrafica Studenti</span>
          </button>
          <button onClick={() => setActiveTab('cassa')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cassa' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Wallet className="w-4 h-4"/> <span>Cassa & Presenze</span>
          </button>
        </nav>
      </div>

      {/* SEZIONE WIDGET LOG (In basso a sinistra, scorrevole) */}
      <div className="flex-1 overflow-hidden flex flex-col px-3 mt-2 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center space-x-2 text-amber-400">
            <History className="w-4 h-4"/>
            <span className="font-extrabold text-[11px] uppercase tracking-wider">LOG Sicurezza</span>
          </div>
        </div>
        
        {/* Ricerca Log */}
        <div className="relative mb-2">
          <Search className="w-3 h-3 text-slate-500 absolute left-3 top-2"/>
          <input
            type="text"
            placeholder="Cerca log..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-medium text-white focus:outline-none focus:border-amber-400 placeholder-slate-500"
          />
        </div>

        {/* Lista Log Scorrevole (Senza tasto cancella) */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-2">
          {logsFiltrati.length === 0 ? (
            <p className="text-center text-slate-600 text-[10px] py-4 font-bold">Nessun log trovato.</p>
          ) : (
            logsFiltrati.map(log => (
              <div key={log.id} className="bg-slate-800/50 border border-slate-700/50 p-2 rounded-lg text-[10px]">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="font-bold text-amber-500">{log.operatore}</span>
                  <span className="text-[9px]">{log.timestamp.split(', ')[1]}</span>
                </div>
                <p className="text-slate-200 font-medium leading-tight">{log.azione}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ricerca Globale Studente/Docente */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"/>
          <input
            type="text"
            placeholder="Cerca docente o studente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border-none rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder-slate-500"
          />
        </div>
      </div>
    </aside>
  );
}
