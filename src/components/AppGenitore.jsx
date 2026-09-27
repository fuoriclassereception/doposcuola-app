import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Calendar, Plus, UserPlus, Clock, BookOpen, CheckCircle, XCircle, ChevronLeft, Paperclip } from 'lucide-react';

export default function AppGenitore({ utente, onLogout }) {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard');
  const [richieste, setRichieste] = useState([]);
  const [iMieiFigli, setIMieiFigli] = useState([]);
  const [lezioniProgrammate, setLezioniProgrammate] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingFiglio, setIsSubmittingFiglio] = useState(false);

  const [nuovaRichiesta, setNuovaRichiesta] = useState({ 
    studenteId: '', materia: '', ore: 1, note: '', dataPreferita: '', orarioPreferito: '' 
  });
  const [fileAllegato, setFileAllegato] = useState(null); 
  
  const [nuovoFiglio, setNuovoFiglio] = useState({ 
    nome: '', cognome: '', scuola: '', dataNascita: '', telefono: '', emailStudente: '' 
  });

  useEffect(() => {
    if (!utente?.email) return;
    const unsub = onSnapshot(query(collection(db, 'studenti'), where('genitoreEmail', '==', utente.email)), (snapshot) => {
      const figli = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIMieiFigli(figli);
      if (figli.length > 0) setNuovaRichiesta(prev => ({ ...prev, studenteId: figli[0].id }));
    });
    return () => unsub();
  }, [utente]);

  useEffect(() => {
    if (!utente?.uid) return;
    const unsub = onSnapshot(query(collection(db, 'richieste_genitori'), where('genitoreId', '==', utente.uid)), (snapshot) => {
      let dati = snapshot.docs.map(doc => {
        const dataCreazione = doc.data().dataCreazione?.toDate?.();
        const dataFormattata = dataCreazione 
          ? dataCreazione.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
          : 'Oggi';
          
        return {
          id: doc.id, 
          ...doc.data(),
          dataFormattata
        };
      });
      dati.sort((a, b) => (b.dataCreazione?.toMillis?.() || 0) - (a.dataCreazione?.toMillis?.() || 0));
      setRichieste(dati);
    });
    return () => unsub();
  }, [utente]);

  useEffect(() => {
    if (iMieiFigli.length === 0) {
      setLezioniProgrammate([]);
      return;
    }
    const unsub = onSnapshot(query(collection(db, 'lezioni'), where('stato', '==', 'attiva')), (snapshot) => {
      const tutteLezioni = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const idsFigli = iMieiFigli.map(f => f.id);
      const lezioniDeiFigli = tutteLezioni.filter(lez => (lez.studentiIds || []).some(id => idsFigli.includes(id)));
      
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
      let allegatoUrl = '';

      if (fileAllegato) {
        const estensione = fileAllegato.name.split('.').pop();
        const nomeFileUnico = `allegati/${Date.now()}_${figlio.nome}.${estensione}`;
        const storageRef = ref(storage, nomeFileUnico);
        
        await uploadBytes(storageRef, fileAllegato);
        allegatoUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'richieste_genitori'), {
        genitoreId: utente.uid, emailGenitore: utente.email, studenteId: figlio.id,
        studente: `${figlio.nome} ${figlio.cognome}`, materia: nuovaRichiesta.materia,
        ore: Number(nuovaRichiesta.ore), note: nuovaRichiesta.note, 
        dataPreferita: nuovaRichiesta.dataPreferita, 
        orarioPreferito: nuovaRichiesta.orarioPreferito,
        allegatoUrl: allegatoUrl, 
        stato: 'In attesa',
        dataCreazione: serverTimestamp()
      });
      
      setNuovaRichiesta(prev => ({ ...prev, materia: '', ore: 1, note: '', dataPreferita: '', orarioPreferito: '' }));
      setFileAllegato(null);
      setVistaAttiva('dashboard');
    } catch (error) {
      console.error(error);
      alert("Errore di connessione o nel caricamento del file.");
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
        dataNascita: nuovoFiglio.dataNascita, telefono: nuovoFiglio.telefono, email: nuovoFiglio.emailStudente,
        genitoreEmail: utente.email, attivo: true, totaleVersato: 0, totaleConsumato: 0, totalePattuito: 0, 
        storicoRicariche: [], categoriaTariffaria: 'medie', isMinorenne: true
      });
      setNuovoFiglio({ nome: '', cognome: '', scuola: '', dataNascita: '', telefono: '', emailStudente: '' });
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
            <h1 className="text-xl font-black flex items-center gap-2">📚 FuoriClasse</h1>
            <button onClick={onLogout} className="text-xs bg-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-800 transition">Esci</button>
          </div>
          <p className="text-xs text-blue-200 truncate">Accesso: <span className="font-bold text-white">{utente.email}</span></p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-6">

          {vistaAttiva === 'dashboard' && (
            <>
              {lezioniProgrammate.length > 0 && (
                <div className="mb-2">
                  <h2 className="text-sm font-black text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    🗓️ Lezioni Fissate in Programma
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
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">I Tuoi Profili Studente</h2>
                {iMieiFigli.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl text-center border border-gray-200 shadow-sm space-y-4">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl">👤</div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">Nessun profilo registrato</h3>
                      <p className="text-sm text-gray-500 mt-1">Aggiungi il profilo studente per poter prenotare lezioni.</p>
                    </div>
                    <button onClick={() => setVistaAttiva('aggiungiFiglio')} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">
                      Crea Profilo Studente
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

                    <button onClick={() => setVistaAttiva('aggiungiFiglio')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black hover:bg-blue-50 transition-colors shadow-sm">
                      ➕ Aggiungi un altro Profilo
                    </button>
                  </div>
                )}
              </div>

              {iMieiFigli.length > 0 && (
                <button onClick={() => setVistaAttiva('nuovaRichiesta')} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-4">
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
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ req.stato === 'Approvata' ? 'bg-green-500' : req.stato === 'Rifiutata' ? 'bg-red-500' : 'bg-yellow-400' }`}></div>

                        <div className="flex justify-between items-start pl-2">
                          <div>
                            <span className="font-black text-slate-800 block text-base flex items-center gap-2">
                              {req.materia} 
                              {req.allegatoUrl && <Paperclip className="w-3.5 h-3.5 text-blue-500"/>}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              {req.studente} • {req.ore}h 
                              {req.dataPreferita && ` • 🗓️ ${formatDataLezione(req.dataPreferita)}`}
                              {req.orarioPreferito && ` (${req.orarioPreferito})`}
                            </span>
                          </div>
                          
                          <span className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider ${ req.stato === 'Approvata' ? 'bg-green-100 text-green-700' : req.stato === 'Rifiutata' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700' }`}>
                            {req.stato === 'Approvata' ? 'Fissata' : req.stato}
                          </span>
                        </div>
                        
                        <div className="pl-2 mt-3 flex justify-between items-end">
                          <p className="text-[10px] font-bold text-gray-400">Inviata il: {req.dataFormattata}</p>
                          {req.allegatoUrl && (
                            <a href={req.allegatoUrl} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100 transition-colors">
                              Vedi Allegato
                            </a>
                          )}
                        </div>
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
              <h2 className="text-2xl font-black text-slate-800 mb-2">Profilo Studente</h2>
              <p className="text-xs text-gray-500 mb-6 font-medium">Inserisci i dati dello studente da associare al tuo profilo.</p>
              <form onSubmit={handleAggiungiFiglio} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Nome *</label><input type="text" required className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm font-medium" value={nuovoFiglio.nome} onChange={(e) => setNuovoFiglio({...nuovoFiglio, nome: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Cognome *</label><input type="text" required className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm font-medium" value={nuovoFiglio.cognome} onChange={(e) => setNuovoFiglio({...nuovoFiglio, cognome: e.target.value})} /></div>
                </div>
                <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Cellulare (WhatsApp)</label><input type="tel" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm font-medium" value={nuovoFiglio.telefono} onChange={(e) => setNuovoFiglio({...nuovoFiglio, telefono: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Email Studente</label><input type="email" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm font-medium" value={nuovoFiglio.emailStudente} onChange={(e) => setNuovoFiglio({...nuovoFiglio, emailStudente: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Scuola Frequentata</label><input type="text" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm font-medium" value={nuovoFiglio.scuola} onChange={(e) => setNuovoFiglio({...nuovoFiglio, scuola: e.target.value})} /></div>
                <button type="submit" disabled={isSubmittingFiglio} className="w-full font-black py-4 rounded-xl mt-4 text-sm bg-blue-600 text-white shadow-lg">{isSubmittingFiglio ? 'Salvataggio...' : 'Salva Profilo'}</button>
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
                <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Studente *</label><select required className="w-full p-3.5 border border-gray-300 rounded-xl bg-gray-50 text-sm font-bold text-slate-800" value={nuovaRichiesta.studenteId} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, studenteId: e.target.value})}>{iMieiFigli.map(f => (<option key={f.id} value={f.id}>{f.nome} {f.cognome}</option>))}</select></div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Materia *</label><input type="text" required placeholder="Es. Matematica" className="w-full p-3.5 border border-gray-300 rounded-xl bg-gray-50 text-sm" value={nuovaRichiesta.materia} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, materia: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Giorno (Opzionale)</label><input type="date" className="w-full p-3.5 border border-gray-300 rounded-xl bg-gray-50 text-sm font-medium" value={nuovaRichiesta.dataPreferita} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, dataPreferita: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Orario (Opzionale)</label><input type="text" placeholder="Es. Dopo le 16, Indifferente..." className="w-full p-3.5 border border-gray-300 rounded-xl bg-gray-50 text-sm font-medium" value={nuovaRichiesta.orarioPreferito} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, orarioPreferito: e.target.value})} /></div>
                  
                  {/* RISOLTO BUG MEZZE ORE */}
                  <div className="col-span-2"><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Ore richieste *</label><input type="number" step="0.5" min="0.5" max="10" required className="w-full p-3.5 border border-gray-300 rounded-xl bg-gray-50 text-sm" value={nuovaRichiesta.ore} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, ore: e.target.value})} /></div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1 flex items-center gap-2">
                    <Paperclip className="w-3 h-3"/> Allega Foto / Esercizi (opzionale)
                  </label>
                  <div className="w-full p-2 border border-dashed border-blue-400 bg-blue-50/50 rounded-xl">
                    <input 
                      type="file" 
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setFileAllegato(e.target.files[0])}
                      className="text-xs text-slate-500 w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer transition-colors"
                    />
                  </div>
                  {fileAllegato && <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {fileAllegato.name}</p>}
                </div>

                <div><label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Note (opzionale)</label><textarea rows="3" placeholder="Argomenti da trattare..." className="w-full p-3.5 border border-gray-300 rounded-xl bg-gray-50 text-sm resize-none" value={nuovaRichiesta.note} onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, note: e.target.value})}></textarea></div>
                <button type="submit" disabled={isSubmitting} className={`w-full font-black py-4 rounded-xl transition mt-2 text-sm ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}>{isSubmitting ? 'Invio in corso...' : 'Invia Richiesta al Desk'}</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
