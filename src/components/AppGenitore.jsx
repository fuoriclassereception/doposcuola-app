import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';

export default function AppGenitore({ utente, onLogout }) {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard');
  const [richieste, setRichieste] = useState([]);
  const [iMieiFigli, setIMieiFigli] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nuovaRichiesta, setNuovaRichiesta] = useState({
    studenteId: '',
    materia: '',
    ore: 1,
    note: ''
  });

  // 1. Carica i figli associati a questo genitore (tramite email genitore)
  useEffect(() => {
    if (!utente?.email) return;
    
    // Cerchiamo gli studenti la cui 'genitoreEmail' corrisponde all'email dell'utente loggato
    const qStudenti = query(collection(db, 'studenti'), where('genitoreEmail', '==', utente.email));
    
    const unsub = onSnapshot(qStudenti, (snapshot) => {
      const figli = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIMieiFigli(figli);
      // Pre-seleziona il primo figlio se esiste
      if (figli.length > 0) {
        setNuovaRichiesta(prev => ({ ...prev, studenteId: figli[0].id }));
      }
    });
    return () => unsub();
  }, [utente]);

  // 2. Carica lo storico delle richieste di questo genitore (Risolto il bug sparizione)
  useEffect(() => {
    if (!utente?.uid) return;

    // Togliamo l'orderBy lato server che bloccava Firebase senza indici
    const qRichieste = query(collection(db, 'richieste_genitori'), where('genitoreId', '==', utente.uid));
    
    const unsub = onSnapshot(qRichieste, (snapshot) => {
      let dati = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataFormattata: doc.data().dataCreazione?.toDate?.()?.toLocaleDateString('it-IT') || 'Oggi'
      }));
      // Ordinamento manuale lato client (dal più recente al più vecchio)
      dati.sort((a, b) => {
        const timeA = a.dataCreazione?.toMillis?.() || 0;
        const timeB = b.dataCreazione?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setRichieste(dati);
    });

    return () => unsub();
  }, [utente]);

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
        // Salviamo SIA l'ID reale SIA il nome per comodità di lettura
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

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-screen">

        {/* Header App Genitore */}
        <header className="bg-blue-600 text-white p-5 shadow-md shrink-0 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black">FuoriClasse</h1>
            <button onClick={onLogout} className="text-xs bg-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-800 transition">
              Esci
            </button>
          </div>
          <p className="text-xs text-blue-200">Accesso come: <span className="font-bold text-white">{utente.email}</span></p>
        </header>

        {/* Corpo Scrollabile */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-6">

          {vistaAttiva === 'dashboard' && (
            <>
              {/* PANNELLO CONTO E SITUAZIONE FIGLI */}
              <div>
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">La situazione dei tuoi figli</h2>
                {iMieiFigli.length === 0 ? (
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm border border-yellow-200">
                    Nessun figlio associato a questa email. Comunica la tua email in segreteria per l'abbinamento.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {iMieiFigli.map(figlio => {
                      const versato = Number(figlio.totaleVersato || 0);
                      const consumato = Number(figlio.totaleConsumato || 0);
                      const saldo = versato - consumato;

                      return (
                        <div key={figlio.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                          <h3 className="font-bold text-slate-800">{figlio.nome} {figlio.cognome}</h3>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                              <p className="text-gray-500">Plafond versato</p>
                              <p className="font-bold text-slate-700">€ {versato.toFixed(2)}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                              <p className="text-gray-500">Ore Consumate</p>
                              <p className="font-bold text-slate-700">€ {consumato.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className={`mt-3 p-2 rounded-lg text-center font-bold text-sm ${saldo < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            Saldo Attuale: {saldo > 0 ? '+' : ''}€ {saldo.toFixed(2)}
                            {saldo < 0 && <span className="block text-xs font-normal mt-0.5">Ricarica necessaria in Reception</span>}
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
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Richiedi Nuove Ore
                </button>
              )}

              {/* STORICO RICHIESTE (Ora funzionante) */}
              <div>
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Storico Richieste</h2>
                {richieste.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4 bg-white rounded-xl border border-dashed border-gray-300">Nessuna richiesta inviata.</p>
                ) : (
                  <div className="space-y-3">
                    {richieste.map(req => (
                      <div key={req.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          req.stato === 'Approvata' ? 'bg-green-500' :
                          req.stato === 'Rifiutata' ? 'bg-red-500' : 'bg-yellow-400'
                        }`}></div>

                        <div className="flex justify-between items-start pl-2">
                          <div>
                            <span className="font-bold text-slate-800 block">{req.materia}</span>
                            <span className="text-xs font-medium text-slate-500">{req.studente} • {req.ore}h</span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider ${
                            req.stato === 'Approvata' ? 'bg-green-100 text-green-700' :
                            req.stato === 'Rifiutata' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.stato}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 pl-2 mt-1">Invio: {req.dataFormattata}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {vistaAttiva === 'nuovaRichiesta' && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-slate-800" onClick={() => setVistaAttiva('dashboard')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span className="text-sm font-bold">Annulla e torna indietro</span>
              </div>

              <h2 className="text-xl font-black text-slate-800 mb-6">Nuova Richiesta Ore</h2>

              <form onSubmit={handleInviaRichiesta} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Seleziona Studente *</label>
                  <select 
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium"
                    value={nuovaRichiesta.studenteId}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, studenteId: e.target.value})}
                  >
                    {iMieiFigli.map(f => (
                      <option key={f.id} value={f.id}>{f.nome} {f.cognome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Materia *</label>
                  <input
                    type="text" required placeholder="Es. Matematica"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                    value={nuovaRichiesta.materia} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, materia: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Ore richieste *</label>
                  <input
                    type="number" min="1" max="10" required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                    value={nuovaRichiesta.ore} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, ore: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Argomenti da trattare (opzionale)</label>
                  <textarea
                    rows="3" placeholder="Es. Preparazione verifica capitolo 4..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm resize-none"
                    value={nuovaRichiesta.note} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, note: e.target.value})}
                  ></textarea>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className={`w-full font-bold py-3.5 rounded-xl transition mt-4 ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}
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
