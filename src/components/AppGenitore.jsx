import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Calendar, Plus, UserPlus, Clock, BookOpen, CheckCircle, XCircle, ChevronLeft, Paperclip, Settings, Bell, BellOff, Volume2, Vibrate, Mail, X } from 'lucide-react';

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

  // STATI PER IMPOSTAZIONI SVEGLIA E NOTIFICHE GENITORE
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [impostazioniForm, setImpostazioniForm] = useState({ 
    notificheAbilitate: false, 
    minutiPreavviso: 30, 
    suonoAbilitato: true,
    vibrazioneAbilitata: true,
    emailAbilitate: false
  });
  const notifiedLezioni = useRef(new Set());

  // Recupera i figli e le impostazioni salvate nel primo figlio
  useEffect(() => {
    if (!utente?.email) return;
    const unsub = onSnapshot(query(collection(db, 'studenti'), where('genitoreEmail', '==', utente.email)), (snapshot) => {
      const figli = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIMieiFigli(figli);
      
      if (figli.length > 0) {
        if (!nuovaRichiesta.studenteId) {
          setNuovaRichiesta(prev => ({ ...prev, studenteId: figli[0].id }));
        }
        // Carica le preferenze dal primo figlio
        const primoFiglio = figli[0];
        setImpostazioniForm({
          notificheAbilitate: primoFiglio.notificheAbilitate || false,
          minutiPreavviso: primoFiglio.minutiPreavviso || 30,
          suonoAbilitato: primoFiglio.suonoAbilitato !== false,
          vibrazioneAbilitata: primoFiglio.vibrazioneAbilitata !== false,
          emailAbilitate: primoFiglio.emailAbilitate || false
        });
      }
    });
    return () => unsub();
  }, [utente]);

  // Recupera Storico Richieste
  useEffect(() => {
    if (!utente?.uid) return;
    const unsub = onSnapshot(query(collection(db, 'richieste_genitori'), where('genitoreId', '==', utente.uid)), (snapshot) => {
      let dati = snapshot.docs.map(doc => {
        const dataCreazione = doc.data().dataCreazione?.toDate?.();
        const dataFormattata = dataCreazione 
          ? dataCreazione.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
          : 'Oggi';
          
        return { id: doc.id, ...doc.data(), dataFormattata };
      });
      dati.sort((a, b) => (b.dataCreazione?.toMillis?.() || 0) - (a.dataCreazione?.toMillis?.() || 0));
      setRichieste(dati);
    });
    return () => unsub();
  }, [utente]);

  // Recupera Lezioni dei figli
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

  // --- MOTORE SVEGLIA E NOTIFICHE GENITORE ---
  useEffect(() => {
    if (!impostazioniForm.notificheAbilitate || lezioniProgrammate.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const todayStr = new Date().toISOString().split('T')[0];
      const preavviso = Number(impostazioniForm.minutiPreavviso) || 30;

      lezioniProgrammate.forEach(lez => {
        if (lez.data === todayStr && lez.stato !== 'annullata') {
          const [h, m] = (lez.oraInizio || '00:00').split(':').map(Number);
          const startMins = h * 60 + m;
          
          if (startMins - nowMins === preavviso && startMins > nowMins && !notifiedLezioni.current.has(lez.id)) {
            notifiedLezioni.current.add(lez.id);
            
            if (impostazioniForm.suonoAbilitato) {
              try { new Audio('https://assets.mixkit.co/active_storage/sfx/2866/2866-preview.mp3').play(); } catch(e){}
            }
            if (impostazioniForm.vibrazioneAbilitata && navigator.vibrate) {
              try { navigator.vibrate([200, 100, 200]); } catch(e){}
            }
            if (Notification.permission === 'granted') {
              new Notification('Lezione in arrivo!', { body: `Tra ${preavviso} min tuo figlio/a ha lezione di ${lez.materia}`});
            }
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [impostazioniForm, lezioniProgrammate]);

  const salvaImpostazioni = async () => {
    try {
      // Metodo sicuro: salviamo le preferenze in una collezione dedicata "impostazioni_genitori" basata sull'UID del genitore
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'impostazioni_genitori', utente.uid), {
        email: utente.email,
        notificheAbilitate: impostazioniForm.notificheAbilitate,
        minutiPreavviso: Number(impostazioniForm.minutiPreavviso),
        suonoAbilitato: impostazioniForm.suonoAbilitato,
        vibrazioneAbilitata: impostazioniForm.vibrazioneAbilitata,
        emailAbilitate: impostazioniForm.emailAbilitate
      }, { merge: true });

      // Se ha anche dei figli, salviamo una copia rapida anche lì per comodità del postino email
      if (iMieiFigli.length > 0) {
        for (const figlio of iMieiFigli) {
          await updateDoc(doc(db, 'studenti', figlio.id), {
            emailAbilitate: impostazioniForm.emailAbilitate
          }).catch(() => {}); // Ignora eventuali errori minori sul singolo studente
        }
      }

      setShowSettingsModal(false);
      
      if (impostazioniForm.notificheAbilitate && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      alert("✅ Preferenze salvate con successo!");
    } catch (error) {
      console.error("Errore dettagliato Firebase:", error);
      alert("Errore durante il salvataggio. Controlla la console per i dettagli.");
    }
  };

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
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettingsModal(true)} className="p-1.5 bg-blue-700 border border-blue-500 rounded-lg text-blue-100 hover:text-white transition"><Settings className="w-4 h-4"/></button>
              <button onClick={onLogout} className="text-xs bg-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-800 transition">Esci</button>
            </div>
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

              {/* CRUSCOTTO STATO NOTIFICHE GENITORE */}
              <div className={`p-4 border rounded-2xl flex items-center justify-between cursor-pointer transition shadow-sm ${impostazioniForm.notificheAbilitate ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setShowSettingsModal(true)}>
                 <div>
                    <h3 className={`text-sm font-black flex items-center gap-1.5 ${impostazioniForm.notificheAbilitate ? 'text-emerald-800' : 'text-slate-500'}`}>
                      {impostazioniForm.notificheAbilitate ? <Bell className="w-4 h-4"/> : <BellOff className="w-4 h-4"/>} 
                      {impostazioniForm.notificheAbilitate ? 'Promemoria Lezioni Attivo' : 'Promemoria Disattivati'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">{impostazioniForm.notificheAbilitate ? `Ti avviseremo ${impostazioniForm.minutiPreavviso} minuti prima su questo telefono.` : 'Clicca per configurare la sveglia.'}</p>
                 </div>
              </div>

              <div>
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3 mt-4">I Tuoi Profili Studente</h2>
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

      {/* MODALE IMPOSTAZIONI SVEGLIA E EMAIL GENITORE */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600"/> Impostazioni</h3>
              <button onClick={() => setShowSettingsModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <div className="space-y-6">
               
               <div>
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Avvisi su Telefono</h4>
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition">
                    <input type="checkbox" className="w-5 h-5 text-emerald-500 rounded border-slate-300" checked={impostazioniForm.notificheAbilitate} onChange={e => setImpostazioniForm({...impostazioniForm, notificheAbilitate: e.target.checked})} />
                    <div className="flex-1">
                      <span className="font-black text-slate-800 flex items-center gap-2">
                         {impostazioniForm.notificheAbilitate ? <Bell className="w-4 h-4 text-emerald-500"/> : <BellOff className="w-4 h-4 text-slate-400"/>} 
                         Sveglia Attiva
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tieni l'app aperta o in background per far suonare l'avviso.</p>
                    </div>
                  </label>

                  {impostazioniForm.notificheAbilitate && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-3 space-y-4">
                       <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-emerald-900 w-full">Minuti di preavviso:</span>
                          <input type="number" min="5" max="120" className="w-16 p-2 text-center font-black bg-white border border-emerald-300 rounded-lg text-slate-900 shadow-inner" value={impostazioniForm.minutiPreavviso} onChange={e => setImpostazioniForm({...impostazioniForm, minutiPreavviso: e.target.value})} />
                       </div>
                       
                       <div className="border-t border-emerald-200/60 pt-3 space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={impostazioniForm.suonoAbilitato} onChange={e => setImpostazioniForm({...impostazioniForm, suonoAbilitato: e.target.checked})} />
                            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5"/> Riproduci Suono</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={impostazioniForm.vibrazioneAbilitata} onChange={e => setImpostazioniForm({...impostazioniForm, vibrazioneAbilitata: e.target.checked})} />
                            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5"><Vibrate className="w-3.5 h-3.5"/> Vibrazione</span>
                          </label>
                       </div>
                       
                       <button type="button" onClick={() => { 
                         if(impostazioniForm.suonoAbilitato) { try { new Audio('https://assets.mixkit.co/active_storage/sfx/2866/2866-preview.mp3').play(); } catch(e){} }
                         if(impostazioniForm.vibrazioneAbilitata && navigator.vibrate) { navigator.vibrate([200, 100, 200]); }
                       }} className="w-full py-2 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 font-black text-xs rounded-lg transition shadow-sm">
                          Testa Avviso
                       </button>
                    </div>
                  )}
               </div>

               <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Ricevi via Email</h4>
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition">
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-blue-300" checked={impostazioniForm.emailAbilitate} onChange={e => setImpostazioniForm({...impostazioniForm, emailAbilitate: e.target.checked})} />
                    <div className="flex-1">
                      <span className="font-black text-blue-900 flex items-center gap-2">
                         <Mail className="w-4 h-4"/> 
                         Invia promemoria via Email
                      </span>
                      <p className="text-[10px] text-blue-700 font-medium mt-0.5">Ricevi una email automatica con il riepilogo della lezione.</p>
                    </div>
                  </label>
               </div>

               <button onClick={salvaImpostazioni} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg mt-2">Salva e Chiudi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
