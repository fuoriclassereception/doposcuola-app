import React, { useState, useMemo } from 'react';
import { 
  Search, Calendar, Users, CreditCard, ChevronLeft, ChevronRight, 
  Plus, X, UserPlus, UserCheck, Clock, Phone, Mail, GraduationCap, Edit, Trash2
} from 'lucide-react';

export default function App() {
  // --- STATI PRINCIPALI ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('planning'); // 'planning' | 'insegnanti' | 'cassa'
  const [viewMode, setViewMode] = useState('giornaliera'); // 'giornaliera' | 'settimanale'
  const [searchQuery, setSearchQuery] = useState('');

  // --- MODULO 1: ANAGRAFICA INSEGNANTI / OPERATORI ---
  const [insegnanti, setInsegnanti] = useState([
    { id: 'ins_1', nome: 'Marco', cognome: 'Bianchi', telefono: '333 1112233', email: 'marco.bianchi@email.it', materia: 'Pianoforte', colore: 'bg-blue-100 border-blue-300 text-blue-900', attivo: true },
    { id: 'ins_2', nome: 'Laura', cognome: 'Rossi', telefono: '340 5556677', email: 'laura.rossi@email.it', materia: 'Canto', colore: 'bg-emerald-100 border-emerald-300 text-emerald-900', attivo: true }
  ]);

  // Stato Form Insegnante
  const [showInsegnanteModal, setShowInsegnanteModal] = useState(false);
  const [editingInsegnante, setEditingInsegnante] = useState(null);
  const [insegnanteForm, setInsegnanteForm] = useState({
    nome: '', cognome: '', telefono: '', email: '', materia: ''
  });

  // Disponibilità insegnanti per la data corrente: { "2026-09-24": ["ins_1", "ins_2"] }
  const [disponibilitaInsegnanti, setDisponibilitaInsegnanti] = useState({});

  // Database Allievi / Genitori
  const [genitori, setGenitori] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showFastAnagrafica, setShowFastAnagrafica] = useState(false);

  // Form Anagrafica Veloce Allievo
  const [newStudent, setNewStudent] = useState({
    nome: '', cognome: '', email: '', telefono: '', note: '',
    genitoreId: '', creaNuovoGenitore: false, genitoreNome: '', genitoreEmail: '', genitoreTelefono: ''
  });

  // Palette colori automatica per nuovi insegnanti
  const colorPalette = [
    'bg-purple-100 border-purple-300 text-purple-900',
    'bg-amber-100 border-amber-300 text-amber-900',
    'bg-rose-100 border-rose-300 text-rose-900',
    'bg-cyan-100 border-cyan-300 text-cyan-900',
    'bg-indigo-100 border-indigo-300 text-indigo-900'
  ];

  // --- LOGICA GESTIONE INSEGNANTI ---
  const handleOpenInsegnanteModal = (ins = null) => {
    if (ins) {
      setEditingInsegnante(ins.id);
      setInsegnanteForm({
        nome: ins.nome,
        cognome: ins.cognome,
        telefono: ins.telefono,
        email: ins.email,
        materia: ins.materia
      });
    } else {
      setEditingInsegnante(null);
      setInsegnanteForm({ nome: '', cognome: '', telefono: '', email: '', materia: '' });
    }
    setShowInsegnanteModal(true);
  };

  const handleSaveInsegnante = (e) => {
    e.preventDefault();
    if (!insegnanteForm.nome || !insegnanteForm.cognome) return;

    if (editingInsegnante) {
      setInsegnanti(insegnanti.map(ins => ins.id === editingInsegnante ? {
        ...ins,
        ...insegnanteForm
      } : ins));
    } else {
      const newIns = {
        id: `ins_${Date.now()}`,
        ...insegnanteForm,
        colore: colorPalette[insegnanti.length % colorPalette.length],
        attivo: true
      };
      setInsegnanti([...insegnanti, newIns]);
    }

    setShowInsegnanteModal(false);
    setInsegnanteForm({ nome: '', cognome: '', telefono: '', email: '', materia: '' });
  };

  const toggleInsegnanteStato = (id) => {
    setInsegnanti(insegnanti.map(ins => ins.id === id ? { ...ins, attivo: !ins.attivo } : ins));
  };

  // --- NAVIGAZIONE DATE E DISPONIBILITÀ ---
  const handleDateNavigate = (direction) => {
    const d = new Date(selectedDate);
    const step = viewMode === 'settimanale' ? 7 : 1;
    d.setDate(d.getDate() + (direction * step));
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const currentWeekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOfWeek = curr.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [selectedDate]);

  // Insegnanti attivi nel planning per la data selezionata
  const activeInsegnantiIdsForDate = useMemo(() => {
    if (disponibilitaInsegnanti[selectedDate]) {
      return disponibilitaInsegnanti[selectedDate];
    }
    // Default: tutti gli insegnanti con stato attivo
    return insegnanti.filter(i => i.attivo).map(i => i.id);
  }, [disponibilitaInsegnanti, selectedDate, insegnanti]);

  const toggleInsegnanteForDate = (insId) => {
    const currentActive = activeInsegnantiIdsForDate;
    let updated;
    if (currentActive.includes(insId)) {
      updated = currentActive.filter(id => id !== insId);
    } else {
      updated = [...currentActive, insId];
    }
    setDisponibilitaInsegnanti({
      ...disponibilitaInsegnanti,
      [selectedDate]: updated
    });
  };

  const hoursRange = Array.from({ length: 14 }).map((_, i) => 8 + i);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans overflow-hidden">
      
      {/* SIDEBAR LATERALE */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col z-10">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-indigo-950 text-white">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-indigo-950 flex items-center justify-center font-black text-xl shadow-md">
            FC
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight leading-none">Fuori Classe</h1>
            <p className="text-[11px] text-indigo-300 font-medium tracking-wider uppercase mt-1">Reception Manager</p>
          </div>
        </div>

        {/* Ricerca generica */}
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca allievo o docente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Lista Allievi veloce */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Archivio Allievi</p>
          {customers
            .filter(c => c.nome.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(cli => (
              <div key={cli.id} className="p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-400 cursor-pointer">
                <p className="font-bold text-gray-900 text-xs">{cli.nome}</p>
                {cli.telefono && <p className="text-[11px] text-gray-400 mt-0.5 flex items-center"><Phone className="w-3 h-3 mr-1"/>{cli.telefono}</p>}
              </div>
            ))}
          {customers.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Users className="w-6 h-6 mx-auto mb-1 opacity-30"/>
              <p className="text-xs">Nessun allievo presente.</p>
            </div>
          )}
        </div>
      </aside>

      {/* AREA PRINCIPALE */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* TOP BAR / MENU PRINCIPALE */}
        <header className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                activeTab === 'planning' ? 'bg-indigo-950 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Planning</span>
            </button>

            <button
              onClick={() => setActiveTab('insegnanti')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                activeTab === 'insegnanti' ? 'bg-indigo-950 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Anagrafica Insegnanti</span>
            </button>

            <button
              onClick={() => setActiveTab('cassa')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                activeTab === 'cassa' ? 'bg-indigo-950 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cassa & Presenze</span>
            </button>
          </div>

          {activeTab === 'planning' && (
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('giornaliera')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'giornaliera' ? 'bg-white text-indigo-950 shadow-sm' : 'text-gray-500'
                }`}
              >
                Giornaliera
              </button>
              <button
                onClick={() => setViewMode('settimanale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'settimanale' ? 'bg-white text-indigo-950 shadow-sm' : 'text-gray-500'
                }`}
              >
                Settimanale
              </button>
            </div>
          )}
        </header>

        {/* BARRA DATA E CONTROLLI (VISIBILE SOLO NEL PLANNING) */}
        {activeTab === 'planning' && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-xl p-0.5 shadow-sm">
                <button onClick={() => handleDateNavigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
                <button onClick={() => handleDateNavigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </div>

              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200"
              >
                Oggi
              </button>

              <span className="font-extrabold text-gray-900 text-sm capitalize ml-2">
                {viewMode === 'giornaliera' 
                  ? new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : `Settimana dal ${new Date(currentWeekDays[0]).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} al ${new Date(currentWeekDays[6]).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`
                }
              </span>
            </div>

            {/* SELEZIONE RAPIDA INSEGNANTI SUL PLANNING GIORNALIERO */}
            {viewMode === 'giornaliera' && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Insegnanti nel giorno:</span>
                <div className="flex items-center space-x-1">
                  {insegnanti.filter(i => i.attivo).map(ins => {
                    const isActive = activeInsegnantiIdsForDate.includes(ins.id);
                    return (
                      <button
                        key={ins.id}
                        onClick={() => toggleInsegnanteForDate(ins.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          isActive 
                            ? `${ins.colore} shadow-sm` 
                            : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {ins.nome} {ins.cognome[0]}.
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENUTO IN BASE AL TAB SELEZIONATO */}
        <div className="flex-1 overflow-auto bg-gray-50/50">
          
          {/* TAB 1: PLANNING */}
          {activeTab === 'planning' && (
            <div className="h-full flex flex-col min-w-[800px]">
              {viewMode === 'giornaliera' && (
                <div className="flex-1 flex flex-col">
                  {/* HEADER INSEGNANTI */}
                  <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                    <div className="w-20 min-w-[80px] p-3 text-center border-r border-gray-200 font-extrabold text-xs text-gray-400 uppercase bg-gray-50">
                      Ora
                    </div>
                    {insegnanti
                      .filter(ins => ins.attivo && activeInsegnantiIdsForDate.includes(ins.id))
                      .map(ins => (
                        <div key={ins.id} className="flex-1 p-3 border-r border-gray-200 text-center bg-white">
                          <p className="font-extrabold text-sm text-gray-900">{ins.nome} {ins.cognome}</p>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 mt-1 inline-block">
                            {ins.materia}
                          </span>
                        </div>
                      ))}
                    {activeInsegnantiIdsForDate.length === 0 && (
                      <div className="flex-1 p-4 text-center text-xs text-gray-400 italic">
                        Nessun insegnante abilitato per questa data. Attivali in alto a destra.
                      </div>
                    )}
                  </div>

                  {/* TABELLA ORARIA (08:00 - 21:00) */}
                  <div className="flex-1 divide-y divide-gray-200 bg-white">
                    {hoursRange.map((hour) => (
                      <div key={hour} className="flex min-h-[60px]">
                        <div className="w-20 min-w-[80px] border-r border-gray-200 font-bold text-xs text-gray-400 flex items-center justify-center bg-gray-50/50">
                          {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                        </div>
                        {insegnanti
                          .filter(ins => ins.attivo && activeInsegnantiIdsForDate.includes(ins.id))
                          .map(ins => (
                            <div 
                              key={ins.id} 
                              className="flex-1 border-r border-gray-200 p-2 hover:bg-indigo-50/30 transition-colors cursor-pointer group flex flex-col justify-center"
                            >
                              <span className="hidden group-hover:block text-[10px] text-indigo-400 font-bold text-center">
                                + Assegna lezioni
                              </span>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'settimanale' && (
                <div className="grid grid-cols-7 gap-3 p-6 h-full">
                  {currentWeekDays.map((dateStr) => {
                    const dateObj = new Date(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <div key={dateStr} className={`border rounded-2xl p-3 bg-white flex flex-col min-h-[500px] shadow-sm ${isToday ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200'}`}>
                        <div className="text-center pb-2 mb-3 border-b border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase">{dateObj.toLocaleDateString('it-IT', { weekday: 'short' })}</p>
                          <p className={`text-lg font-black ${isToday ? 'text-indigo-600' : 'text-gray-800'}`}>{dateObj.getDate()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MODULO ANAGRAFICA INSEGNANTI (COMPLETA) */}
          {activeTab === 'insegnanti' && (
            <div className="max-w-5xl mx-auto p-6 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Gestione Insegnanti & Operatori</h2>
                  <p className="text-xs text-gray-500 mt-1">Anagrafica dei docenti abilitati alle lezioni e alla presenza nel planning</p>
                </div>
                <button
                  onClick={() => handleOpenInsegnanteModal()}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4"/>
                  <span>+ Nuovo Insegnante</span>
                </button>
              </div>

              {/* GRIGLIA CARDS INSEGNANTI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insegnanti.map((ins) => (
                  <div key={ins.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${ins.colore}`}>
                            {ins.nome[0]}{ins.cognome[0]}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-gray-900">{ins.nome} {ins.cognome}</h3>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {ins.materia || 'Materia non specificata'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleInsegnanteStato(ins.id)}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                            ins.attivo 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          {ins.attivo ? 'Attivo' : 'Inattivo'}
                        </button>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400"/>
                          <span>{ins.telefono || 'Telefono non inserito'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400"/>
                          <span>{ins.email || 'Email non inserita'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenInsegnanteModal(ins)}
                        className="p-1.5 text-gray-500 hover:text-indigo-900 hover:bg-gray-100 rounded-lg flex items-center text-xs font-bold px-3 border border-gray-200"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1"/> Modifica
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CASSA */}
          {activeTab === 'cassa' && (
            <div className="p-6 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold">Registro Cassa e Presenze</h2>
            </div>
          )}

        </div>
      </main>

      {/* MODALE CREAZIONE / MODIFICA INSEGNANTE */}
      {showInsegnanteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-gray-900">
                {editingInsegnante ? 'Modifica Insegnante' : 'Nuovo Insegnante'}
              </h3>
              <button onClick={() => setShowInsegnanteModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSaveInsegnante} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Marco"
                    value={insegnanteForm.nome}
                    onChange={(e) => setInsegnanteForm({ ...insegnanteForm, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cognome *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Bianchi"
                    value={insegnanteForm.cognome}
                    onChange={(e) => setInsegnanteForm({ ...insegnanteForm, cognome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Materia / Disciplina *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Pianoforte, Canto, Chitarra..."
                  value={insegnanteForm.materia}
                  onChange={(e) => setInsegnanteForm({ ...insegnanteForm, materia: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefono</label>
                  <input
                    type="text"
                    placeholder="Es. 333 1234567"
                    value={insegnanteForm.telefono}
                    onChange={(e) => setInsegnanteForm({ ...insegnanteForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="docente@email.it"
                    value={insegnanteForm.email}
                    onChange={(e) => setInsegnanteForm({ ...insegnanteForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowInsegnanteModal(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Annulla
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-bold bg-indigo-950 text-white hover:bg-indigo-900 rounded-xl shadow-sm"
                >
                  Salva Scheda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
