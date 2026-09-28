import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { Calendar, Plus, Clock, User, X, CheckCircle, BookOpen } from 'lucide-react';

export default function AppInsegnante({ utente, onLogout }) {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard');
  const [insegnanteRef, setInsegnanteRef] = useState(null);
  const [lezioni, setLezioni] = useState([]);
  const [studenti, setStudenti] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nuovaLezione, setNuovaLezione] = useState({
    data: new Date().toISOString().split('T')[0],
    oraInizio: '15:00',
    oraFine: '16:00',
    materia: '',
    note: ''
  });
  const [studentiSelezionati, setStudentiSelezionati] = useState([]);
  const [ricercaStudente, setRicercaStudente] = useState('');

  // 1. Identifica il profilo dell'insegnante loggato
  useEffect(() => {
    if (!utente?.email) return;
    const q = query(collection(db, 'insegnanti'), where('email', '==', utente.email));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const ins = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setInsegnanteRef(ins);
        setNuovaLezione(prev => ({ ...prev, materia: ins.materia || '' }));
      }
    });
    return () => unsub();
  }, [utente]);

  // 2. Carica le lezioni di questo insegnante e gli studenti attivi
  useEffect(() => {
    if (!insegnanteRef?.id) return;
    
    // Lezioni future
    const qLez = query(collection(db, 'lezioni'), where('insegnanteId', '==', insegnanteRef.id));
    const unsubLez = onSnapshot(qLez, (snap) => {
      const oggi = new Date().toISOString().split('T')[0];
      const dati = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(l => l.data >= oggi && l.stato !== 'annullata');
      
      dati.sort((a, b) => a.data.localeCompare(b.data) || (a.oraInizio || '').localeCompare(b.oraInizio || ''));
      setLezioni(dati);
    });

    // Studenti per il menu a tendina
    const qStd = query(collection(db, 'studenti'), where('attivo', '==', true));
    const unsubStd = onSnapshot(qStd, (snap) => {
      setStudenti(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubLez(); unsubStd(); };
  }, [insegnanteRef]);

  const toggleStudente = (std) => {
    if (studentiSelezionati.find(s => s.id === std.id)) {
      setStudentiSelezionati(studentiSelezionati.filter(s => s.id !== std.id));
    } else {
      setStudentiSelezionati([...studentiSelezionati, std]);
    }
    setRicercaStudente('');
  };

  const handleSalvaLezione = async (e) => {
    e.preventDefault();
    if (studentiSelezionati.length === 0) return alert("Seleziona almeno uno studente!");
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'lezioni'), {
        data: nuovaLezione.data,
        oraInizio: nuovaLezione.oraInizio,
        oraFine: nuovaLezione.oraFine,
        materia: nuovaLezione.materia || insegnanteRef.materia,
        insegnanteId: insegnanteRef.id,
        studentiIds: studentiSelezionati.map(s => s.id),
        isGruppo: studentiSelezionati.length > 1,
        stato: 'attiva', // Va direttamente attiva sul planning del Desk!
        inseritaDaDocente: true,
        note: nuovaLezione.note || '',
        createdAt: serverTimestamp()
      });

      // Logica per i log del Desk
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleString('it-IT'),
        createdAt: Date.now(),
        operatore: insegnanteRef.nome, 
        azione: `Lezione auto-inserita da Docente per il ${nuovaLezione.data}`
      });

      setNuovaLezione(prev => ({ ...prev, oraInizio: '15:00', oraFine: '16:00', note: '' }));
      setStudentiSelezionati([]);
      setVistaAttiva('dashboard');
    } catch (error) {
      console.error(error);
      alert("Errore salvataggio lezione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentiFiltrati = studenti.filter(s => 
    `${s.nome} ${s.cognome}`.toLowerCase().includes(ricercaStudente.toLowerCase())
  );

  const formatDataLezione = (dataStr) => {
    if(!dataStr) return '';
    const [y, m, d] = dataStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-screen relative">

        <header className="bg-slate-900 text-white p-5 shadow-md shrink-0 flex flex-col gap-3 relative z-10 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black flex items-center gap-2">👨‍🏫 FuoriClasse Docenti</h1>
            <button onClick={onLogout} className="text-[10px] bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-600 transition">Esci</button>
          </div>
          <div>
            <p className="text-lg font-black text-amber-400">Ciao, {insegnanteRef?.nome || 'Docente'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{insegnanteRef?.materia || 'Materia'}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-6">

          {vistaAttiva === 'dashboard' && (
            <>
              <button onClick={() => setVistaAttiva('nuova_lezione')} className="w-full bg-amber-400 text-slate-900 font-black py-4 rounded-2xl shadow-md hover:bg-amber-500 transition flex justify-center items-center gap-2">
                <Plus className="w-5 h-5"/> Inserisci Nuova Lezione
              </button>

              <div className="pt-2">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4"/> Le Tue Prossime Lezioni
                </h2>
                
                {lezioni.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-dashed border-slate-300 rounded-2xl">
                    <p className="text-sm font-bold text-slate-400">Nessuna lezione imminente.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lezioni.map(lez => {
                      const nomiStudenti = (lez.studentiIds || []).map(id => studenti.find(s => s.id === id)?.nome).filter(Boolean).join(', ');
                      return (
                        <div key={lez.id} className="bg-white border-l-4 border-amber-400 p-4 rounded-xl shadow-sm relative overflow-hidden">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-slate-800 text-base">{lez.materia}</span>
                            {lez.inseritaDaDocente && <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded">AUTO</span>}
                          </div>
                          <p className="text-slate-500 font-bold text-sm mb-3 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> {nomiStudenti || 'Studente non trovato'}</p>
                          <div className="flex gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div><p className="text-[9px] text-slate-400 uppercase font-bold">Data</p><p className="font-black text-sm text-slate-700">{formatDataLezione(lez.data)}</p></div>
                            <div><p className="text-[9px] text-slate-400 uppercase font-bold">Orario</p><p className="font-black text-sm text-slate-700">{lez.oraInizio} - {lez.oraFine}</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {vistaAttiva === 'nuova_lezione' && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-slate-800" onClick={() => setVistaAttiva('dashboard')}>
                <span className="text-sm font-bold">⬅️ Annulla</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-500"/> Nuova Lezione</h2>
              
              <form onSubmit={handleSalvaLezione} className="space-y-5">
                
                {/* Selezione Studenti */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Allievi Presenti *</label>
                  
                  {studentiSelezionati.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {studentiSelezionati.map(std => (
                        <span key={std.id} className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          {std.nome} {std.cognome} <button type="button" onClick={() => toggleStudente(std)}><X className="w-3 h-3 text-slate-400 hover:text-white"/></button>
                        </span>
                      ))}
                    </div>
                  )}

                  <input 
                    type="text" 
                    placeholder="Cerca e clicca sullo studente..." 
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-400 outline-none"
                    value={ricercaStudente} 
                    onChange={e => setRicercaStudente(e.target.value)}
                  />
                  
                  {ricercaStudente.trim().length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-xl max-h-40 overflow-y-auto shadow-lg bg-white absolute z-20 w-[calc(100%-40px)]">
                      {studentiFiltrati.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">Nessun risultato</div>
                      ) : (
                        studentiFiltrati.map(std => (
                          <div key={std.id} onClick={() => toggleStudente(std)} className="p-3 border-b border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                            {std.nome} {std.cognome}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Data *</label><input type="date" required className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-bold" value={nuovaLezione.data} onChange={e => setNuovaLezione({...nuovaLezione, data: e.target.value})} /></div>
                  <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Dalle *</label><input type="time" required className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-bold" value={nuovaLezione.oraInizio} onChange={e => setNuovaLezione({...nuovaLezione, oraInizio: e.target.value})} /></div>
                  <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Alle *</label><input type="time" required className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-bold" value={nuovaLezione.oraFine} onChange={e => setNuovaLezione({...nuovaLezione, oraFine: e.target.value})} /></div>
                  <div className="col-span-2"><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Materia Trattata</label><input type="text" className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-medium" value={nuovaLezione.materia} onChange={e => setNuovaLezione({...nuovaLezione, materia: e.target.value})} placeholder={insegnanteRef?.materia} /></div>
                </div>

                <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Note (opzionale)</label><textarea rows="2" className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm resize-none" value={nuovaLezione.note} onChange={e => setNuovaLezione({...nuovaLezione, note: e.target.value})} placeholder="Argomenti, compiti..."></textarea></div>
                
                <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-slate-800 transition mt-4 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5"/> {isSubmitting ? 'Salvataggio...' : 'Conferma e Salva nel Planning'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
