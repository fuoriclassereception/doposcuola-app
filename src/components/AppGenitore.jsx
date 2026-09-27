import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';

export default function AppGenitore({ utente, onLogout }) {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard'); // 'dashboard' | 'nuovaRichiesta' | 'aggiungiFiglio'
  const [richieste, setRichieste] = useState([]);
  const [iMieiFigli, setIMieiFigli] = useState([]);
  const [lezioniProgrammate, setLezioniProgrammate] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingFiglio, setIsSubmittingFiglio] = useState(false);

  const [nuovaRichiesta, setNuovaRichiesta] = useState({ studenteId: '', materia: '', ore: 1, note: '' });
  const [nuovoFiglio, setNuovoFiglio] = useState({ nome: '', cognome: '', scuola: '', dataNascita: '' });

  // 1. Carica i figli
  useEffect(() => {
    if (!utente?.email) return;
    const unsub = onSnapshot(query(collection(db, 'studenti'), where('genitoreEmail', '==', utente.email)), (snapshot) => {
      const figli = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIMieiFigli(figli);
      if (figli.length > 0) setNuovaRichiesta(prev => ({ ...prev, studenteId: figli[0].id }));
    });
    return () => unsub();
  }, [utente]);

  // 2. Carica storico richieste
  useEffect(() => {
    if (!utente?.uid) return;
    const unsub = onSnapshot(query(collection(db, 'richieste_genitori'), where('genitoreId', '==', utente.uid)), (snapshot) => {
      let dati = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        dataFormattata: doc.data().dataCreazione?.toDate?.()?.toLocaleDateString('it-IT') || 'Oggi'
      }));
      dati.sort((a, b) => (b.dataCreazione?.toMillis?.() || 0) - (a.dataCreazione?.toMillis?.() || 0));
      setRichieste(dati);
    });
    return () => unsub();
  }, [utente]);

  // 3. Carica Lezioni Programmate
  useEffect(() => {
    if (iMieiFigli.length === 0) {
      setLezioniProgrammate([]);
      return;
    }
    const unsub = onSnapshot(query(collection(db, 'lezioni'), where('stato', '==', 'attiva')), (snapshot) => {
      const tutteLezioni = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const idsFigli = iMieiFigli.map(f => f.id);
      
      const lezioniDeiFigli = tutteLezioni.filter(lez => 
        (lez.studentiIds || []).some(id => idsFigli.includes(id))
      );

      const oggi = new Date().toISOString().split('T')[0];
      const future = lezioniDeiFigli.filter(l => l.data >= oggi);

      future.sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return (a.oraInizio || '').localeCompare(b.oraInizio || '');
      });

      setLezioniProgrammate(future);
    });
    return () => unsub();
  }, [iMieiFigli]);

  const handleInviaRichiesta = async (e) => {
    e.preventDefault();
    if (!nuovaRichiesta.studenteId) return alert("Devi selezionare uno studente.");
    setIsSubmitting(true);
    try {
      const figlio = iMieiFigli.find(f => f.id === nuovaRichiesta.studenteId);
      await addDoc(collection(db, 'richieste_genitori'), {
        genitoreId: utente.uid, emailGenitore: utente.email, studenteId: figlio.id,
        studente: `${figlio.nome} ${figlio.cognome}`, materia: nuovaRichiesta.materia,
        ore: Number(nuovaRichiesta.ore), note: nuovaRichiesta.note, stato: 'In attesa',
        dataCreazione: serverTimestamp()
      });
      setNuovaRichiesta(prev => ({ ...prev, materia: '', ore: 1, note: '' }));
      setVistaAttiva('dashboard');
    } catch (error) {
      alert("Errore di connessione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAggiungiFiglio = async (e) => {
    e.preventDefault();
    setIsSubmittingFiglio(true);
    try {
      await addDoc(collection(db, 'studenti'), {
        nome: nuovoFiglio.nome, cognome: nuovoFiglio.cognome, scuola: nuovoFiglio.scuola,
        dataNascita: nuovoFiglio.dataNascita, genitoreEmail: utente.email, attivo: true,
        totaleVersato: 0, totaleConsumato: 0, totalePattuito: 0, storicoRicariche: [],
        categoriaTariffaria: 'medie', isMinorenne: true
      });
      setNuovoFiglio({ nome: '', cognome: '', scuola: '', dataNascita: '' });
      setVistaAttiva('dashboard');
    } catch (error) {
      alert("Errore durante l'aggiunta.");
    } finally {
      setIsSubmittingFiglio(false);
    }
  };

  const formatDataLezione = (dataStr) => {
    if(!dataStr) return '';
    const [y, m, d] = dataStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-screen relative">

        <header className="bg-blue-600 text-white p-5 shadow-md shrink-0 flex flex-col gap-3 relative z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black flex items-center gap-2">
              📚 FuoriClasse
            </h1>
            <button onClick={onLogout} className="text-xs bg-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-800 transition">
              Esci
            </button>
          </div>
          <p className="text-xs text-blue-200 truncate">Accesso: <span className="font-bold text-white">{utente.email}</span></p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-6">

          {vistaAttiva === 'dashboard' && (
            <>
              {lezioniProgrammate.length > 0 && (
                <div className="mb-2">
                  <h2 className="text-sm font-black text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    🗓️ Lezioni in Programma
                  </h2>
                  <div className="space-y-3">
                    {lezioniProgrammate.map(lez => {
                      const nomiStudenti = (lez.studentiIds || [])
                        .map(id => iMieiFigli.find(f => f.id === id)?.nome)
                        .filter(Boolean).join(', ');

                      return (
                        <div key={lez.id} className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                          <p className="font-black text-lg mb-1">{lez.materia}</p>
                          <p className="text-blue-100 font-bold text-sm mb-3">👤 {nomiStudenti || 'Studente'}</p>
                          
                          <div className="flex gap-4 bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                            <div>
                              <p className="text-[10px] text-blue-100 uppercase font-bold">Data</p>
                              <p className="font-black text-sm">{formatDataLezione(lez.data)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-100 uppercase font-bold">Orario</p>
                              <p className="font-black text-sm">{lez.oraInizio} - {lez.oraFine}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Situazione Contabile</h2>
                
                {iMieiFigli.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl text-center border border-gray-200 shadow-sm space-y-4">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl">
                      👤
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">Nessun figlio registrato</h3>
                      <p className="text-sm text-gray-500 mt-1">Aggiungi il profilo di tuo figlio per iniziare a prenotare.</p>
                    </div>
                    <button onClick={() => setVistaAttiva('aggiungiFiglio')} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">
                      Aggiungi Studente
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                            {saldo < 0 && <span className="block text-xs font-bold mt-1 text-red-500">Ricarica in Reception</span>}
                          </div>
                        </div>
                      );
                    })}

                    <button 
                      onClick={() => setVistaAttiva('aggiungiFiglio')}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      ➕ Aggiungi un altro Studente
                    </button>
                  </div>
                )}
              </div>

              {iMieiFigli.length > 0 && (
                <button
                  onClick={() => setVistaAttiva('nuovaRichiesta')}
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-4"
                >
                  ➕ Richiedi Nuove Ore
                </button>
              )}

              <div className="pb-8">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3 mt-6">Storico Richieste</h2>
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
                          
                          <span className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider ${
                            req.stato === 'Approvata' ? 'bg-green-100 text-green-700' :
                            req.stato === 'Rifiutata' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.stato === 'Approvata' ? 'Fissata' : req.stato}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 pl-2 mt-2">Inviata il: {req.dataFormattata}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {vistaAttiva === 'aggiungiFiglio' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-slate-800" onClick={() => setVistaAttiva('dashboard')}>
                <span className="text-sm font-bold">⬅️ Indietro</span>
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-2">Registra Studente</h2>
              <p className="text-xs text-gray-500 mb-6 font-medium">Inserisci i dati per collegare l'alunno al tuo account genitore in modo automatico.</p>

              <form onSubmit={handleAggiungiFiglio} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Nome *</label>
                  <input type="text" required placeholder="Es. Leonardo" className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium" value={nuovoFiglio.nome} onChange={(e) => setNuovoFiglio({...nuovoFiglio, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Cognome *</label>
                  <input type="text" required placeholder="Es. Rossi" className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium" value={nuovoFiglio.cognome} onChange={(e) => setNuovoFiglio({...nuovoFiglio, cognome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Data di Nascita (Opzionale)</label>
                  <input type="date" className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium" value={nuovoFiglio.dataNascita} onChange={(e) => setNuovoFiglio({...nuovoFiglio, dataNascita: e.target.value})} />
                </div>
                <button type="submit" disabled={isSubmittingFiglio} className={`w-full font-black py-4 rounded-xl transition mt-4 text-sm ${isSubmittingFiglio ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}>
                  {isSubmittingFiglio ? 'Salvataggio...' : 'Salva Studente'}
                </button>
              </form>
            </div>
          )}

          {vistaAttiva === 'nuovaRichiesta' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-slate-800" onClick={() => setVistaAttiva('dashboard')}>
                <span className="text-sm font-bold">⬅️ Indietro</span>
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-6">Nuova Richiesta Ore</h2>

              <form onSubmit={handleInviaRichiesta} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Studente *</label>
                  <select required className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-bold text-slate-800" value={nuovaRichiesta.studenteId} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, studenteId: e.target.value})}>
                    {iMieiFigli.map(f => (<option key={f.id} value={f.id}>{f.nome} {f.cognome}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Materia *</label>
                  <input type="text" required placeholder="Es. Matematica" className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium" value={nuovaRichiesta.materia} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, materia: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Ore richieste *</label>
                  <input type="number" min="1" max="10" required className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium" value={nuovaRichiesta.ore} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, ore: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Note (opzionale)</label>
                  <textarea rows="3" placeholder="Argomenti da trattare..." className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium resize-none" value={nuovaRichiesta.note} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, note: e.target.value})}></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className={`w-full font-black py-4 rounded-xl transition mt-2 text-sm ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}>
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
