import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, Users, FileText, Lock, 
  Printer, ChevronLeft, ChevronRight, Plus, 
  AlertCircle, CheckCircle, Clock, Ban, CreditCard 
} from 'lucide-react';

const initialCustomers = [];
const initialBlocks = [];

export default function GestioneReceptionApp() {
  // --- STATI GLOBALI ---
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar', 'customer', 'daily'
  const [customers, setCustomers] = useState(initialCustomers);
  const [blocks, setBlocks] = useState(initialBlocks);
  
  const [selectedDate, setSelectedDate] = useState(new Date("2026-09-24"));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCustomer, setActiveCustomer] = useState(null);

  // --- STATI MODALI ---
  const [pinModal, setPinModal] = useState({ isOpen: false, pendingAction: null, data: null });
  const [pinInput, setPinInput] = useState("");
  const [printModal, setPrintModal] = useState({ isOpen: false, data: null });
  const [eventModal, setEventModal] = useState({ isOpen: false, data: null, isBlock: false });

  // --- LOGICA DI RICERCA E JUMP ---
  const filteredCustomers = customers.filter(c => 
    c.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    setActiveCustomer(customer);
    setCurrentView('customer');
    setSearchQuery("");
  };

  const jumpToLesson = (lesson) => {
    setSelectedDate(new Date(lesson.data));
    setCurrentView('calendar');
  };

  // --- LOGICA DI SICUREZZA (PIN) ---
  const requestPin = (actionType, data) => {
    setPinModal({ isOpen: true, pendingAction: actionType, data: data });
    setPinInput("");
  };

  const confirmPin = () => {
    if (pinInput === "1234") {
      executeAction(pinModal.pendingAction, pinModal.data);
      setPinModal({ isOpen: false, pendingAction: null, data: null });
    } else {
      alert("PIN errato. Operazione annullata.");
    }
  };

  const executeAction = (action, data) => {
    switch (action) {
      case 'save_customer':
        setCustomers(customers.map(c => c.id === data.id ? data : c));
        setActiveCustomer(data);
        alert("Scheda cliente aggiornata con successo.");
        break;
      case 'print_receipt':
        // Sincronizzazione bidirezionale: aggiorno il cliente prima di stampare
        const updatedCustomer = { ...activeCustomer };
        updatedCustomer.sospesi = data.voci;
        // Aggiorna saldo in base alle modifiche
        updatedCustomer.saldo_attuale = -data.voci.reduce((acc, v) => acc + parseFloat(v.importo), 0);
        
        setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setActiveCustomer(updatedCustomer);
        
        // Chiudo la modale e avvio la stampa nativa
        setPrintModal({ isOpen: false, data: null });
        setTimeout(() => window.print(), 300);
        break;
      case 'add_block':
        setBlocks([...blocks, data]);
        setEventModal({ isOpen: false, data: null, isBlock: false });
        break;
      default:
        break;
    }
  };

  // --- COMPONENTI UI ---

  const renderSidebar = () => (
    <div className="w-80 bg-slate-50 border-r border-slate-200 h-screen flex flex-col print:hidden">
      <div className="p-4 border-b border-slate-200">
        {/* Placeholder Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <span className="font-bold text-lg text-slate-800">StudioManager</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cerca allievo..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {searchQuery && filteredCustomers.length === 0 && (
          <p className="text-sm text-slate-500 text-center">Nessun allievo trovato.</p>
        )}
        
        {filteredCustomers.map(customer => {
          const nextLesson = customer.lezioni.find(l => new Date(l.data) >= new Date(new Date().setHours(0,0,0,0)));
          
          return (
            <div key={customer.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-300 transition cursor-pointer">
              <div onClick={() => handleCustomerSelect(customer)} className="font-semibold text-slate-800 mb-1">{customer.nome}</div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{customer.saldo_attuale < 0 ? <span className="text-red-500 font-medium">Debito: {customer.saldo_attuale}€</span> : <span className="text-emerald-600 font-medium">In regola</span>}</span>
              </div>
              {nextLesson && (
                <div 
                  onClick={(e) => { e.stopPropagation(); jumpToLesson(nextLesson); }}
                  className="mt-2 text-xs bg-indigo-50 text-indigo-700 p-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition"
                >
                  <Calendar className="w-3 h-3" />
                  Prossima: {nextLesson.data} ore {nextLesson.ora_inizio}:00
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCalendar = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden print:hidden">
        {/* Header Calendario */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold text-slate-800">
              {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5"/></button>
          </div>
          <div className="flex gap-2">
             <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">Vista Giornaliera</span>
          </div>
        </div>

        {/* Griglia Oraria */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-4xl mx-auto border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
            {hours.map(hour => {
              // Trova lezioni e blocchi per questa ora
              const activeLessons = customers.flatMap(c => c.lezioni.map(l => ({...l, customer: c}))).filter(l => l.data === dateStr && l.ora_inizio === hour);
              const activeBlocks = blocks.filter(b => b.data === dateStr && b.ora_inizio === hour);

              return (
                <div key={hour} className="flex border-b border-slate-200 min-h-[80px] group relative">
                  <div className="w-20 bg-white border-r border-slate-200 flex items-center justify-center text-sm font-medium text-slate-500">
                    {hour}:00
                  </div>
                  <div 
                    className="flex-1 p-1 relative bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                    onClick={() => setEventModal({ isOpen: true, data: { data: dateStr, ora_inizio: hour }, isBlock: false })}
                  >
                    {/* Pulsante rapido blocco orario al passaggio del mouse */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEventModal({ isOpen: true, data: { data: dateStr, ora_inizio: hour }, isBlock: true }); }}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-xs flex items-center gap-1 z-10"
                    >
                      <Ban className="w-3 h-3" /> Chiudi Slot
                    </button>

                    {activeBlocks.map(block => (
                      <div key={block.id} className="absolute inset-x-2 top-1 bottom-1 bg-slate-200 border-2 border-dashed border-slate-400 rounded-lg p-2 flex flex-col justify-center items-center opacity-80 cursor-not-allowed">
                        <Ban className="w-5 h-5 text-slate-500 mb-1" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{block.causale}</span>
                      </div>
                    ))}

                    {activeLessons.map(lesson => (
                      <div key={lesson.id} onClick={(e) => { e.stopPropagation(); handleCustomerSelect(lesson.customer); }} className="absolute inset-x-2 top-1 bottom-1 bg-indigo-100 border border-indigo-300 rounded-lg p-3 flex flex-col justify-between hover:shadow-md transition cursor-pointer z-10">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-indigo-900">{lesson.customer.nome}</span>
                          <span className="text-xs font-medium px-2 py-1 bg-white text-indigo-700 rounded-full">{lesson.stato}</span>
                        </div>
                        <span className="text-xs text-indigo-600 mt-1 line-clamp-1">{lesson.customer.note_esterne}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerProfile = () => {
    if (!activeCustomer) return null;
    const c = activeCustomer;

    return (
      <div className="flex-1 overflow-y-auto bg-slate-100 p-6 print:hidden">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Intestazione */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{c.nome}</h1>
              <p className="text-slate-500 flex items-center gap-4 mt-2">
                <span>{c.email}</span> • <span>{c.telefono}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCurrentView('calendar')} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                Torna al Calendario
              </button>
              <button 
                onClick={() => setPrintModal({ isOpen: true, data: { ...c, voci: [...c.sospesi], scontoExtra: 0, noteAggiuntive: c.note_esterne } })}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Stampa / Genera PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Colonna Finanziaria */}
            <div className="col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5"/> Stato Contabile</h3>
                <div className={`p-4 rounded-xl mb-4 ${c.saldo_attuale < 0 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <p className="text-sm font-medium text-slate-600 mb-1">Saldo Attuale</p>
                  <p className={`text-3xl font-bold ${c.saldo_attuale < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {c.saldo_attuale.toFixed(2)} €
                  </p>
                </div>
                
                <h4 className="font-semibold text-slate-700 mb-2 mt-6">Da Saldare (Sospesi)</h4>
                {c.sospesi.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Nessun importo in sospeso.</p>
                ) : (
                  <ul className="space-y-2">
                    {c.sospesi.map(s => (
                      <li key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-sm font-medium text-slate-700">{s.causale}</span>
                        <span className="text-sm font-bold text-red-600">{s.importo.toFixed(2)}€</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Colonna Note (Doppio Livello) e Compiti */}
            <div className="col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">Gestione Note & Compiti</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Note Interne */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-red-600 mb-2">
                      <AlertCircle className="w-4 h-4" /> Note Interne (Riservate Staff)
                    </label>
                    <textarea 
                      className="w-full h-32 p-3 bg-red-50 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                      value={c.note_interne}
                      onChange={(e) => setActiveCustomer({...c, note_interne: e.target.value})}
                      placeholder="Annotazioni visibili solo alla reception..."
                    />
                  </div>

                  {/* Note Esterne */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-indigo-600 mb-2">
                      <FileText className="w-4 h-4" /> Note / Compiti (Visibili al Cliente)
                    </label>
                    <textarea 
                      className="w-full h-32 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                      value={c.note_esterne}
                      onChange={(e) => setActiveCustomer({...c, note_esterne: e.target.value})}
                      placeholder="Compiti, promemoria, comunicazioni ufficiali..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={() => requestPin('save_customer', c)}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Lock className="w-4 h-4" /> Salva Modifiche Scheda
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDailyRegister = () => (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-6 print:hidden">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-800">Registro Giornaliero & Cassa</h1>
        <p className="text-slate-500">{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Incasso POS</h3>
            <p className="text-3xl font-black text-slate-800">120.00 €</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Incasso Contanti</h3>
            <p className="text-3xl font-black text-slate-800">40.00 €</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Presenze Odierne</h3>
            <p className="text-3xl font-black text-slate-800">12 Allievi</p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- MODALI ---
  const renderPinModal = () => {
    if (!pinModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center transform transition-all">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Autorizzazione</h2>
          <p className="text-slate-500 text-sm mb-6">Inserisci il PIN per confermare l'operazione (Test: 1234).</p>
          
          <input 
            type="password" 
            maxLength="4"
            autoFocus
            className="w-40 text-center text-3xl tracking-[0.5em] font-bold p-3 border-2 border-slate-200 rounded-xl mx-auto block mb-6 focus:border-indigo-500 focus:ring-0 outline-none"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmPin()}
          />

          <div className="flex gap-3 justify-center">
            <button onClick={() => setPinModal({isOpen: false})} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Annulla</button>
            <button onClick={confirmPin} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-md">Sblocca</button>
          </div>
        </div>
      </div>
    );
  };

  const renderPrintModal = () => {
    if (!printModal.isOpen || !printModal.data) return null;
    const pData = printModal.data;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex py-10 justify-center overflow-y-auto z-40 print:hidden">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full my-auto">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Printer/> Anteprima di Stampa Editabile</h2>
            <button onClick={() => setPrintModal({isOpen: false})} className="text-slate-500 hover:text-slate-800 font-bold text-xl">×</button>
          </div>

          <div className="space-y-6">
            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-xl text-sm text-yellow-800 mb-6">
              <span className="font-bold">Nota per la Reception:</span> Tutto ciò che modifichi qui verrà aggiornato e salvato nella scheda del cliente dopo aver inserito il PIN e confermato la stampa. Zero discrepanze.
            </div>

            {/* Dati Documento */}
            <div>
              <h3 className="font-bold text-slate-700 mb-3 border-b pb-1">Voci Contabili / Ricevuta</h3>
              {pData.voci.map((voce, idx) => (
                <div key={idx} className="flex gap-3 mb-2 items-center">
                  <input 
                    className="flex-1 p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                    value={voce.causale}
                    onChange={(e) => {
                      const newVoci = [...pData.voci];
                      newVoci[idx].causale = e.target.value;
                      setPrintModal({...printModal, data: {...pData, voci: newVoci}});
                    }}
                  />
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-28 p-2 border border-slate-300 rounded text-right pr-6 focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                      value={voce.importo}
                      onChange={(e) => {
                        const newVoci = [...pData.voci];
                        newVoci[idx].importo = parseFloat(e.target.value) || 0;
                        setPrintModal({...printModal, data: {...pData, voci: newVoci}});
                      }}
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500">€</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
               <h3 className="font-bold text-slate-700 mb-2 mt-4">Sconto / Abbuono applicato al volo</h3>
               <div className="relative w-40">
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded text-right pr-6 text-emerald-600 font-bold"
                    value={pData.scontoExtra}
                    onChange={(e) => setPrintModal({...printModal, data: {...pData, scontoExtra: parseFloat(e.target.value) || 0}})}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500">€</span>
               </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-700 mb-2 mt-4 border-b pb-1">Note e Compiti (Stamperanno sul foglio)</h3>
              <textarea 
                className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500"
                value={pData.noteAggiuntive}
                onChange={(e) => setPrintModal({...printModal, data: {...pData, noteAggiuntive: e.target.value}})}
              />
            </div>
          </div>

          <div className="mt-8 pt-4 border-t flex justify-end gap-4">
            <button onClick={() => setPrintModal({isOpen: false})} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Annulla</button>
            <button 
              onClick={() => requestPin('print_receipt', pData)}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2"
            >
              <Lock className="w-4 h-4"/> Salva Dati e Stampa
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEventModal = () => {
    if (!eventModal.isOpen) return null;
    const isBlock = eventModal.isBlock;
    const [causaleBlock, setCausaleBlock] = useState("");

    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-40 print:hidden">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
            {isBlock ? "Chiudi Disponibilità Oraria" : "Gestione Slot Orario"}
          </h2>
          
          <div className="mb-4 text-sm text-slate-600 flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <Clock className="w-4 h-4 text-slate-400" /> 
            {eventModal.data.data} - Ore {eventModal.data.ora_inizio}:00
          </div>

          {isBlock ? (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Causale Chiusura:</label>
              <input 
                type="text" 
                placeholder="Es. Ferie, Manutenzione..." 
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-red-500"
                value={causaleBlock}
                onChange={e => setCausaleBlock(e.target.value)}
              />
              <button 
                onClick={() => requestPin('add_block', { id: Date.now().toString(), data: eventModal.data.data, ora_inizio: eventModal.data.ora_inizio, durata: 1, causale: causaleBlock })}
                className="w-full py-2 mt-4 bg-red-600 text-white font-bold rounded hover:bg-red-700 flex justify-center items-center gap-2"
              >
                <Lock className="w-4 h-4" /> Conferma Blocco (PIN)
              </button>
            </div>
          ) : (
             <div className="text-center py-6 text-slate-500 text-sm">
                Per programmare una lezione in questo slot, seleziona prima l'allievo dalla barra di ricerca.
             </div>
          )}

          <div className="mt-4 pt-4 border-t text-center">
            <button onClick={() => setEventModal({isOpen: false, data: null, isBlock: false})} className="text-slate-500 hover:text-slate-800 text-sm font-medium">Annulla e Chiudi</button>
          </div>
        </div>
      </div>
    );
  };

  // --- LAYOUT PRINCIPALE E STAMPA (Nascosta all'interfaccia) ---
  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      
      {/* Stili per la stampa - visibili solo su carta/pdf */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
        }
      `}</style>

      {/* Area effettivamente stampata */}
      <div id="printable-area" className="hidden print:block font-sans text-slate-800">
        {printModal.data && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4">
              <div>
                <h1 className="text-4xl font-black tracking-tighter">StudioManager</h1>
                <p className="text-slate-500 text-sm mt-1">Ricevuta & Riepilogo Allievo</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{printModal.data.nome}</p>
                <p className="text-slate-500 text-sm">Data emissione: {new Date().toLocaleDateString('it-IT')}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-4 text-sm border-b pb-2">Riepilogo Importi</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 font-bold text-slate-700">Descrizione Voce</th>
                    <th className="py-2 font-bold text-slate-700 text-right">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {printModal.data.voci.map((v, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3">{v.causale}</td>
                      <td className="py-3 text-right font-medium">{v.importo.toFixed(2)} €</td>
                    </tr>
                  ))}
                  {printModal.data.scontoExtra > 0 && (
                     <tr>
                        <td className="py-3 font-medium text-slate-600">Sconto Applicato</td>
                        <td className="py-3 text-right font-bold text-slate-800">- {printModal.data.scontoExtra.toFixed(2)} €</td>
                     </tr>
                  )}
                  <tr className="bg-slate-50">
                    <td className="py-4 font-black text-lg">TOTALE</td>
                    <td className="py-4 text-right font-black text-xl">
                      {(printModal.data.voci.reduce((acc, v) => acc + parseFloat(v.importo), 0) - printModal.data.scontoExtra).toFixed(2)} €
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {printModal.data.noteAggiuntive && (
              <div className="mt-12 pt-6 border-t-2 border-slate-100">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-4 text-sm">Comunicazioni / Compiti</h2>
                <div className="p-6 bg-slate-50 rounded-xl whitespace-pre-wrap leading-relaxed">
                  {printModal.data.noteAggiuntive}
                </div>
              </div>
            )}
            
            <div className="mt-20 pt-8 border-t text-center text-slate-400 text-xs">
              Documento generato dal sistema gestionale interno. Le note interne non sono riportate.
            </div>
          </div>
        )}
      </div>

      {/* INTERFACCIA REALE */}
      {renderSidebar()}
      
      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        {/* Header di Navigazione Rapida */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
          <div className="flex gap-4">
            <button onClick={() => setCurrentView('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentView === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Calendar className="w-4 h-4"/> Planning
            </button>
            <button onClick={() => setCurrentView('daily')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentView === 'daily' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <CreditCard className="w-4 h-4"/> Cassa e Presenze
            </button>
            <button onClick={() => {if(customers[0]) handleCustomerSelect(customers[0])}} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentView === 'customer' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users className="w-4 h-4"/> Anagrafica Veloce
            </button>
          </div>
          <div className="text-sm font-bold text-slate-400">
            {new Date().toLocaleDateString('it-IT')} - Ore {new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}
          </div>
        </header>

        {/* Content Area */}
        {currentView === 'calendar' && renderCalendar()}
        {currentView === 'customer' && renderCustomerProfile()}
        {currentView === 'daily' && renderDailyRegister()}
      </div>

      {/* Render Modals */}
      {renderPinModal()}
      {renderPrintModal()}
      {renderEventModal()}
    </div>
  );
}
