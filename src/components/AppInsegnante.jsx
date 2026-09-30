import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { Calendar as CalendarIcon, Plus, User, X, CheckCircle, BookOpen, AlertTriangle, Crown, Users, MapPin, Home, CalendarDays, PlusCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function AppInsegnante({ utente, onLogout }) {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard'); // 'dashboard', 'calendario', 'nuova_lezione'
  const [insegnanteRef, setInsegnanteRef] = useState(null);
  const [tutteLezioni, setTutteLezioni] = useState([]);
  const [studenti, setStudenti] = useState([]);
  const [tuttiInsegnanti, setTuttiInsegnanti] = useState([]);
  
  // STATI PER IL CALENDARIO MOBILE
  const [dataCalendario, setDataCalendario] = useState(new Date());
  const [modalitaCalendario, setModalitaCalendario] = useState('giorno'); // 'giorno', 'settimana'

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nuovaLezione, setNuovaLezione] = useState({ data: new Date().toISOString().split('T')[0], oraInizio: '15:00', oraFine: '16:00', materia: '', note: '' });
  
  const [studentiSelezionati, setStudentiSelezionati] = useState([]);
  const [ricercaStudente, setRicercaStudente] = useState('');
  
  const [titolareSelezionato, setTitolareSelezionato] = useState('');
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
    
    // Scarichiamo tutte le lezioni a partire da un mese fa, così il calendario storico funziona bene
    const unMeseFa = new Date();
    unMeseFa.setMonth(unMeseFa.getMonth() - 1);
    const dataMin = unMeseFa.toISOString().split('T')[0];

    const unsubTutteLez = onSnapshot(query(collection(db, 'lezioni'), where('data', '>=', dataMin)), snap => {
      setTutteLezioni(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStd = onSnapshot(query(collection(db, 'studenti'), where('attivo', '==', true)), snap => setStudenti(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    let unsubProf = () => {};
    if (insegnanteRef.isCoordinatore) {
      unsubProf = onSnapshot(query(collection(db, 'insegnanti'), where('attivo', '==', true)), snap => setTuttiInsegnanti(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }

    return () => { unsubTutteLez(); unsubStd(); unsubProf(); };
  }, [insegnanteRef]);

  // LEZIONI SPECIFICHE PER QUESTO DOCENTE (Titolare o Co-Docente)
  const mieLezioni = tutteLezioni.filter(l => l.insegnanteId === insegnanteRef?.id || (l.coDocentiIds || []).includes(insegnanteRef?.id));
  mieLezioni.sort((a, b) => a.data.localeCompare(b.data) || (a.oraInizio || '').localeCompare(b.oraInizio || ''));

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

  const checkCollisioni = () => {
    const conflitti = [];
    const { data, oraInizio, oraFine } = nuovaLezione;
    if (!data || !oraInizio || !oraFine) return conflitti;
    if (oraInizio >= oraFine) { conflitti.push("L'ora di inizio deve essere precedente all'ora di fine."); return conflitti; }

    const lezioniGiorno = tutteLezioni.filter(l => l.data === data && l.stato !== 'annullata');
    const profDaControllare = coDocenti.map(d => d.id);
    if (titolareSelezionato !== 'Gruppo') profDaControllare.push(titolareSelezionato);

    lezioniGiorno.forEach(lez => {
      const sovrapposizione = oraInizio < lez.oraFine && oraFine > lez.oraInizio;
      if (sovrapposizione) {
        profDaControllare.forEach(pId => {
          if (lez.insegnanteId === pId || (lez.coDocentiIds || []).includes(pId)) {
            const profInfo = tuttiInsegnanti.find(i => i.id === pId) || insegnanteRef;
            const nomeProf = profInfo.id === insegnanteRef.id ? 'Sei' : `Il Prof. ${profInfo.cognome} è`;
            conflitti.push(`⛔ ${nomeProf} già occupato/a (${lez.oraInizio}-${lez.oraFine})`);
          }
        });
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
  const formNonValido = conflittiAttuali.length > 0 || studentiSelezionati.length === 0 || (!insegnanteRef?.isCoordinatore && studentiSelezionati.length === 0);

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
        materia: materiaDaSalvare, insegnanteId: idTitolare, coDocentiIds: idCoDocenti, 
        studentiIds: studentiSelezionati.map(s => s.id), isGruppo: isGruppoReale, stato: 'attiva', 
        inseritaDaDocente: true, note: nuovaLezione.note || '', createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleString('it-IT'), createdAt: Date.now(), operatore: insegnanteRef.nome, 
        azione: `Lezione inserita da App Docente (Titolare: ${idTitolare || 'Gruppo'})`
      });

      setNuovaLezione(prev => ({ ...prev, oraInizio: '15:00', oraFine: '16:00', note: '' }));
      setStudentiSelezionati([]);
      setCoDocenti([]);
      setTitolareSelezionato(insegnanteRef.id);
      setVistaAttiva('calendario'); // Lo portiamo sul calendario per fargliela vedere subito!
    } catch (error) { console.error(error); alert("Errore salvataggio lezione."); } 
    finally { setIsSubmitting(false); }
  };

  const cambiaData = (giorni) => {
    const nuovaData = new Date(dataCalendario);
    nuovaData.setDate(nuovaData.getDate() + giorni);
    setDataCalendario(nuovaData);
  };

  const getSettimana = () => {
    const date = new Date(dataCalendario);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Lunedì
    const monday = new Date(date.setDate(diff));
    
    const settimana = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      settimana.push(d);
    }
    return settimana;
  };

  const formatDataIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDataIT = (isoStr) => {
    if(!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const nomeGiornoSettimana = (d) => {
    const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return giorni[d.getDay()];
  };

  const renderLezioneCard = (lez) => {
    const nomiStudenti = (lez.studentiIds || []).map(id => studenti.find(s => s.id === id)?.nome).filter(Boolean).join(', ');
    return (
      <div key={lez.id} className="bg-white border-l-4 border-amber-400 p-3 rounded-xl shadow-sm relative overflow-hidden mb-3 w-full">
        <div className="flex justify-between items-start mb-1">
          <span className="font-black text-slate-800 text-sm truncate">{lez.materia}</span>
          {lez.isGruppo && <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-1.5 py-0.5 rounded">GRUPPO</span>}
        </div>
        <p className="text-slate-500 font-bold text-xs mb-2 flex items-center gap-1"><User className="w-3 h-3"/> {nomiStudenti || 'Studente N.D.'}</p>
        <div className="flex items-center gap-2 text-[10px] font-bold bg-slate-50 border border-slate-100 p-1.5 rounded-lg text-slate-600 w-max">
          <Clock className="w-3 h-3 text-amber-500"/> {lez.oraInizio} - {lez.oraFine}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] bg-slate-100 flex flex-col font-sans overflow-hidden mx-auto max-w-md w-full shadow-2xl relative">

      {/* HEADER SUPERIORE */}
      <header className="bg-slate-900 text-white p-4 shadow-md shrink-0 flex justify-between items-center z-10">
        <div>
          <h1 className="text-lg font-black flex items-center gap-1.5"><Crown className="w-4 h-4 text-amber-400"/> {insegnanteRef?.nome || 'Docente'}</h1>
          {insegnanteRef?.isCoordinatore && <span className="text-[9px] bg-amber-500 text-amber-950 font-black uppercase px-2 py-0.5 rounded shadow mt-1 inline-block">Coordinatore</span>}
        </div>
        <button onClick={onLogout} className="text-[10px] bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-600 transition">Esci</button>
      </header>

      {/* ZONA CENTRALE SCORREVOLE */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative pb-20">
        
        {/* --- VISTA: DASHBOARD --- */}
        {vistaAttiva === 'dashboard' && (
          <div className="p-5 space-y-6">
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-6 rounded-3xl shadow-lg text-amber-950">
              <h2 className="text-2xl font-black mb-1">Benvenuto!</h2>
              <p className="text-sm font-bold opacity-90">Controlla la tua agenda o inserisci una nuova lezione direttamente dal telefono.</p>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Le Tue Prossime 3 Lezioni</h3>
              <div className="space-y-1">
                {mieLezioni.filter(l => l.data >= formatDataIso(new Date()) && l.stato !== 'annullata').slice(0,3).map(lez => renderLezioneCard(lez))}
                {mieLezioni.filter(l => l.data >= formatDataIso(new Date()) && l.stato !== 'annullata').length === 0 && (
                  <p className="text-sm text-slate-400 font-bold text-center py-6">Nessuna lezione in arrivo.</p>
                )}
              </div>
              <button onClick={() => setVistaAttiva('calendario')} className="w-full mt-2 py-2 text-amber-600 font-black text-xs uppercase bg-amber-50 rounded-xl">Vedi tutto il calendario</button>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
              <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">🗓️ Sincronizzazione iCal</h3>
              <p className="text-[11px] text-indigo-700 font-bold mb-4">Collega il tuo Planning in tempo reale a Google Calendar o Apple Calendar come promemoria.</p>
              <button 
                onClick={() => {
                  const linkMagico = `${window.location.origin}/api/calendario?profId=${insegnanteRef.id}`;
                  navigator.clipboard.writeText(linkMagico);
                  alert("✅ Link copiato! \n\nUsa questo link per iscriverti al calendario su PC o Smartphone.");
                }} 
                className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Copia Link Calendario
              </button>
            </div>
          </div>
        )}

        {/* --- VISTA: CALENDARIO MOBILE --- */}
        {vistaAttiva === 'calendario' && (
          <div className="flex flex-col h-full bg-white">
            
            {/* Controlli Calendario */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 sticky top-0 z-20 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="bg-slate-200/60 rounded-xl p-1 flex font-bold text-xs">
                  <button onClick={() => setModalitaCalendario('giorno')} className={`px-4 py-1.5 rounded-lg transition-colors ${modalitaCalendario === 'giorno' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Giorno</button>
                  <button onClick={() => setModalitaCalendario('settimana')} className={`px-4 py-1.5 rounded-lg transition-colors ${modalitaCalendario === 'settimana' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Settimana</button>
                </div>
                <button onClick={() => setDataCalendario(new Date())} className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Oggi</button>
              </div>
              
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button onClick={() => cambiaData(modalitaCalendario === 'giorno' ? -1 : -7)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700"><ChevronLeft className="w-5 h-5"/></button>
                <div className="flex-1 text-center font-black text-slate-800 text-sm">
                  {modalitaCalendario === 'giorno' 
                    ? `${nomeGiornoSettimana(dataCalendario)} ${formatDataIT(formatDataIso(dataCalendario))}`
                    : `Settimana ${formatDataIT(formatDataIso(getSettimana()[0]))}`
                  }
                </div>
                <button onClick={() => cambiaData(modalitaCalendario === 'giorno' ? 1 : 7)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700"><ChevronRight className="w-5 h-5"/></button>
              </div>
            </div>

            {/* Render Giorno (Timeline Verticale) */}
            {modalitaCalendario === 'giorno' && (
              <div className="flex-1 overflow-y-auto bg-slate-50 relative p-4 space-y-4">
                {(() => {
                  const dataOggiStr = formatDataIso(dataCalendario);
                  const lezioniOggi = mieLezioni.filter(l => l.data === dataOggiStr && l.stato !== 'annullata');
                  
                  if (lezioniOggi.length === 0) return <div className="text-center py-20 text-slate-400 font-bold text-sm">Nessun impegno oggi. Goditi la giornata! 🌴</div>;
                  
                  return lezioniOggi.map(lez => renderLezioneCard(lez));
                })()}
              </div>
            )}

            {/* Render Settimana (Agenda List) */}
            {modalitaCalendario === 'settimana' && (
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-6">
                {getSettimana().map((giornoDate, idx) => {
                  const dataStr = formatDataIso(giornoDate);
                  const lezioniGiorno = mieLezioni.filter(l => l.data === dataStr && l.stato !== 'annullata');
                  
                  // Non mostriamo giorni vuoti se è passato, li mostriamo solo se hanno lezioni o se è oggi/futuro
                  const isOggi = dataStr === formatDataIso(new Date());
                  
                  if (lezioniGiorno.length === 0 && !isOggi) return null;

                  return (
                    <div key={idx} className="space-y-2">
                      <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1 ${isOggi ? 'text-amber-600 border-amber-300' : 'text-slate-400'}`}>
                        {nomeGiornoSettimana(giornoDate).substring(0,3)} {formatDataIT(dataStr).substring(0,5)}
                        {isOggi && <span className="bg-amber-500 text-white text-[8px] px-1.5 rounded">OGGI</span>}
                      </h4>
                      <div className="pl-2 border-l-2 border-slate-200 space-y-2">
                        {lezioniGiorno.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">Libero</p>
                        ) : (
                          lezioniGiorno.map(lez => (
                            <div key={lez.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                              <div>
                                <p className="text-[11px] font-black text-slate-800">{lez.materia}</p>
                                <p className="text-[10px] text-slate-500 font-bold">👤 {(lez.studentiIds || []).map(id => studenti.find(s => s.id === id)?.nome).join(', ')}</p>
                              </div>
                              <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{lez.oraInizio}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- VISTA: NUOVA LEZIONE --- */}
        {vistaAttiva === 'nuova_lezione' && (
          <div className="p-4 pb-20">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-amber-500"/> Nuova Lezione</h2>
              
              <form onSubmit={handleSalvaLezione} className="space-y-5">
                
                {insegnanteRef?.isCoordinatore && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4 space-y-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Titolare (Colonna Desk)</label>
                      <select className="w-full p-2.5 border border-amber-300 rounded-lg text-sm font-black bg-white text-slate-900" value={titolareSelezionato} onChange={e => { setTitolareSelezionato(e.target.value); if(e.target.value !== 'Gruppo') { setCoDocenti(coDocenti.filter(d => d.id !== e.target.value)); } }}>
                        <option value="Gruppo">📚 Gruppo Misto</option>
                        {tuttiInsegnanti.map(ins => (<option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome}</option>))}
                      </select>
                    </div>

                    <div className="pt-2 border-t border-amber-200">
                      <label className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Co-Docenti (Buste Paga)</label>
                      {coDocenti.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {coDocenti.map(doc => (
                            <span key={doc.id} className="bg-white text-slate-700 border border-slate-300 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                              {doc.cognome} <button type="button" onClick={() => toggleCoDocente(doc)}><X className="w-3 h-3 text-slate-400"/></button>
                            </span>
                          ))}
                        </div>
                      )}
                      <input type="text" placeholder="Cerca collega..." className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" value={ricercaDocente} onChange={e => setRicercaDocente(e.target.value)} />
                      {ricercaDocente.trim().length > 0 && (
                        <div className="mt-1 border border-amber-300 rounded-xl max-h-40 overflow-y-auto shadow-lg bg-white relative z-30">
                          {docentiFiltrati.length === 0 ? <div className="p-3 text-xs text-slate-400 text-center">Nessun risultato</div> : docentiFiltrati.map(doc => (
                            <div key={doc.id} onClick={() => toggleCoDocente(doc)} className="p-3 border-b border-slate-100 text-sm font-bold text-slate-700 hover:bg-amber-50 cursor-pointer">{doc.nome} {doc.cognome}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Allievi Presenti *</label>
                  {studentiSelezionati.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {studentiSelezionati.map(std => (
                        <span key={std.id} className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          {std.nome} <button type="button" onClick={() => toggleStudente(std)}><X className="w-3 h-3 text-slate-400"/></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input type="text" placeholder="Cerca studente..." className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-400 outline-none" value={ricercaStudente} onChange={e => setRicercaStudente(e.target.value)} />
                  {ricercaStudente.trim().length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-xl max-h-40 overflow-y-auto shadow-lg bg-white relative z-20">
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
                  <div className="col-span-2"><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Materia</label><input type="text" className="w-full p-3 border border-slate-300 rounded-xl bg-white text-sm font-medium" value={nuovaLezione.materia} onChange={e => setNuovaLezione({...nuovaLezione, materia: e.target.value})} placeholder="Es. Italiano" /></div>
                </div>

                {conflittiAttuali.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl space-y-1 animate-pulse">
                    <p className="text-xs font-black text-red-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Rilevati Conflitti nel Planning!</p>
                    <ul className="text-[11px] font-bold text-red-700 space-y-1 mt-2">{conflittiAttuali.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting || formNonValido} className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition mt-4 flex items-center justify-center gap-2 ${formNonValido ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}>
                  <CheckCircle className="w-5 h-5"/> {isSubmitting ? 'Salvataggio...' : (formNonValido ? 'Risolvi i conflitti' : 'Salva Lezione')}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV BAR (Fissa in basso per Mobile) */}
      <nav className="bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-safe absolute bottom-0 w-full z-50">
        <button onClick={() => setVistaAttiva('dashboard')} className={`flex flex-col items-center w-20 py-2 rounded-xl transition-colors ${vistaAttiva === 'dashboard' ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home className="w-5 h-5 mb-1"/>
          <span className="text-[10px] font-black tracking-wide">HOME</span>
        </button>
        
        <button onClick={() => setVistaAttiva('calendario')} className={`flex flex-col items-center w-20 py-2 rounded-xl transition-colors ${vistaAttiva === 'calendario' ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}>
          <CalendarDays className="w-5 h-5 mb-1"/>
          <span className="text-[10px] font-black tracking-wide">AGENDA</span>
        </button>

        <button onClick={() => setVistaAttiva('nuova_lezione')} className={`flex flex-col items-center w-20 py-2 rounded-xl transition-colors ${vistaAttiva === 'nuova_lezione' ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}>
          <PlusCircle className="w-5 h-5 mb-1"/>
          <span className="text-[10px] font-black tracking-wide">NUOVA</span>
        </button>
      </nav>

    </div>
  );
}
