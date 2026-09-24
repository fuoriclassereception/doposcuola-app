import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, Users, FileText, Lock, 
  Printer, ChevronLeft, ChevronRight, Plus, 
  AlertCircle, CheckCircle, Clock, Ban, CreditCard, DollarSign, X
} from 'lucide-react';

export default function App() {
  // --- STATI GLOBALI ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('planning'); // 'planning' | 'cassa'
  const [viewMode, setViewMode] = useState('giornaliera'); // 'giornaliera' | 'settimanale' | 'mensile'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database locale
  const [customers, setCustomers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  
  // Modali
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFastAnagrafica, setShowFastAnagrafica] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ nome: '', email: '', telefono: '', saldo: 0, note_interne: '', note_esterne: '' });

  // --- CALCOLI E SINCRO GIORNALIERA ---
  // Filtra le lezioni in base al giorno selezionato
  const dayLezioni = useMemo(() => {
    const list = [];
    customers.forEach(c => {
      (c.lezioni || []).forEach(lez => {
        if (lez.data === selectedDate) {
          list.push({ ...lez, allievo: c });
        }
      });
    });
    return list;
  }, [customers, selectedDate]);

  // Gestione cambio data nel Planning / Cassa
  const handleDateChange = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Aggiungi allievo veloce
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerForm.nome) return;
    const newCli = {
      id: `cli_${Date.now()}`,
      ...newCustomerForm,
      saldo_attuale: Number(newCustomerForm.saldo) || 0,
      sospesi: [],
      storico_pagamenti: [],
      lezioni: []
    };
    setCustomers([...customers, newCli]);
    setNewCustomerForm({ nome: '', email: '', telefono: '', saldo: 0, note_interne: '', note_esterne: '' });
    setShowFastAnagrafica(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      
      {/* BARRA LATERALE / SIDEBAR */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-10">
        {/* BRAND HEADER */}
        <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-indigo-900 text-white">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xl text-amber-400 shadow-sm">
            FC
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Fuori Classe</h1>
            <p className="text-xs text-indigo-200 uppercase tracking-wider">Reception & Management</p>
          </div>
        </div>

        {/* RICERCA ALLIEVI */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca allievo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* LISTA ALLIEVI */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {customers
            .filter(c => c.nome.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(cli => (
              <div 
                key={cli.id}
                onClick={() => setSelectedCustomer(cli)}
                className="p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-gray-900 text-sm">{cli.nome}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cli.saldo_attuale < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {cli.saldo_attuale < 0 ? `${cli.saldo_attuale}€` : 'In regola'}
                  </span>
                </div>
                {cli.telefono && <p className="text-xs text-gray-500 mt-1">{cli.telefono}</p>}
              </div>
            ))}
            {customers.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-6">Nessun allievo in archivio.</p>
            )}
        </div>
      </aside>

      {/* CONTENUTO PRINCIPALE */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* HEADER TOP NAV */}
        <header className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'planning' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Planning</span>
            </button>

            <button
              onClick={() => setActiveTab('cassa')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'cassa' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cassa e Presenze</span>
            </button>

            <button
              onClick={() => setShowFastAnagrafica(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-dashed border-gray-300"
            >
              <Users className="w-4 h-4" />
              <span>+ Anagrafica Veloce</span>
            </button>
          </div>

          {/* VISTE PLANNING (SELEZIONE VISTA) */}
          {activeTab === 'planning' && (
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              {['giornaliera', 'settimanale', 'mensile'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                    viewMode === mode ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* BARRA DATA E CONTROLLI */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => handleDateChange(-1)} className="p-1 rounded-lg hover:bg-gray-200 border bg-white"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
            <span className="font-bold text-gray-800 text-lg capitalize">
              {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => handleDateChange(1)} className="p-1 rounded-lg hover:bg-gray-200 border bg-white"><ChevronRight className="w-5 h-5 text-gray-600"/></button>
          </div>
          <span className="text-xs text-gray-400 font-mono">Data attiva: {selectedDate}</span>
        </div>

        {/* AREA PRINCIPALE DINAMICA */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'planning' ? (
            <div>
              {/* VISTA GIORNALIERA */}
              {viewMode === 'giornaliera' && (
                <div className="max-w-3xl mx-auto space-y-3">
                  {Array.from({ length: 11 }).map((_, i) => {
                    const hour = 8 + i;
                    const lezioniHour = dayLezioni.filter(l => Number(l.ora_inizio) === hour);
                    return (
                      <div key={hour} className="flex border border-gray-200 rounded-xl overflow-hidden shadow-sm min-h-[64px] bg-white">
                        <div className="w-20 bg-gray-50 border-r border-gray-200 p-3 font-semibold text-gray-500 text-sm flex items-center justify-center">
                          {hour}:00
                        </div>
                        <div className="flex-1 p-3 flex flex-wrap gap-2 items-center">
                          {lezioniHour.map(l => (
                            <span key={l.id} className="bg-indigo-100 text-indigo-900 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-200">
                              {l.allievo.nome} ({l.durata}h)
                            </span>
                          ))}
                          {lezioniHour.length === 0 && (
                            <span className="text-xs text-gray-300 italic">Slot libero</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VISTA SETTIMANALE */}
              {viewMode === 'settimanale' && (
                <div className="grid grid-cols-7 gap-2">
                  {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d, idx) => (
                    <div key={d} className="border border-gray-200 rounded-xl p-3 bg-white min-h-[400px]">
                      <p className="font-bold text-center text-gray-700 border-b pb-2 mb-2">{d}</p>
                      <p className="text-xs text-center text-gray-400">Programma orari</p>
                    </div>
                  ))}
                </div>
              )}

              {/* VISTA MENSILE */}
              {viewMode === 'mensile' && (
                <div className="p-8 text-center bg-gray-50 border rounded-2xl">
                  <Calendar className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-gray-800">Vista Mensile Rapida</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">Usa le frecce in alto per navigare velocemente i giorni del mese selezionato.</p>
                </div>
              )}
            </div>
          ) : (
            /* VISTA CASSA E PRESENZE */
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Riepilogo Cassa e Presenze</h2>
                  <p className="text-xs text-indigo-200 mt-1">Giorno: {selectedDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-indigo-200">Presenze Totali</p>
                  <p className="text-3xl font-extrabold text-amber-400">{dayLezioni.length}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Lezioni e Presenze del giorno</h3>
                {dayLezioni.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {dayLezioni.map((l) => (
                      <div key={l.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{l.allievo.nome}</p>
                          <p className="text-xs text-gray-500">Ore: {l.ora_inizio}:00 - Durata: {l.durata}h</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                          Confermato
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">Nessuna presenza o lezione registrata per la data del {selectedDate}.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALE ANAGRAFICA VELOCE */}
      {showFastAnagrafica && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-lg text-gray-900">Nuova Anagrafica Veloce</h3>
              <button onClick={() => setShowFastAnagrafica(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Marco Rossi"
                  value={newCustomerForm.nome}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Telefono</label>
                  <input
                    type="text"
                    placeholder="333..."
                    value={newCustomerForm.telefono}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Saldo Iniziale (€)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newCustomerForm.saldo}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, saldo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowFastAnagrafica(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
                <button type="submit" className="px-4 py-2 text-xs font-medium bg-indigo-900 text-white hover:bg-indigo-800 rounded-lg">Salva Allievo</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
