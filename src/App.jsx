import React, { useState, useMemo } from 'react';
import { 
  Search, Calendar, Users, CreditCard, ChevronLeft, ChevronRight, 
  Plus, X, UserPlus, UserCheck, Clock, AlertCircle, Phone, Mail, FileText
} from 'lucide-react';

export default function App() {
  // --- STATI PRINCIPALI ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('planning'); // 'planning' | 'cassa' | 'anagrafica'
  const [viewMode, setViewMode] = useState('giornaliera'); // 'giornaliera' | 'settimanale'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database locale
  const [genitori, setGenitori] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Modali e Dettagli
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFastAnagrafica, setShowFastAnagrafica] = useState(false);

  // Form Anagrafica Veloce
  const [newStudent, setNewStudent] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    note: '',
    genitoreId: '',
    creaNuovoGenitore: false,
    genitoreNome: '',
    genitoreEmail: '',
    genitoreTelefono: ''
  });

  // Ricerca genitore nel form
  const [genitoreSearch, setGenitoreSearch] = useState('');

  // --- LOGICA NAVIGAZIONE DATE ---
  const handleDateNavigate = (direction) => {
    const d = new Date(selectedDate);
    const step = viewMode === 'settimanale' ? 7 : 1;
    d.setDate(d.getDate() + (direction * step));
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Calcolo dei giorni per la vista settimanale
  const currentWeekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [selectedDate]);

  // --- SALVATAGGIO ANAGRAFICA VELOCE ---
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!newStudent.nome || !newStudent.cognome) return;

    let targetGenitoreId = newStudent.genitoreId;

    // Se si crea un nuovo genitore al volo
    if (newStudent.creaNuovoGenitore && newStudent.genitoreNome) {
      const newGen = {
        id: `gen_${Date.now()}`,
        nome: newStudent.genitoreNome,
        email: newStudent.genitoreEmail,
        telefono: newStudent.genitoreTelefono
      };
      setGenitori([...genitori, newGen]);
      targetGenitoreId = newGen.id;
    }

    const createdStudent = {
      id: `cli_${Date.now()}`,
      nome: `${newStudent.nome} ${newStudent.cognome}`,
      email: newStudent.email,
      telefono: newStudent.telefono,
      note: newStudent.note,
      genitoreId: targetGenitoreId,
      saldo: 0,
      lezioni: []
    };

    setCustomers([...customers, createdStudent]);
    setShowFastAnagrafica(false);
    
    // Reset form
    setNewStudent({
      nome: '', cognome: '', email: '', telefono: '', note: '',
      genitoreId: '', creaNuovoGenitore: false, genitoreNome: '', genitoreEmail: '', genitoreTelefono: ''
    });
    setGenitoreSearch('');
  };

  // Lezioni del giorno corrente
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

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans overflow-hidden">
      
      {/* SIDEBAR LATERALE */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-10">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-indigo-950 text-white">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-indigo-950 flex items-center justify-center font-black text-xl shadow-md">
            FC
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight leading-none">Fuori Classe</h1>
            <p className="text-[11px] text-indigo-300 font-medium tracking-wider uppercase mt-1">Reception Manager</p>
          </div>
        </div>

        {/* Cerca Allievo */}
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca allievo o genitore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Lista Allievi in Archivio */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {customers
            .filter(c => c.nome.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(cli => {
              const gen = genitori.find(g => g.id === cli.genitoreId);
              return (
                <div 
                  key={cli.id}
                  onClick={() => setSelectedCustomer(cli)}
                  className="p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900 text-sm">{cli.nome}</span>
                  </div>
                  {gen && <p className="text-xs text-indigo-600 mt-0.5">Genitore: {gen.nome}</p>}
                  {cli.telefono && <p className="text-xs text-gray-400 mt-1 flex items-center"><Phone className="w-3 h-3 mr-1"/>{cli.telefono}</p>}
                </div>
              );
            })}
          {customers.length === 0 && (
            <div className="text-center py-10 px-4 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40"/>
              <p className="text-xs">Nessun allievo trovato.</p>
            </div>
          )}
        </div>
      </aside>

      {/* AREA PRINCIPALE */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* NAV BAR TOP */}
        <header className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'planning' ? 'bg-indigo-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Planning</span>
            </button>

            <button
              onClick={() => setActiveTab('cassa')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'cassa' ? 'bg-indigo-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cassa & Presenze</span>
            </button>

            <button
              onClick={() => setShowFastAnagrafica(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-sm text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all ml-4"
            >
              <UserPlus className="w-4 h-4 text-indigo-700" />
              <span>+ Nuova Anagrafica</span>
            </button>
          </div>

          {/* Viste Planning (Solo Giornaliera e Settimanale) */}
          {activeTab === 'planning' && (
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('giornaliera')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'giornaliera' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Giornaliera
              </button>
              <button
                onClick={() => setViewMode('settimanale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'settimanale' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Settimanale
              </button>
            </div>
          )}
        </header>

        {/* CONTROLLO DATE (FRECCE FISSE SULLE ESTREMITÀ PER EVITARE SOVRAPPOSIZIONI) */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-6 w-full max-w-xl">
            <button 
              onClick={() => handleDateNavigate(-1)} 
              className="p-2 rounded-xl hover:bg-gray-200 border border-gray-300 bg-white text-gray-700 shadow-sm transition-all shrink-0"
              title="Precedente"
            >
              <ChevronLeft className="w-5 h-5"/>
            </button>

            <div className="flex-1 text-center">
              <span className="font-extrabold text-gray-900 text-lg capitalize block">
                {viewMode === 'giornaliera' 
                  ? new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : `Settimana dal ${new Date(currentWeekDays[0]).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} al ${new Date(currentWeekDays[6]).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`
                }
              </span>
            </div>

            <button 
              onClick={() => handleDateNavigate(1)} 
              className="p-2 rounded-xl hover:bg-gray-200 border border-gray-300 bg-white text-gray-700 shadow-sm transition-all shrink-0"
              title="Successivo"
            >
              <ChevronRight className="w-5 h-5"/>
            </button>
          </div>

          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200"
          >
            Oggi
          </button>
        </div>

        {/* CONTENUTO TAB */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {activeTab === 'planning' ? (
            <div>
              {/* VISTA GIORNALIERA */}
              {viewMode === 'giornaliera' && (
                <div className="max-w-4xl mx-auto space-y-3">
                  {Array.from({ length: 11 }).map((_, i) => {
                    const hour = 8 + i;
                    const lezioniHour = dayLezioni.filter(l => Number(l.ora_inizio) === hour);
                    return (
                      <div key={hour} className="flex border border-gray-200 rounded-2xl overflow-hidden shadow-sm min-h-[70px] bg-white">
                        <div className="w-24 bg-gray-50 border-r border-gray-200 p-3 font-bold text-gray-500 text-sm flex items-center justify-center">
                          {hour}:00
                        </div>
                        <div className="flex-1 p-3 flex flex-wrap gap-2 items-center">
                          {lezioniHour.map(l => (
                            <div key={l.id} className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2">
                              <span>{l.allievo.nome}</span>
                              <span className="bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded text-[10px]">{l.durata}h</span>
                            </div>
                          ))}
                          {lezioniHour.length === 0 && (
                            <span className="text-xs text-gray-300 italic font-medium">Nessuna lezione in programma</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VISTA SETTIMANALE SCORREVOLE */}
              {viewMode === 'settimanale' && (
                <div className="grid grid-cols-7 gap-3 h-full">
                  {currentWeekDays.map((dateStr) => {
                    const dateObj = new Date(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'short' });
                    const dayNum = dateObj.getDate();

                    return (
                      <div 
                        key={dateStr} 
                        className={`border rounded-2xl p-3 bg-white flex flex-col min-h-[500px] shadow-sm ${
                          isToday ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200'
                        }`}
                      >
                        <div className={`text-center pb-2 mb-3 border-b ${isToday ? 'border-indigo-200' : 'border-gray-100'}`}>
                          <p className="text-xs font-bold text-gray-400 uppercase">{dayName}</p>
                          <p className={`text-lg font-black ${isToday ? 'text-indigo-600' : 'text-gray-800'}`}>{dayNum}</p>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-[11px] text-gray-400 text-center italic">Slot settimanali</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* CASSA E PRESENZE GIORNALIERE */
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-indigo-950 text-white p-6 rounded-3xl shadow-xl flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Presenze e Registro Cassa</h2>
                  <p className="text-xs text-indigo-300 mt-1 capitalize">
                    {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-indigo-300 font-semibold uppercase">Presenze Oggi</p>
                  <p className="text-4xl font-black text-amber-400">{dayLezioni.length}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-gray-900 mb-4 text-base">Allievi in struttura per questa data</h3>
                {dayLezioni.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {dayLezioni.map((l) => (
                      <div key={l.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{l.allievo.nome}</p>
                          <p className="text-xs text-gray-500">Ore {l.ora_inizio}:00 ({l.durata} ora/e)</p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center">
                          <UserCheck className="w-3 h-3 mr-1"/> Presente
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                    <p className="text-sm font-medium">Nessun ingresso o presenza programmata per questo giorno.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALE ANAGRAFICA VELOCE (RIVISTA E COMPLETA) */}
      {showFastAnagrafica && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-gray-900">Nuova Anagrafica Allievo</h3>
                <p className="text-xs text-gray-500">Inserimento rapido lato Receptionist</p>
              </div>
              <button onClick={() => setShowFastAnagrafica(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              
              {/* DATI ALLIEVO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome Allievo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Mario"
                    value={newStudent.nome}
                    onChange={(e) => setNewStudent({ ...newStudent, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cognome Allievo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Rossi"
                    value={newStudent.cognome}
                    onChange={(e) => setNewStudent({ ...newStudent, cognome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefono Allievo</label>
                  <input
                    type="text"
                    placeholder="Es. 333 1234567"
                    value={newStudent.telefono}
                    onChange={(e) => setNewStudent({ ...newStudent, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Allievo</label>
                  <input
                    type="email"
                    placeholder="mario@email.it"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* SEZIONE COLLEGAMENTO GENITORE */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-extrabold text-indigo-900 mb-2">
                  Collegamento Genitore / Tutore (Opzionale)
                </label>

                {!newStudent.creaNuovoGenitore ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Cerca genitore esistente per nome o mail..."
                      value={genitoreSearch}
                      onChange={(e) => setGenitoreSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />

                    {genitoreSearch && (
                      <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1 bg-white">
                        {genitori
                          .filter(g => g.nome.toLowerCase().includes(genitoreSearch.toLowerCase()) || g.email.toLowerCase().includes(genitoreSearch.toLowerCase()))
                          .map(g => (
                            <div 
                              key={g.id}
                              onClick={() => { setNewStudent({ ...newStudent, genitoreId: g.id }); setGenitoreSearch(''); }}
                              className={`p-2 rounded-lg text-xs cursor-pointer flex justify-between ${newStudent.genitoreId === g.id ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-gray-50'}`}
                            >
                              <span>{g.nome}</span>
                              <span className="text-gray-400">{g.email}</span>
                            </div>
                          ))}
                        {genitori.length === 0 && <p className="text-[11px] text-gray-400 p-1">Nessun genitore in archivio.</p>}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setNewStudent({ ...newStudent, creaNuovoGenitore: true, genitoreId: '' })}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center pt-1"
                    >
                      + Crea e collega un nuovo genitore
                    </button>
                  </div>
                ) : (
                  /* SCHEDA NUOVO GENITORE */
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-900">Dati Nuovo Genitore</span>
                      <button 
                        type="button" 
                        onClick={() => setNewStudent({ ...newStudent, creaNuovoGenitore: false })}
                        className="text-[11px] text-gray-500 hover:underline"
                      >
                        Annulla
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Nome e Cognome Genitore *"
                      value={newStudent.genitoreNome}
                      onChange={(e) => setNewStudent({ ...newStudent, genitoreNome: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Telefono Genitore"
                        value={newStudent.genitoreTelefono}
                        onChange={(e) => setNewStudent({ ...newStudent, genitoreTelefono: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                      />
                      <input
                        type="email"
                        placeholder="Email Genitore"
                        value={newStudent.genitoreEmail}
                        onChange={(e) => setNewStudent({ ...newStudent, genitoreEmail: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* NOTE RECEPTION */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Note Reception / Interne</label>
                <textarea
                  rows="2"
                  placeholder="Note utili per lo staff..."
                  value={newStudent.note}
                  onChange={(e) => setNewStudent({ ...newStudent, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                ></textarea>
              </div>

              {/* PULSANTI AZIONE */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowFastAnagrafica(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Annulla
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-bold bg-indigo-950 text-white hover:bg-indigo-900 rounded-xl shadow-sm"
                >
                  Salva Anagrafica
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
