import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { Calendar, Plus, User, X, CheckCircle, BookOpen, AlertTriangle, Crown, Users, MapPin } from 'lucide-react';

export default function AppInsegnante({ utente, onLogout }) {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard');
  const [insegnanteRef, setInsegnanteRef] = useState(null);
  const [lezioni, setLezioni] = useState([]);
  const [tutteLezioni, setTutteLezioni] = useState([]);
  const [studenti, setStudenti] = useState([]);
  const [tuttiInsegnanti, setTuttiInsegnanti] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nuovaLezione, setNuovaLezione] = useState({ data: new Date().toISOString().split('T')[0], oraInizio: '15:00', oraFine: '16:00', materia: '', note: '' });
  
  const [studentiSelezionati, setStudentiSelezionati] = useState([]);
  const [ricercaStudente, setRicercaStudente] = useState('');
  
  // STATI PER IL COORDINATORE
  const [titolareSelezionato, setTitolareSelezionato] = useState(''); // Contiene l'ID del prof o 'Gruppo'
  const [coDocenti, setCoDocenti] = useState([]);
  const [ricercaDocente, setRicercaDocente] = useState('');

  useEffect(() => {
    if (!utente?.email) return;
    const q = query(collection(db, 'insegnanti'), where('email', '==', utente.email));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const ins = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setInsegnanteRef(ins);
        setNuovaLezione(prev => ({ ...prev, materia: ins.materia || '' }));
        if (!titolareSelezionato) setTitolareSelezionato(ins.id);
      }
    });
    return () => unsub();
  }, [utente]);

  useEffect(() => {
    if (!insegnanteRef?.id) return;
    
    const qLez = query(collection(db, 'lezioni'), where('insegnanteId', '==', insegnanteRef.id));
    const unsubLez = onSnapshot(qLez, snap => {
      const oggi = new Date().toISOString().split('T')[0];
      const dati = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(l => l.data >= oggi && l.stato !== 'annullata');
      dati.sort((a, b) => a.data.localeCompare(b.data) || (a.oraInizio || '').localeCompare(b.oraInizio || ''));
      setLezioni(dati);
    });

    const unsubStd = onSnapshot(query(collection(db, 'studenti'), where('attivo', '==', true)), snap => setStudenti(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubTutteLez = onSnapshot(query(collection(db, 'lezioni'), where('data', '>=', new Date().toISOString().split('T')[0])), snap => setTutteLezioni(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    let unsubProf = () => {};
    if (insegnanteRef.isCoordinatore) {
      unsubProf = onSnapshot(query(collection(db, 'insegnanti'), where('attivo', '==', true)), snap => setTuttiInsegnanti(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }

    return () => { unsubLez(); unsubStd(); unsubTutteLez(); unsubProf(); };
  }, [insegnanteRef]);

  const toggleStudente = (std) => {
    if (studentiSelezionati.find(s => s.id === std.id)) setStudentiSelezionati(studentiSelezionati.filter(s => s.id !== std.id));
    else setStudentiSelezionati([...studentiSelezionati, std]);
    setRicercaStudente('');
  };

  const toggleCoDocente = (doc) => {
    if (coDocenti.find(d => d.id === doc.id)) setCoDocenti(coDocenti.filter(d => d.id !== doc.id));
    else setCoDocenti([...coDocenti, doc]);
    setRicercaDocente('');
  };

  // --- RADAR COMPLETO ---
  const checkCollisioni = () => {
    const conflitti = [];
    const { data, oraInizio, oraFine } = nuovaLezione;
    if (!data || !oraInizio || !oraFine) return conflitti;
    if (oraInizio >= oraFine) { conflitti.push("L'ora di inizio deve essere precedente all'ora di fine."); return conflitti; }

    const lezioniGiorno = tutteLezioni.filter(l => l.data === data && l.stato !== 'annullata');
    
    // Tutti i prof coinvolti in questa operazione
    const profDaControllare = coDocenti.map(d => d.id);
    if (titolareSelezionato !== 'Gruppo') profDaControllare.push(titolareSelezionato);

    lezioniGiorno.forEach(lez => {
      const sovrapposizione = oraInizio < lez.oraFine && oraFine > lez.oraInizio;
      if (sovrapposizione) {
        // Controllo Insegnanti
        profDaControllare.forEach(pId => {
          if (lez.insegnanteId === pId || (lez.coDocentiIds || []).includes(pId)) {
            const profInfo = tuttiInsegnanti.find(i => i.id === pId) || insegnanteRef;
            const nomeProf = profInfo.id === insegnanteRef.id ? 'Sei' : `Il Prof. ${profInfo.cognome} è`;
            conflitti.push(`⛔ ${nomeProf} già occupato/a (${lez.oraInizio}-${lez.oraFine})`);
          }
        });
        
        // Controllo Studenti
        studentiSelezionati.forEach(std => {
          if ((lez.studentiIds || []).includes(std.id)) {
            conflitti.push(`⛔ L'allievo ${std.nome} ha già una lezione in questo orario`);
          }
        });
      }
    });
    return [...new Set(conflitti)];
  };

  const conflittiAttuali = checkCollisioni();
  const formNonValido = conflittiAttuali.length > 0 || studentiSelezionati.length === 0 || (!insegnanteRef.isCoordinatore && studentiSelezionati.length === 0);

  const handleSalvaLezione = async (e) => {
    e.preventDefault();
    if (formNonValido) return;
    setIsSubmitting(true);

    try {
      const idTitolare = titolareSelezionato === 'Gruppo' ? '' : (titolareSelezionato || insegnanteRef.id);
      const idCoDocenti = coDocenti.map(d => d.id);
      
      const isGruppoReale = titolareSelezionato === 'Gruppo' || studentiSelezionati.length > 1 || coDocenti.length > 0;
      const profMateria = tuttiInsegnanti.find(i => i.id === idTitolare);
      const materiaDaSalvare = nuovaLezione.materia || (profMateria ? profMateria.materia : insegnanteRef.materia);

      await addDoc(collection(db, 'lezioni'), {
        data: nuovaLezione.data, oraInizio: nuovaLezione.oraInizio, oraFine: nuovaLezione.oraFine,
        materia: materiaDaSalvare, 
        insegnanteId: idTitolare, 
        coDocentiIds: idCoDocenti, 
        studentiIds: studentiSelezionati.map(s => s.id),
        isGruppo: isGruppoReale, stato: 'attiva', inseritaDaDocente: true, note: nuovaLezione.note || '', createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleString('it-IT'), createdAt: Date.now(), operatore: insegnanteRef.nome, 
        azione: `Lezione auto-inserita da Docente (Titolare: ${idTitolare || 'Gruppo'})`
      });

      setNuovaLezione(prev => ({ ...prev, oraInizio: '15:00', oraFine: '16:00', note: '' }));
      setStudentiSelezionati([]);
      setCoDocenti([]);
      setTitolareSelezionato(insegnanteRef.id);
      setVistaAttiva('dashboard');
    } catch (error) { console.error(error); alert("Errore salvataggio lezione."); } 
    finally { setIsSubmitting(false); }
  };

  const studentiFiltrati = studenti.filter(s => `${s.nome} ${s.cognome}`.toLowerCase().includes(ricercaStudente.toLowerCase()));
  
  // Togliamo dai risultati il prof già selezionato come Titolare
  const docentiFiltrati = tuttiInsegnanti
    .filter(d => d.id !== titolareSelezionato)
    .filter(d => `${d.nome} ${d.cognome}`.toLowerCase().includes(ricercaDocente.toLowerCase()));

  const formatDataLezione = (dataStr) => { if(!dataStr) return ''; const [y, m, d] = dataStr.split('-'); return `${d}/${m}/${y}`; };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-screen relative">

        <header className="bg-slate-900 text-white p-5 shadow-md shrink-0 flex flex-col gap-3 relative z-10 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black flex items-center gap-2">👨‍🏫 FuoriClasse Docenti</h1>
            <button onClick={onLogout} className="text-[10px] bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-600 transition">Esci</button>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-lg font-black text-amber-400">Ciao, {insegnanteRef?.nome || 'Docente'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{insegnanteRef?.materia || 'Materia'}</p>
            </div>
            {insegnanteRef?.isCoordinatore && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase px-2 py-1 rounded flex items-center gap-1"><Crown className="w-3 h-3"/> Admin</span>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-6">
          {vistaAttiva === 'dashboard' && (
            <>
              <button onClick={() => setVistaAttiva('nuova_lezione')} className="w-full bg-amber-400 text-slate-900 font-black py-4 rounded-2xl shadow-md hover:bg-amber-500 transition flex justify-center items-center gap-2">
                <Plus className="w-5 h-5"/> Inserisci Nuova Lezione
              </button>

              <div className="pt-2">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Calendar className="w-4 h-4"/> Le Tue Prossime Lezioni</h2>
                {lezioni.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-dashed border-slate-300 rounded-2xl"><p className="text-sm font-bold text-slate-400">Nessuna lezione imminente.</p></div>
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

              {/* ZONA SINCRONIZZAZIONE CALENDARIO */}
              <div className="mt-8 bg-indigo-50 border border-indigo-200 p-5 rounded-2xl">
                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  🗓️ Sincronizza Calendario
                </h3>
                <p className="text-[11px] text-indigo-700 font-bold mb-4">
                  Collega il tuo Planning in tempo reale a Google Calendar o Apple Calendar. Si aggiornerà automaticamente!
                </p>
                <button 
                  onClick={() => {
                    const linkMagico = `${window.location.origin}/api/calendario?profId=${insegnanteRef.id}`;
                    navigator.clipboard.writeText(linkMagico);
                    alert("✅ Link copiato! \n\nOra apri Google Calendar su PC, vai su 'Altri calendari' -> '+' -> 'Da URL' e incolla questo link.");
                  }} 
                  className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Copia Link Personale
                </button>
              </div>
            </>
          )}

          {vistaAttiva === 'nuova_lezione' && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-slate-800" onClick={() => setVistaAttiva('dashboard')}>
                <span className="text-sm font-bold">⬅️ Indietro</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-500"/> Nuova Lezione</h2>
              
              <form onSubmit={handleSalvaLezione} className="space-y-5">
                
                {/* 👑 MENU COORDINATORE */}
                {insegnanteRef?.isCoordinatore && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4 space-y-4">
                    
                    {/* SCELTA DELLA COLONNA (TITOLARE) */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Colonna sul Planning (Titolare)</label>
                      <select 
                        className="w-full p-2.5 border border-amber-300 rounded-lg text-sm font-black bg-white text-slate-900"
                        value={titolareSelezionato} 
                        onChange={e => {
                          setTitolareSelezionato(e.target.value);
                          // Se lo scegli come Titolare, rimuovilo dai co-docenti per non averlo doppio
                          if(e.target.value !== 'Gruppo') {
                            setCoDocenti(coDocenti.filter(d => d.id !== e.target.value));
                          }
                        }}
                      >
                        <option value="Gruppo">📚 Gruppo Misto (Colonna Generale)</option>
                        {tuttiInsegnanti.map(ins => (
                          <option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome} ({ins.materia})</option>
                        ))}
                      </select>
                    </div>

                    {/* AGGIUNTA CO-DOCENTI */}
                    <div className="pt-2 border-t border-amber-200">
                      <label className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Aggiungi Co-Docenti (Buste Paga)</label>
                      {coDocenti.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {coDocenti.map(doc => (
                            <span key={doc.id} className="bg-white text-slate-700 border border-slate-300 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                              {doc.cognome} <button type="button" onClick={() => toggleCoDocente(doc)}><X className="w-3 h-3 text-slate-400 hover:text-red-500"/></button>
                            </span>
                          ))}
                        </div>
                      )}
                      <input type="text" placeholder="Cerca collega..." className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" value={ricercaDocente} onChange={e => setRicercaDocente(e.target.value)} />
                      {ricercaDocente.trim().length > 0 && (
                        <div className="mt-1 border border-amber-300 rounded-xl max-h-40 overflow-y-auto shadow-lg bg-white absolute z-30 w-[calc(100%-70px)]">
                          {docentiFiltrati.length === 0 ? <div className="p-3 text-xs text-slate-400 text-center">Nessun risultato</div> : docentiFiltrati.map(doc => (
                            <div key={doc.id} onClick={() => toggleCoDocente(doc)} className="p-3 border-b border-slate-100 text-sm font-bold text-slate-700 hover:bg-amber-50 cursor-pointer">{doc.nome} {doc.cognome} ({doc.materia})</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MENU ALLIEVI */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Allievi Presenti *</label>
                  {studentiSelezionati.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {studentiSelezionati.map(std => (
                        <span key={std.id} className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          {std.nome} <button type="button" onClick={() => toggleStudente(std)}><X className="w-3 h-3 text-slate-400 hover:text-white"/></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input type="text" placeholder="Cerca e aggiungi studente..." className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-400 outline-none" value={ricercaStudente} onChange={e => setRicercaStudente(e.target.value)} />
                  {ricercaStudente.trim().length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-xl max-h-40 overflow-y-auto shadow-lg bg-white absolute z-20 w-[calc(100%-40px)]">
                      {studentiFiltrati.length === 0 ? <div className="p-3 text-xs text-slate-400 text-center">Nessun risultato</div> : studentiFiltrati.map(std => (
                        <div key={std.id} onClick={() => toggleStudente(std)} className="p-3 border-b border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">{std.nome} {std.cognome}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Data *</label><input type="date" required className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-bold" value={nuovaLezione.data} onChange={e => setNuovaLezione({...nuovaLezione, data: e.target.value})} /></div>
                  <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Dalle *</label><input type="time" required className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-bold" value={nuovaLezione.oraInizio} onChange={e => setNuovaLezione({...nuovaLezione, oraInizio: e.target.value})} /></div>
                  <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Alle *</label><input type="time" required className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-bold" value={nuovaLezione.oraFine} onChange={e => setNuovaLezione({...nuovaLezione, oraFine: e.target.value})} /></div>
                  <div className="col-span-2"><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Materia Trattata</label><input type="text" className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-medium" value={nuovaLezione.materia} onChange={e => setNuovaLezione({...nuovaLezione, materia: e.target.value})} placeholder="Es. Italiano" /></div>
                </div>

                <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Note (opzionale)</label><textarea rows="2" className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm resize-none" value={nuovaLezione.note} onChange={e => setNuovaLezione({...nuovaLezione, note: e.target.value})} placeholder="Argomenti, compiti..."></textarea></div>
                
                {conflittiAttuali.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl space-y-1 animate-pulse">
                    <p className="text-xs font-black text-red-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Rilevati Conflitti nel Planning!</p>
                    <ul className="text-[11px] font-bold text-red-700 space-y-1 mt-2">
                      {conflittiAttuali.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting || formNonValido} className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition mt-4 flex items-center justify-center gap-2 ${formNonValido ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}>
                  <CheckCircle className="w-5 h-5"/> {isSubmitting ? 'Salvataggio...' : (formNonValido ? 'Risolvi i conflitti per salvare' : 'Conferma e Salva')}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
