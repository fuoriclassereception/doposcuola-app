import React, { useState } from 'react';
import { Calendar, Users, GraduationCap, Wallet, Search, History, LogOut } from 'lucide-react';
import ModaleLog from './ModaleLog';

export default function Sidebar({ activeTab, setActiveTab, searchQuery, setSearchQuery, logs = [], onLogout }) {
  const [mostraLogModal, setMostraLogModal] = useState(false);

  return (
    <aside className="w-64 bg-[#0f172a] text-gray-300 flex flex-col h-full border-r border-slate-800 select-none">
      
      {/* Header e Menu Navigazione Principale */}
      <div className="p-5 flex-1">
        <h1 className="text-xl font-black text-white flex items-center mb-4">
          <span className="bg-amber-400 text-slate-900 p-1.5 rounded-lg mr-2 text-sm font-black">FC</span> 
          FuoriClasse
        </h1>

        {/* Bottone Logout elegante sotto il titolo */}
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-xl px-3 py-2 text-xs font-bold transition-all mb-6 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnetti (Admin)</span>
          </button>
        )}

        <nav className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Menu Principale</p>
          
          <button 
            onClick={() => setActiveTab('planning')} 
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'planning' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar className="w-4 h-4"/> 
            <span>Planning</span>
          </button>

          <button 
            onClick={() => setActiveTab('insegnanti')} 
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'insegnanti' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <GraduationCap className="w-4 h-4"/> 
            <span>Anagrafica Insegnanti</span>
          </button>

          <button 
            onClick={() => setActiveTab('studenti')} 
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'studenti' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-4 h-4"/> 
            <span>Anagrafica Studenti</span>
          </button>

          <button 
            onClick={() => setActiveTab('cassa')} 
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cassa' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Wallet className="w-4 h-4"/> 
            <span>Cassa & Presenze</span>
          </button>
        </nav>
      </div>

      {/* ZONA INFERIORE: PULSANTE LOG + RICERCA */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 space-y-2.5 shrink-0">
        
        <button
          onClick={() => setMostraLogModal(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-xl text-xs font-bold border border-slate-700/60 transition-all shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-amber-400"/>
            <span>Registro LOG</span>
          </div>
          <span className="text-[10px] bg-slate-700/70 text-slate-300 px-2 py-0.5 rounded-full font-bold">
            {logs.length}
          </span>
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3"/>
          <input
            type="text"
            placeholder="Cerca docente o studente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700/50 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
      </div>

      <ModaleLog 
        isOpen={mostraLogModal} 
        onClose={() => setMostraLogModal(false)} 
        logs={logs} 
      />

    </aside>
  );
}
