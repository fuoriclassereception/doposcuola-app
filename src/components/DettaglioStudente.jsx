import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Mail, Phone, Calendar, CreditCard, Clock, CheckCircle, 
  AlertCircle, Edit2, X, PlusCircle, History, Save, 
  FileText, ShieldCheck, Tag, Euro, Trash2, ArrowDownRight, ArrowUpRight,
  TrendingDown, TrendingUp, Check, AlertTriangle, Smartphone, Key, Share2, Copy, Send
} from 'lucide-react';
import ModalePin from './ModalePin';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  calcolaDurataOre, 
  getTariffaOrariaStudente, 
  calcolaCostoLezione, 
  generaEstrattoConto 
} from '../utils/pricing';

export default function DettaglioStudente({ 
  studente: initialStudente, 
  lezioni = [], 
  insegnanti = [], 
  onClose, 
  aggiungiLog
}) {
  const [activeTab, setActiveTab] = useState('contabilita');

  // STATO STUDENTE IN TEMPO REALE
  const [studente, setStudente] = useState(initialStudente);
  const [editStd, setEditStd] = useState(initialStudente || {});
  const [isSavingProfilo, setIsSavingProfilo] = useState(false);
  const [copiato, setCopiato] = useState(false);

  useEffect(() => {
    if (!initialStudente?.id) return;
    const unsub = onSnapshot(doc(db, 'studenti', initialStudente.id), (docSnap) => {
      if (docSnap.exists()) {
        const liveData = { id: docSnap.id, ...docSnap.data() };
        setStudente(liveData);
        setEditStd(liveData);
      }
    });
    return () => unsub();
  }, [initialStudente?.id]);

  // Gestione modifica singola lezione
  const [editingLezioneId, setEditingLezioneId] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    oraInizio: '', 
    oraFine: '', 
    data: '',
    prezzoPersonalizzato: ''
  });

  // GESTIONE ANNULLAMENTO E PIN
  const [showAnnullaPopup, setShowAnnullaPopup] = useState(false);
  const [lezioneTarget, setLezioneTarget] = useState(null);
  const [tipoAnnullamento, setTipoAnnullamento] = useState('gratuito');
  const [noteAnnullamento, setNoteAnnullamento] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Form Versamento / Ricarica Plafond
  const [showRicarica, setShowRicarica] = useState(false);
  const [editingMovimentoIndex, setEditingMovimentoIndex] = useState(null);
  const [movimentoForm, setMovimentoForm] = useState({
    data: new Date().toISOString().split('T')[0],
    importo: '',
    causale: 'Ricarica Plafond',
    metodo: 'Contanti',
    note: ''
  });

  if (!studente) return null;

  const tariffaBase = getTariffaOrariaStudente(studente, false);

  // ESTRATTO CONTO UNIFICATO CALCOLATO DAL MOTORE
  const estrattoConto = useMemo(() => {
    return generaEstrattoConto(studente, lezioni);
  }, [studente, lezioni]);

  const lezioniStudente = lezioni.filter(l => l && (l.studentiIds || []).includes(studente.id));
  const lezioniFuture = lezioniStudente.filter(l => l.stato === 'attiva' || l.stato === 'richiesta');
  lezioniFuture.sort((a, b) => (a.data || '').localeCompare(b.data || '') || (a.oraInizio || '').localeCompare(b.oraInizio || ''));

  const getNomeProf = (lez) => {
    const prof = insegnanti.find(i => i.id === lez.insegnanteId);
    if (lez.isGruppo && !lez.insegnanteId) return 'Gruppo Misto';
    return prof ? `${prof.nome} ${prof.cognome}` : 'Da assegnare';
  };

  // Salva Profilo Studente
  const salvaProfilo = async (e) => {
    e.preventDefault();
    setIsSavingProfilo(true);
    try {
      await updateDoc(doc(db, 'studenti', studente.id), {
        ...editStd,
        totaleVersato: estrattoConto.totaleVersato,
        totaleConsumato: estrattoConto.totaleConsumato,
        saldoAttuale: estrattoConto.saldo
      });
      if (aggiungiLog) aggiungiLog(`Modificata anagrafica: ${editStd.nome} ${editStd.cognome}`);
      alert("✅ Profilo salvato!");
    } catch (error) { 
      console.error(error); 
      alert("Errore salvataggio profilo."); 
    } finally { 
      setIsSavingProfilo(false); 
    }
  };

  // Modifica singola lezione con override prezzo
  const handleStartEdit = (lez) => {
    setEditingLezioneId(lez.id);
    setEditFormData({ 
      oraInizio: lez.oraInizio || '', 
      oraFine: lez.oraFine || '', 
      data: lez.data || '',
      prezzoPersonalizzato: lez.prezzoPersonalizzato !== undefined && lez.prezzoPersonalizzato !== null ? lez.prezzoPersonalizzato : ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        oraInizio: editFormData.oraInizio, 
        oraFine: editFormData.oraFine, 
        data: editFormData.data,
        prezzoPersonalizzato: editFormData.prezzoPersonalizzato !== '' ? Number(editFormData.prezzoPersonalizzato) : null
      };

      await updateDoc(doc(db, 'lezioni', editingLezioneId), payload);
      if (aggiungiLog) aggiungiLog(`Modificata lezione del ${editFormData.data} per ${studente.nome}`);
      setEditingLezioneId(null);
    } catch (err) {
      console.error("Errore modifica:", err);
      alert("Errore durante la modifica della lezione.");
    }
  };

  // Annullamento protetto da PIN
  const handleAvviaAnnullamento = (lezione) => {
    setLezioneTarget(lezione);
    setTipoAnnullamento('gratuito');
    setNoteAnnullamento('');
    setShowAnnullaPopup(true);
  };

  const handleConfermaTipoAnnullamento = () => {
    setShowAnnullaPopup(false);
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    if (!lezioneTarget) return;

    try {
      const costoSnapshot = calcolaCostoLezione(lezioneTarget, studente);

      await updateDoc(doc(db, 'lezioni', lezioneTarget.id), {
        stato: 'annullata',
        tipoAnnullamento: tipoAnnullamento,
        penaleApplicata: tipoAnnullamento === 'penale',
        prezzoApplicato: tipoAnnullamento === 'penale' ? costoSnapshot : 0,
        noteAnnullamento: noteAnnullamento || '',
        dataAnnullamento: serverTimestamp()
      });

      if (aggiungiLog) {
        aggiungiLog(`Lezione annullata (${tipoAnnullamento}) per ${studente.nome}`);
      }
      alert(`✅ Lezione annullata (${tipoAnnullamento === 'penale' ? 'con penale 100%' : 'gratuita'}).`);
    } catch (err) {
      console.error("Errore Firebase:", err);
      alert("Errore durante l'annullamento.");
    } finally {
      setLezioneTarget(null);
    }
  };

  // Segna Lezione come Svolta congelando il prezzo snapshot
  const handleSegnaSvolta = async (lezione) => {
    const costoSnapshot = calcolaCostoLezione(lezione, studente);
    try {
      await updateDoc(doc(db, 'lezioni', lezione.id), {
        stato: 'svolta',
        prezzoApplicato: costoSnapshot,
        dataSvolgimento: serverTimestamp()
      });
      if (aggiungiLog) aggiungiLog(`Segnata svolta lezione di ${lezione.materia} per ${studente.nome} (€ ${costoSnapshot})`);
    } catch (err) {
      console.error(err);
      alert("Errore registrazione presenza.");
    }
  };

  // Salva Pagamento / Versamento Plafond
  const handleSalvaMovimento = async (e) => {
    e.preventDefault();
    const importoNum = Number(movimentoForm.importo);
    if (isNaN(importoNum) || importoNum <= 0) return alert("Inserisci un importo valido.");

    const listaAggiornata = [...(studente.storicoRicariche || [])];

    if (editingMovimentoIndex !== null) {
      listaAggiornata[editingMovimentoIndex] = {
        ...listaAggiornata[editingMovimentoIndex],
        data: movimentoForm.data,
        importo: importoNum,
        pagato: importoNum,
        causale: movimentoForm.causale,
        metodo: movimentoForm.metodo,
        note: movimentoForm.note
      };
    } else {
      listaAggiornata.unshift({
        id: `mov_${Date.now()}`,
        data: movimentoForm.data,
        importo: importoNum,
        pagato: importoNum,
        causale: movimentoForm.causale || 'Ricarica Plafond',
        metodo: movimentoForm.metodo,
        note: movimentoForm.note || ''
      });
    }

    try {
      await updateDoc(doc(db, 'studenti', studente.id), {
        storicoRicariche: listaAggiornata
      });
      setShowRicarica(false);
      setEditingMovimentoIndex(null);
      setMovimentoForm({
        data: new Date().toISOString().split('T')[0],
        importo: '',
        causale: 'Ricarica Plafond',
        metodo: 'Contanti',
        note: ''
      });
    } catch (err) {
      console.error(err);
      alert("Errore salvataggio movimento.");
    }
  };

  const handleEliminaMovimento = async (index) => {
    const storico = studente.storicoRicariche || [];
    const mov = storico[index];
    if (!window.confirm(`Vuoi cancellare il versamento di € ${Number(mov.importo ?? mov.pagato).toFixed(2)} del ${mov.data}?`)) return;

    const listaAggiornata = storico.filter((_, i) => i !== index);

    try {
      await updateDoc(doc(db, 'studenti', studente.id), {
        storicoRicariche: listaAggiornata
      });
    } catch (err) {
      console.error(err);
      alert("Errore eliminazione versamento.");
    }
  };

  // FUNZIONI INVIO LINK APP & PRIMO ACCESSO
  const baseUrlApp = window.location.origin;
  const emailDestinatario = editStd.genitoreEmail || editStd.email || '';
  const telefonoDestinatario = (editStd.genitoreTelefono || editStd.telefono || '').replace(/\D/g, '');

  const testoInvito = `Ciao ${editStd.genitoreNome || editStd.nome}! Ecco il link per accedere alla tua area personale di FuoriClasse:\n${baseUrlApp}\n\nAccedi inserendo la tua email: ${emailDestinatario}\nDa qui puoi controllare il calendario delle lezioni, il saldo del plafond e richiedere nuove lezioni!`;

  const handleInviaWhatsApp = () => {
    if (!telefonoDestinatario) return alert("Inserisci prima il numero di cellulare nelle informazioni di contatto.");
    const url = `https://wa.me/39${telefonoDestinatario}?text=${encodeURIComponent(testoInvito)}`;
    window.open(url, '_blank');
  };

  const handleInviaEmail = () => {
    if (!emailDestinatario) return alert("Inserisci prima l'indirizzo email nelle informazioni di contatto.");
    const subject = encodeURIComponent("Accesso all'App FuoriClasse");
    const body = encodeURIComponent(testoInvito);
    window.open(`mailto:${emailDestinatario}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopiaLink = () => {
    navigator.clipboard.writeText(baseUrlApp);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2500);
  };

  const handleToggleAppAttivata = async () => {
    try {
      const nuovoStato = !(studente.appAttivata !== false);
      await updateDoc(doc(db, 'studenti', studente.id), { appAttivata: nuovoStato });
      if (aggiungiLog) aggiungiLog(`App ${nuovoStato ? 'attivata' : 'disattivata'} per ${studente.nome}`);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start pt-6 pb-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col border border-slate-200 overflow-hidden min-h-[620px] my-auto">
        
        {/* HEADER STUDENTE */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-400 text-slate-900 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
              {studente.nome?.charAt(0)}{studente.cognome?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3">
                {studente.nome} {studente.cognome}
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${studente.attivo !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {studente.attivo !== false ? 'Iscritto' : 'Inattivo'}
                </span>
                {studente.appAttivata !== false && (
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">
                    App Attiva
                  </span>
                )}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-slate-400 text-xs font-medium">
                <span className="capitalize">{studente.scuola || studente.categoriaTariffaria || 'Medie'}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                  Listino Base: {tariffaBase} €/h {studente.haTariffaRiservata ? '(Convenzione)' : ''}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors bg-slate-800 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200 bg-slate-50 px-6 shrink-0">
          <button onClick={() => setActiveTab('contabilita')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'contabilita' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <CreditCard className="w-4 h-4 text-emerald-600"/> Estratto Conto & Plafond
          </button>
          <button onClick={() => setActiveTab('lezioni')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'lezioni' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Calendar className="w-4 h-4"/> Lezioni Programmate ({lezioniFuture.length})
          </button>
          <button onClick={() => setActiveTab('profilo')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'profilo' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <User className="w-4 h-4"/> Profilo, App & GDPR
          </button>
        </div>

        {/* CONTENUTO */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          
          {/* TAB 1: ESTRATTO CONTO UNIFICATO */}
          {activeTab === 'contabilita' && (
            <div className="space-y-6">
              
              {/* CRUSCOTTO SALDO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border ${estrattoConto.saldo < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Saldo Attuale Plafond</p>
                  <p className={`text-3xl font-black ${estrattoConto.saldo < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {estrattoConto.saldo > 0 ? '+' : ''}{estrattoConto.saldo.toFixed(2)} €
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-1">
                    {estrattoConto.saldo < 0 ? <AlertTriangle className="w-3 h-3 text-red-500"/> : <Check className="w-3 h-3 text-emerald-500"/>}
                    {estrattoConto.saldo < 0 ? 'Credito esaurito (a debito)' : 'Disponibilità per prossime lezioni'}
                  </span>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1 text-emerald-700">
                    <ArrowDownRight className="w-3.5 h-3.5"/> Totale Versato (+)
                  </p>
                  <p className="text-2xl font-black text-slate-800">{estrattoConto.totaleVersato.toFixed(2)} €</p>
                  <span className="text-[10px] font-semibold text-slate-400">Ricariche effettuate</span>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1 text-rose-700">
                    <ArrowUpRight className="w-3.5 h-3.5"/> Totale Consumato (-)
                  </p>
                  <p className="text-2xl font-black text-slate-800">{estrattoConto.totaleConsumato.toFixed(2)} €</p>
                  <span className="text-[10px] font-semibold text-slate-400">Lezioni svolte o con penale</span>
                </div>
              </div>

              {/* PULSANTE AGGIUNGI VERSAMENTO */}
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Estratto Conto Cronologico (Borsellino)</span>
                <button
                  onClick={() => {
                    setEditingMovimentoIndex(null);
                    setMovimentoForm({
                      data: new Date().toISOString().split('T')[0],
                      importo: '',
                      causale: 'Ricarica Plafond',
                      metodo: 'Contanti',
                      note: ''
                    });
                    setShowRicarica(!showRicarica);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4"/> + Registra Incasso / Versamento
                </button>
              </div>

              {/* FORM VERSAMENTO */}
              {showRicarica && (
                <form onSubmit={handleSalvaMovimento} className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-emerald-900 uppercase">
                      {editingMovimentoIndex !== null ? '✏️ Modifica Versamento' : '➕ Registra Incasso Genitore'}
                    </h4>
                    <button type="button" onClick={() => setShowRicarica(false)} className="text-xs text-slate-400 hover:text-slate-600">Chiudi</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Data</label>
                      <input 
                        type="date" 
                        required 
                        className="w-full p-2 text-xs font-bold bg-white border border-emerald-200 rounded-xl"
                        value={movimentoForm.data} 
                        onChange={e => setMovimentoForm({...movimentoForm, data: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Importo Incassato (€) *</label>
                      <input 
                        type="number" 
                        step="0.5" 
                        required 
                        placeholder="Es. 150"
                        className="w-full p-2 text-xs font-bold bg-white border border-emerald-200 rounded-xl"
                        value={movimentoForm.importo} 
                        onChange={e => setMovimentoForm({...movimentoForm, importo: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Causale</label>
                      <input 
                        type="text" 
                        placeholder="Es. Ricarica Plafond, Acconto..."
                        className="w-full p-2 text-xs font-medium bg-white border border-emerald-200 rounded-xl"
                        value={movimentoForm.causale} 
                        onChange={e => setMovimentoForm({...movimentoForm, causale: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Metodo</label>
                      <select 
                        className="w-full p-2 text-xs font-bold bg-white border border-emerald-200 rounded-xl"
                        value={movimentoForm.metodo} 
                        onChange={e => setMovimentoForm({...movimentoForm, metodo: e.target.value})}
                      >
                        <option>Contanti</option>
                        <option>POS</option>
                        <option>Bonifico</option>
                        <option>Assegno</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Note o estremi ricevuta (opzionale)" 
                      className="flex-1 p-2 text-xs bg-white border border-emerald-200 rounded-xl"
                      value={movimentoForm.note} 
                      onChange={e => setMovimentoForm({...movimentoForm, note: e.target.value})}
                    />
                    <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow hover:bg-slate-800">
                      Conferma e Ricarica Plafond
                    </button>
                  </div>
                </form>
              )}

              {/* LISTA MOVIMENTI */}
              <div className="space-y-2">
                {estrattoConto.movimenti.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-xs text-slate-400">
                    Nessun movimento registrato. Inserisci un versamento iniziale per caricare il plafond.
                  </div>
                ) : (
                  estrattoConto.movimenti.map((m) => {
                    const isAccredito = m.tipo === 'accredito';

                    return (
                      <div key={m.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition text-xs shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${isAccredito ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {isAccredito ? '+' : '-'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-sm ${isAccredito ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {isAccredito ? `+${m.variazione.toFixed(2)} €` : `${m.variazione.toFixed(2)} €`}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{m.metodo}</span>
                              <span className="text-slate-700 font-bold">{m.descrizione}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Data: <b>{m.data}</b> {m.note && `• "${m.note}"`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo</span>
                            <span className={`font-black text-xs ${m.saldoProgressivo < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                              {m.saldoProgressivo.toFixed(2)} €
                            </span>
                          </div>

                          {isAccredito && (
                            <button
                              onClick={() => handleEliminaMovimento(m.indiceRicarica)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                              title="Elimina Versamento"
                            >
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 2: LEZIONI PROGRAMMATE */}
          {activeTab === 'lezioni' && (
            <div className="space-y-4">
              {lezioniFuture.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-3xl bg-gray-50">
                  <p className="text-sm font-bold text-gray-500">Nessuna lezione futura in programma</p>
                </div>
              ) : (
                lezioniFuture.map(lez => {
                  const costoPrevisto = calcolaCostoLezione(lez, studente);
                  const ore = calcolaDurataOre(lez.oraInizio, lez.oraFine);

                  return (
                    <div key={lez.id} className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-black text-slate-900 text-base">{lez.materia || 'Lezione'}</span>
                            <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">{lez.stato}</span>
                            {lez.isGruppo && <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase">Gruppo</span>}
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              <Euro className="w-3 h-3"/> Costo addebito previsto: € {costoPrevisto.toFixed(2)} ({ore}h)
                            </span>
                          </div>

                          {editingLezioneId === lez.id ? (
                            <div className="space-y-2 mt-2 bg-white p-3 rounded-xl border border-slate-200">
                              <div className="flex flex-wrap items-center gap-2">
                                <input type="date" className="text-xs font-bold bg-slate-50 border border-slate-300 rounded p-2" value={editFormData.data} onChange={(e) => setEditFormData({...editFormData, data: e.target.value})}/>
                                <input type="time" className="text-xs font-bold bg-slate-50 border border-slate-300 rounded p-2" value={editFormData.oraInizio} onChange={(e) => setEditFormData({...editFormData, oraInizio: e.target.value})}/>
                                <span className="text-slate-400">-</span>
                                <input type="time" className="text-xs font-bold bg-slate-50 border border-slate-300 rounded p-2" value={editFormData.oraFine} onChange={(e) => setEditFormData({...editFormData, oraFine: e.target.value})}/>
                              </div>
                              
                              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                  <Tag className="w-3.5 h-3.5 text-emerald-600"/> Prezzo concordato forfettario (€):
                                </label>
                                <input 
                                  type="number" 
                                  step="0.5" 
                                  placeholder="Lascia vuoto per calcolo orario" 
                                  className="text-xs p-1.5 border border-slate-300 rounded w-48 font-bold"
                                  value={editFormData.prezzoPersonalizzato}
                                  onChange={(e) => setEditFormData({ ...editFormData, prezzoPersonalizzato: e.target.value })}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-slate-600 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 text-blue-700 shadow-sm"><User className="w-3.5 h-3.5"/> {getNomeProf(lez)}</span>
                              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-200"><Calendar className="w-3.5 h-3.5 text-amber-500"/> {lez.data}</span>
                              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-200"><Clock className="w-3.5 h-3.5 text-amber-500"/> {lez.oraInizio} - {lez.oraFine}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 self-end md:self-center">
                          {editingLezioneId === lez.id ? (
                            <>
                              <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Salva</button>
                              <button onClick={() => setEditingLezioneId(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl">Annulla</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleSegnaSvolta(lez)} className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm" title="Segna presenza e scala l'importo congelato">
                                <Check className="w-3.5 h-3.5"/> Segna Svolta
                              </button>
                              <button onClick={() => handleStartEdit(lez)} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                                <Edit2 className="w-3.5 h-3.5"/> Modifica
                              </button>
                              <button onClick={() => handleAvviaAnnullamento(lez)} className="px-3 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors">
                                Annulla
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: PROFILO, APP, CONVENZIONI E GDPR */}
          {activeTab === 'profilo' && (
            <div className="space-y-6">

              {/* SEZIONE SPECIALE: ACCESSO APP FAMIGLIA & INVITO RAPIDO */}
              <div className="bg-sky-50 border border-sky-200 p-5 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md">
                      <Smartphone className="w-5 h-5"/>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        Area Personale & App Genitore
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${studente.appAttivata !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {studente.appAttivata !== false ? 'Attiva' : 'Disattivata'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-sky-800 mt-0.5">
                        Consente a genitore e allievo di visualizzare calendario, saldo plafond e inviare richieste.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAppAttivata}
                    className="px-3.5 py-1.5 bg-white border border-sky-300 text-sky-900 rounded-xl text-xs font-bold hover:bg-sky-100 transition self-start sm:self-center"
                  >
                    {studente.appAttivata !== false ? 'Disattiva Accesso' : 'Abilita Accesso'}
                  </button>
                </div>

                {/* PULSANTI INVIO CREDENZIALI & PRIMO ACCESSO */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleInviaWhatsApp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5"/> Invia Invito App via WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={handleInviaEmail}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition"
                  >
                    <Mail className="w-3.5 h-3.5"/> Invia Email di Benvenuto
                  </button>

                  <button
                    type="button"
                    onClick={handleCopiaLink}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500"/>
                    {copiato ? 'Link Copiato negli Appunti!' : 'Copia Link App'}
                  </button>
                </div>

                <div className="bg-white/80 p-3 rounded-2xl border border-sky-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <Key className="w-4 h-4 text-sky-600 shrink-0"/>
                  <span>
                    Email di accesso impostata: <b className="text-slate-900">{emailDestinatario || 'Nessuna email registrata (inseriscila sotto)'}</b>
                  </span>
                </div>
              </div>
              
              <form onSubmit={salvaProfilo} className="space-y-6">

                {/* ACCORDO ECONOMICO PERSONALIZZATO */}
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-700"/>
                    <h4 className="text-xs font-black text-amber-950 uppercase">Accordo Economico / Tariffa Riservata Studente</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={Boolean(editStd.haTariffaRiservata)} 
                        onChange={(e) => setEditStd({...editStd, haTariffaRiservata: e.target.checked})}
                        className="rounded text-amber-500 w-4 h-4"
                      />
                      Applica Tariffa Convenzionata Fissa
                    </label>

                    {editStd.haTariffaRiservata && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="0.5" 
                          value={editStd.tariffaRiservataValore || ''} 
                          onChange={(e) => setEditStd({...editStd, tariffaRiservataValore: Number(e.target.value)})}
                          placeholder="Es. 20" 
                          className="p-1.5 text-xs font-bold border border-amber-300 rounded-lg w-24 bg-white"
                        />
                        <span className="text-xs font-bold text-amber-900">€/ora</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* STATO CONSENSO GDPR */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${studente.gdprConfermato ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      <ShieldCheck className="w-5 h-5"/>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Stato Consenso GDPR & Privacy</h4>
                      <p className="text-[11px] text-slate-500">
                        {studente.gdprConfermato 
                          ? `Firmato regolarmente da: ${studente.gdprEmailFirmatario || studente.genitoreEmail || 'Genitore'}` 
                          : 'In attesa di firma da parte del genitore'}
                      </p>
                    </div>
                  </div>
                  {studente.gdprPdfUrl ? (
                    <a 
                      href={studente.gdprPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition"
                    >
                      <FileText className="w-4 h-4"/> Scarica PDF Firmato
                    </a>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600 self-start sm:self-center">PDF non archiviato</span>
                  )}
                </div>

                {/* ANAGRAFICA */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Anagrafica Studente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white" value={editStd.nome || ''} onChange={e => setEditStd({...editStd, nome: e.target.value})} required/></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cognome</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white" value={editStd.cognome || ''} onChange={e => setEditStd({...editStd, cognome: e.target.value})} required/></div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Grado Scolastico / Listino</label>
                      <select className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white" value={editStd.categoriaTariffaria || editStd.scuola || 'medie'} onChange={e => setEditStd({...editStd, categoriaTariffaria: e.target.value, scuola: e.target.value})}>
                        <option value="elementari">Elementari / Primaria (18 €/h)</option>
                        <option value="medie">Medie / Secondaria I grado (22 €/h)</option>
                        <option value="superiori">Superiori / Secondaria II grado (26 €/h)</option>
                        <option value="universita">Università (30 €/h)</option>
                      </select>
                    </div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data di Nascita</label><input type="date" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.dataNascita || ''} onChange={e => setEditStd({...editStd, dataNascita: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Telefono Studente</label><input type="tel" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.telefono || ''} onChange={e => setEditStd({...editStd, telefono: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Studente</label><input type="email" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.email || ''} onChange={e => setEditStd({...editStd, email: e.target.value})}/></div>
                  </div>
                </div>

                {/* GENITORE */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Intestatario Pagamenti (Genitore)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome Genitore</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white" value={editStd.genitoreNome || ''} onChange={e => setEditStd({...editStd, genitoreNome: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Codice Fiscale Genitore</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm uppercase bg-white" value={editStd.codiceFiscale || ''} onChange={e => setEditStd({...editStd, codiceFiscale: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cellulare Genitore</label><input type="tel" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.genitoreTelefono || ''} onChange={e => setEditStd({...editStd, genitoreTelefono: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email App & Ricevute</label><input type="email" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm text-blue-700 bg-white" value={editStd.genitoreEmail || ''} onChange={e => setEditStd({...editStd, genitoreEmail: e.target.value})}/></div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button type="submit" disabled={isSavingProfilo} className="px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition shadow flex items-center gap-2">
                    <Save className="w-4 h-4"/> Salva Modifiche Profilo
                  </button>
                </div>
              </form>

            </div>
          )}

        </div>
      </div>

      {/* POPUP SCELTA TIPO ANNULLAMENTO */}
      {showAnnullaPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600"/> Annulla Lezione
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Tipo di Annullamento</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900" 
                  value={tipoAnnullamento} 
                  onChange={(e) => setTipoAnnullamento(e.target.value)}
                >
                  <option value="gratuito">Annullamento Gratuito (0 €)</option>
                  <option value="penale">Addebita Penale (100% dell'importo)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Motivazione</label>
                <input 
                  type="text" 
                  placeholder="Es. Malattia, disdetta tardiva..." 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium" 
                  value={noteAnnullamento} 
                  onChange={(e) => setNoteAnnullamento(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button 
                onClick={() => { setShowAnnullaPopup(false); setLezioneTarget(null); }} 
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl text-xs"
              >
                Indietro
              </button>
              <button 
                onClick={handleConfermaTipoAnnullamento} 
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs"
              >
                Procedi con il PIN ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALEPIN CENTRALIZZATA */}
      <ModalePin
        isOpen={showPinModal}
        descrizione={`Annullamento ${tipoAnnullamento === 'penale' ? 'CON PENALE' : 'GRATUITO'}`}
        onClose={() => { setShowPinModal(false); setLezioneTarget(null); }}
        onSuccess={handlePinSuccess}
      />

    </div>
  );
}
