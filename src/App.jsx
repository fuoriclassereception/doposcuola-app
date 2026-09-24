import React, { useState, useMemo } from 'react';
import { 
  Search, Calendar, Users, CreditCard, ChevronLeft, ChevronRight, 
  Plus, X, UserPlus, UserCheck, Clock, Phone, Mail, Settings, User
} from 'lucide-react';

export default function App() {
  // --- STATI PRINCIPALI ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('planning'); // 'planning' | 'cassa' | 'operatori'
  const [viewMode, setViewMode] = useState('giornaliera'); // 'giornaliera' | 'settimanale'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database locale
  const [genitori, setGenitori] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // OPERATORI E DISPONIBILITÀ
  const [operatori, setOperatori] = useState([
    { id: 'op_1', nome: 'Marco Bianchi', colore: 'bg-blue-100 border-blue-300 text-blue-900' },
    { id: 'op_2', nome: 'Laura Rossi', colore: 'bg-emerald-100 border-emerald-300 text-emerald-900' }
  ]);
  
  // Mappa di abilitazione operatori per data: { "2026-09-24": ["op_1", "op_2"] }
  const [disponibilitaOperatori, setDisponibilitaOperatori] = useState({});

  // Modali e Form
  const [showFastAnagrafica, setShowFastAnagrafica] = useState(false);
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [newOpName, setNewOpName] = useState('');

  // Form Anagrafica Veloce
  const [newStudent, setNewStudent] = useState({
    nome: '', cognome: '', email: '', telefono: '', note: '',
    genitoreId: '', creaNuovoGenitore: false, genitoreNome: '', genitoreEmail: '', genitoreTelefono: ''
  });
  const [genitoreSearch, setGenitoreSearch] = useState('');

  // --- LOGICA NAVIGAZIONE DATE ---
  const handleDateNavigate = (direction) => {
    const d = new Date(selectedDate);
    const step = viewMode === 'settimanale' ? 7 : 1;
    d.setDate(d.getDate() + (direction * step));
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Calcolo giorni della settimana
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

  // Operatori attivi nel giorno selezionato (se non definiti, di default sono tutti attivi)
  const activeOperatorIdsForDate = useMemo(() => {
    if (disponibilitaOperatori[selectedDate]) {
      return disponibilitaOperatori[selectedDate];
    }
    return operatori.map(o => o.id); // default: tutti attivi
  }, [disponibilitaOperatori, selectedDate, operatori]);

  // Toggle operatore per la data corrente
  const toggleOperatorForDate = (opId) => {
    const currentActive = activeOperatorIdsForDate;
    let updated;
    if (currentActive.includes(opId)) {
      updated = currentActive.filter(id => id !== opId);
    } else {
      updated = [...currentActive, opId];
    }
    setDisponibilitaOperatori({
      ...disponibilitaOperatori,
      [selectedDate]: updated
    });
  };

  // Generazione fasce orarie 08:00 - 21:00
  const hoursRange = Array.from({ length: 14 }).map((_, i) => 8 + i);

  // Aggiungi nuovo operatore
  const handleAddOperator = (e) => {
    e.preventDefault();
    if (!newOpName) return;
    const colors = [
      'bg-purple-100 border-purple-300 text-purple-900',
      'bg-amber-100 border-amber-300 text-amber-900',
      'bg-rose-100 border-rose-300 text-rose-900',
      'bg-cyan-100 border-cyan-300 text-cyan-900'
    ];
    const newOp = {
      id: `op_${Date.now()}`,
      nome: newOpName,
      colore: colors[operatori.length % colors.length]
    };
    setOperatori([...operatori, newOp]);
    setNewOpName('');
    setShowAddOperator(false);
  };

  // Salva studente
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!newStudent.nome || !newStudent.cognome) return;

    let targetGenitoreId = newStudent.genitoreId;
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
      lezioni: []
    };

    setCustomers([...customers, createdStudent]);
    setShowFastAnagrafica(false);
    setNewStudent({
      nome: '', cognome: '', email: '', telefono: '', note: '',
      genitoreId: '', creaNuovoGenitore: false, genitoreNome: '', genitoreEmail: '', genitoreTelefono: ''
    });
  };

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

        {/* Cerca Allievo */}
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca allievo o genitore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Lista Allievi in Archivio */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {customers
            .filter(c => c.nome.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(cli => (
              <div 
                key={cli.id}
                className="p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all"
              >
                <p className="font-bold text-gray-900 text-xs">{cli.nome}</p>
                {cli.telefono && <p className="text-[11px] text-gray-400 mt-0.5 flex items-center"><Phone className="w-3 h-3 mr-1"/>{cli.telefono}</p>}
              </div>
            ))}
          {customers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-6 h-6 mx-auto mb-1 opacity-40"/>
              <p className="text-xs">Nessun allievo.</p>
            </div>
          )}
        </div>
      </aside>

      {/* AREA PRINCIPALE */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* TOP BAR */}
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
              onClick={() => setActiveTab('cassa')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                activeTab === 'cassa' ? 'bg-indigo-950 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cassa & Presenze</span>
            </button>

            <button
              onClick={() => setShowFastAnagrafica(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all ml-4"
            >
              <UserPlus className="w-4 h-4 text-indigo-900" />
              <span>+ Nuova Anagrafica</span>
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

        {/* NAVIGAZIONE DATA CON PULSANTI VICINI A SINISTRA */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Pulsanti Avanti/Indietro vicini */}
            <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-xl p-0.5 shadow-sm">
              <button 
                onClick={() => handleDateNavigate(-1)} 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-all"
                title="Precedente"
              >
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <button 
                onClick={() => handleDateNavigate(1)} 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-all"
                title="Successivo"
              >
                <ChevronRight className="w-4 h-4"/>
              </button>
            </div>

            <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200"
            >
              Oggi
            </button>

            {/* Testo Data */}
            <span className="font-extrabold text-gray-900 text-sm capitalize ml-2">
              {viewMode === 'giornaliera' 
                ? new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : `Settimana dal ${new Date(currentWeekDays[0]).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} al ${new Date(currentWeekDays[6]).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`
              }
            </span>
          </div>

          {/* BARRA ABILITAZIONE OPERATORI DEL GIORNO */}
          {activeTab === 'planning' && viewMode === 'giornaliera' && (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Operatori del giorno:</span>
              <div className="flex items-center space-x-1">
                {operatori.map(op => {
                  const isActive = activeOperatorIdsForDate.includes(op.id);
                  return (
                    <button
                      key={op.id}
                      onClick={() => toggleOperatorForDate(op.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        isActive 
                          ? `${op.colore} shadow-sm` 
                          : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {op.nome}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setShowAddOperator(true)}
                className="p-1 text-gray-400 hover:text-indigo-900 hover:bg-gray-200 rounded-lg"
                title="Aggiungi Operatore"
              >
                <Plus className="w-4 h-4"/>
              </button>
            </div>
          )}
        </div>

        {/* CONTENUTO PLANNING CON COLONNE PER OPERATORE */}
        <div className="flex-1 overflow-auto bg-gray-50/50">
          {activeTab === 'planning' ? (
            <div className="h-full flex flex-col min-w-[800px]">
              
              {viewMode === 'giornaliera' && (
                <div className="flex-1 flex flex-col">
                  
                  {/* HEADER COLONNE OPERATORI */}
                  <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                    {/* Intestazione Fascia Oraria */}
                    <div className="w-20 min-w-[80px] p-3 text-center border-r border-gray-200 font-extrabold text-xs text-gray-400 uppercase bg-gray-50">
                      Ora
                    </div>
                    {/* Colonne Operatori Abilitati */}
                    {operatori
                      .filter(op => activeOperatorIdsForDate.includes(op.id))
                      .map(op => (
                        <div key={op.id} className="flex-1 p-3 border-r border-gray-200 font-black text-sm text-center text-gray-800 bg-white">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                            <span>{op.nome}</span>
                          </div>
                        </div>
                      ))}
                    {activeOperatorIdsForDate.length === 0 && (
                      <div className="flex-1 p-3 text-center text-xs text-gray-400 italic">
                        Nessun operatore abilitato per questa data. Selezionalo in alto a destra.
                      </div>
                    )}
                  </div>

                  {/* TABELLA ORARI (08:00 - 21:00) */}
                  <div className="flex-1 divide-y divide-gray-200 bg-white">
                    {hoursRange.map((hour) => (
                      <div key={hour} className="flex min-h-[60px]">
                        {/* Ora a sinistra */}
                        <div className="w-20 min-w-[80px] border-r border-gray-200 font-bold text-xs text-gray-400 flex items-center justify-center bg-gray-50/50">
                          {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                        </div>

                        {/* Celle per ciascun operatore */}
                        {operatori
                          .filter(op => activeOperatorIdsForDate.includes(op.id))
                          .map(op => (
                            <div 
                              key={op.id} 
                              className="flex-1 border-r border-gray-200 p-1.5 hover:bg-indigo-50/30 transition-colors cursor-pointer group flex flex-col justify-center"
                            >
                              <div className="hidden group-hover:flex items-center justify-center text-[10px] text-indigo-400 font-bold">
                                + Prenota con {op.nome.split(' ')[0]}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* VISTA SETTIMANALE */}
              {viewMode === 'settimanale' && (
                <div className="grid grid-cols-7 gap-3 p-6 h-full">
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
                          <p className="text-[11px] text-gray-400 text-center italic">Palinsesto settimanale</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-lg font-bold">Registro Cassa e Presenze</h2>
            </div>
          )}
        </div>
      </main>

      {/* MODALE NUOVO OPERATORE */}
      {showAddOperator && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="font-extrabold text-base text-gray-900 mb-3">Crea Nuovo Operatore</h3>
            <form onSubmit={handleAddOperator} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Mario Rossi"
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddOperator(false)} 
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Annulla
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-950 text-white rounded-xl shadow-sm"
                >
                  Aggiungi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE ANAGRAFICA VELOCE */}
      {showFastAnagrafica && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-gray-900">Nuova Anagrafica Allievo</h3>
                <p className="text-xs text-gray-500">Inserimento rapido lato Receptionist</p>
              </div>
              <button onClick={() => setShowFastAnagrafica(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome Allievo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Mario"
                    value={newStudent.nome}
                    onChange={(e) => setNewStudent({ ...newStudent, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Allievo</label>
                  <input
                    type="email"
                    placeholder="mario@email.it"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

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
