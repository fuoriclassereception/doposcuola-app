import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';

export default function AppGenitore({ utente, onLogout }) {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard'); // 'dashboard' | 'nuovaRichiesta' | 'aggiungiFiglio'
  const [richieste, setRichieste] = useState([]);
  const [iMieiFigli, setIMieiFigli] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stato per richiedere lezioni
  const [nuovaRichiesta, setNuovaRichiesta] = useState({
    studenteId: '',
    materia: '',
    ore: 1,
    note: ''
  });

  // Stato per l'iscrizione di un nuovo figlio
  const [nuovoFiglio, setNuovoFiglio] = useState({
    nome: '',
    cognome: '',
    scuola: '',
    dataNascita: ''
  });
  const [isSubmittingFiglio, setIsSubmittingFiglio] = useState(false);

  // 1. Carica i figli associati a questo genitore (tramite email genitore)
  useEffect(() => {
    if (!utente?.email) return;
    
    const qStudenti = query(collection(db, 'studenti'), where('genitoreEmail', '==', utente.email));
    
    const unsub = onSnapshot(qStudenti, (snapshot) => {
      const figli = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIMieiFigli(figli);
      // Pre-seleziona il primo figlio nel form richieste se esiste
      if (figli.length > 0) {
        setNuovaRichiesta(prev => ({ ...prev, studenteId: figli[0].id }));
      }
    });
    return () => unsub();
  }, [utente]);

  // 2. Carica lo storico delle richieste
  useEffect(() => {
    if (!utente?.uid) return;

    const qRichieste = query(collection(db, 'richieste_genitori'), where('genitoreId', '==', utente.uid));
    
    const unsub = onSnapshot(qRichieste, (snapshot) => {
      let dati = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataFormattata: doc.data().dataCreazione?.toDate?.()?.toLocaleDateString('it-IT') || 'Oggi'
      }));
      // Ordinamento manuale lato client (dal più recente)
      dati.sort((a, b) => {
        const timeA = a.dataCreazione?.toMillis?.() || 0;
        const timeB = b.dataCreazione?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setRichieste(dati);
    });

    return () => unsub();
  }, [utente]);

  // Funzione per inviare richiesta ore
  const handleInviaRichiesta = async (e) => {
    e.preventDefault();
    if (!nuovaRichiesta.studenteId) {
      alert("Devi selezionare uno studente.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const figlioSelezionato = iMieiFigli.find(f => f.id === nuovaRichiesta.studenteId);
      
      await addDoc(collection(db, 'richieste_genitori'), {
        genitoreId: utente.uid,
        emailGenitore: utente.email,
        studenteId: figlioSelezionato.id,
        studente: `${figlioSelezionato.nome} ${figlioSelezionato.cognome}`,
        materia: nuovaRichiesta.materia,
        ore: Number(nuovaRichiesta.ore),
        note: nuovaRichiesta.note,
        stato: 'In attesa',
        dataCreazione: serverTimestamp()
      });

      setNuovaRichiesta(prev => ({ ...prev, materia: '', ore: 1, note: '' }));
      setVistaAttiva('dashboard');
    } catch (error) {
      console.error("Errore invio richiesta:", error);
      alert("Errore di connessione. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funzione per Iscrivere un Nuovo Figlio
  const handleAggiungiFiglio = async (e) => {
    e.preventDefault();
    setIsSubmittingFiglio(true);
    try {
      // Crea lo studente direttamente nel database della Reception
      await addDoc(collection(db, 'studenti'), {
        nome: nuovoFiglio.nome,
        cognome: nuovoFiglio.cognome,
        scuola: nuovoFiglio.scuola,
        dataNascita: nuovoFiglio.dataNascita,
        genitoreEmail: utente.email, // Il collegamento magico!
        attivo: true,
        totaleVersato: 0,
        totaleConsumato: 0,
        totalePattuito: 0,
        storicoRicariche: [],
        categoriaTariffaria: 'medie', // Default modificabile dal desk
        isMinorenne: true
      });

      setNuovoFiglio({ nome: '', cognome: '', scuola: '', dataNascita: '' });
      setVistaAttiva('dashboard');
    } catch (error) {
      console.error("Errore aggiunta figlio:", error);
      alert("Errore durante l'aggiunta. Riprova.");
    } finally {
      setIsSubmittingFiglio(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-screen relative">

        {/* Header App Genitore */}
        <header className="bg-blue-600 text-white p-5 shadow-md shrink-0 flex flex-col gap-3 relative z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black">FuoriClasse</h1>
            <button onClick={onLogout} className="text-xs bg-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-800 transition">
              Esci
            </button>
          </div>
          <p className="text-xs text-blue-200 truncate">Accesso come: <span className="font-bold text-white">{utente.email}</span></p>
        </header>

        {/* Corpo Scrollabile */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-6">

          {vistaAttiva === 'dashboard' && (
            <>
              {/* PANNELLO CONTO E SITUAZIONE FIGLI */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider">La situazione dei tuoi figli</h2>
                  {iMieiFigli.length > 0 && (
                    <button 
                      onClick={() => setVistaAttiva('aggiungiFiglio')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      + Aggiungi
                    </button>
                  )}
                </div>

                {iMieiFigli.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl text-center border border-gray-200 shadow-sm space-y-4">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">Nessun figlio registrato</h3>
                      <p className="text-sm text-gray-500 mt-1">Per poter richiedere lezioni, devi prima aggiungere il profilo di tuo figlio.</p>
                    </div>
                    <button 
                      onClick={() => setVistaAttiva('aggiungiFiglio')}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition"
                    >
                      Aggiungi Studente
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {iMieiFigli.map(figlio => {
                      const versato = Number(figlio.totaleVersato || 0);
                      const consumato = Number(figlio.totaleConsumato || 0);
                      const saldo = versato - consumato;

                      return (
                        <div key={figlio.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${saldo < 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <h3 className="font-black text-slate-800 text-lg pl-2">{figlio.nome} {figlio.cognome}</h3>
                          
                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs pl-2">
                            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                              <p className="text-gray-500 font-bold mb-0.5">Plafond versato</p>
                              <p className="font-black text-slate-700 text-sm">€ {versato.toFixed(2)}</p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                              <p className="text-gray-500 font-bold mb-0.5">Ore Consumate</p>
                              <p className="font-black text-slate-700 text-sm">€ {consumato.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className={`mt-3 ml-2 p-2.5 rounded-xl text-center font-black text-sm ${saldo < 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                            Saldo Attuale: {saldo > 0 ? '+' : ''}€ {saldo.toFixed(2)}
                            {saldo < 0 && <span className="block text-xs font-bold mt-1 text-red-500">Ricarica necessaria in Reception</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BOTTONE RICHIEDI ORE */}
              {iMieiFigli.length > 0 && (
                <button
                  onClick={() => setVistaAttiva('nuovaRichiesta')}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Richiedi Nuove Ore
                </button>
              )}

              {/* STORICO RICHIESTE */}
              <div className="pb-8">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Storico Richieste</h2>
                {richieste.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6 bg-white rounded-2xl border border-dashed border-gray-300">Nessuna richiesta inviata.</p>
                ) : (
                  <div className="space-y-3">
                    {richieste.map(req => (
                      <div key={req.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          req.stato === 'Approvata' ? 'bg-green-500' :
                          req.stato === 'Rifiutata' ? 'bg-red-500' : 'bg-yellow-400'
                        }`}></div>

                        <div className="flex justify-between items-start pl-2">
                          <div>
                            <span className="font-black text-slate-800 block text-base">{req.materia}</span>
                            <span className="text-xs font-bold text-slate-500">{req.studente} • {req.ore}h</span>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            req.stato === 'Approvata' ? 'bg-green-100 text-green-700' :
                            req.stato === 'Rifiutata' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.stato}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 pl-2 mt-2">Invio: {req.dataFormattata}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* VISTA: AGGIUNGI FIGLIO */}
          {vistaAttiva === 'aggiungiFiglio' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-slate-800" onClick={() => setVistaAttiva('dashboard')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span className="text-sm font-bold">Indietro</span>
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-2">Registra Studente</h2>
              <p className="text-xs text-gray-500 mb-6 font-medium">Inserisci i dati per collegare automaticamente l'alunno al tuo account genitore.</p>

              <form onSubmit={handleAggiungiFiglio} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Nome *</label>
                  <input
                    type="text" required placeholder="Es. Leonardo"
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium"
                    value={nuovoFiglio.nome} onChange={(e) => setNuovoFiglio({...nuovoFiglio, nome: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Cognome *</label>
                  <input
                    type="text" required placeholder="Es. Rossi"
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium"
                    value={nuovoFiglio.cognome} onChange={(e) => setNuovoFiglio({...nuovoFiglio, cognome: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Data di Nascita (Opzionale)</label>
                  <input
                    type="date"
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium"
                    value={nuovoFiglio.dataNascita} onChange={(e) => setNuovoFiglio({...nuovoFiglio, dataNascita: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Scuola Frequentata (Opzionale)</label>
                  <input
                    type="text" placeholder="Es. Liceo Scientifico, Medie Rosmini..."
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium"
                    value={nuovoFiglio.scuola} onChange={(e) => setNuovoFiglio({...nuovoFiglio, scuola: e.target.value})}
                  />
                </div>

                <button
                  type="submit" disabled={isSubmittingFiglio}
                  className={`w-full font-black py-4 rounded-xl transition mt-4 text-sm ${isSubmittingFiglio ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'}`}
                >
                  {isSubmittingFiglio ? 'Salvataggio in corso...' : 'Salva e Collega Studente'}
                </button>
              </form>
            </div>
          )}

          {/* VISTA: NUOVA RICHIESTA */}
          {vistaAttiva === 'nuovaRichiesta' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-slate-800" onClick={() => setVistaAttiva('dashboard')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span className="text-sm font-bold">Indietro</span>
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-6">Nuova Richiesta Ore</h2>

              <form onSubmit={handleInviaRichiesta} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Seleziona Studente *</label>
                  <select 
                    required
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-bold text-slate-800"
                    value={nuovaRichiesta.studenteId}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, studenteId: e.target.value})}
                  >
                    {iMieiFigli.map(f => (
                      <option key={f.id} value={f.id}>{f.nome} {f.cognome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Materia *</label>
                  <input
                    type="text" required placeholder="Es. Matematica, Latino..."
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium"
                    value={nuovaRichiesta.materia} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, materia: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Ore richieste *</label>
                  <input
                    type="number" min="1" max="10" required
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium"
                    value={nuovaRichiesta.ore} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, ore: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Note e Argomenti (opzionale)</label>
                  <textarea
                    rows="3" placeholder="Es. Preparazione verifica capitolo 4..."
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium resize-none"
                    value={nuovaRichiesta.note} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, note: e.target.value})}
                  ></textarea>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className={`w-full font-black py-4 rounded-xl transition mt-2 text-sm ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'}`}
                >
                  {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta al Desk'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
