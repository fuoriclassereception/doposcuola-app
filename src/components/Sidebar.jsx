import React from 'react';
import { Calendar, GraduationCap, Users, CreditCard, Search } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, searchQuery, setSearchQuery }) {
  const menuItems = [
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'insegnanti', label: 'Anagrafica Insegnanti', icon: GraduationCap },
    { id: 'studenti', label: 'Anagrafica Studenti', icon: Users },
    { id: 'cassa', label: 'Cassa & Presenze', icon: CreditCard },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800">
      {/* Brand / Logo */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
          FC
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight leading-none">Fuori Classe</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">Reception Manager</p>
        </div>
      </div>

      {/* Menu Principale a Sinistra */}
      <nav className="flex-1 p-4 space-y-1.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Menu Principale</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Campo di Ricerca Rapida in Basso */}
      <div className="p-4 border-t border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cerca docente o studente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>
    </aside>
  );
}
