import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, CreditCard, Clock, CheckCircle, 
  AlertCircle, Edit2, X, PlusCircle, History, Printer, Save, 
  FileText, Paperclip, ShieldCheck, Tag, Euro, Trash2, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import ModalePin from './ModalePin';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function DettaglioStudente({ 
  studente, 
  lezioni = [], 
  insegnanti = [], 
  onClose, 
  onUpdateLezioneCompleta, 
  onUpdateLezioneStatus,
  aggiungiLog
}) {
  const [activeTab, setActiveTab] = useState('contabilita'); // Default su contabilità per testare subito

  const [editStd, setEditStd] = useState({});
  const [isSavingProfilo, setIsSavingProfilo] = useState(false);

  useEffect(() => {
    if (studente) setEditStd(studente);
  }, [studente]);

  // Gestione modifica orari & prezzo lezione
  const [editingLezioneId, setEditingLezioneId] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    oraInizio: '', 
    oraFine: '', 
    data: '',
    prezzoPersonalizzato: ''
  });

  const [annullaConfig, setAnnullaConfig] = useState({ isOpen: false, lezioneId: null, tipo: 'gratuito', note: '' });
  const [pinConfig, setPinConfig] = useState({ isOpen: false, actionCallback: null, description: '' });

  // Stato Modale / Form Movimento (Entrata / Ricarica)
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

  // Calcolo ore delle lezioni
  const calcolaOre = (oraInizio, oraFine) => {
    if (!oraInizio || !oraFine) return 1;
    const [hInizio, mInizio] = oraInizio.split(':').map(Number);
    const [hFine, mFine] = oraFine.split(':').map(Number);
    const minuti = (hFine * 60 + mFine) - (hInizio * 60 + mInizio);
    return minuti > 0 ? minuti / 60 : 1;
  };

  // Tariffa oraria di default dello studente
  const tariffaBase = studente.haTariffaRiservata 
    ? Number(studente.tariffaRiservataValore || 18) 
    : (studente.categoriaTariffaria === 'elementari' ? 18 : studente.categoriaTariffaria === 'superiori' ? 26 : 22);

  // Lezioni dello studente
  const lezioniStudente = lezioni.filter(l => l && (l.studentiIds || []).includes(studente.id));
  const lezioniFuture = lezioniStudente.filter(l => l.stato === 'attiva' || l.stato === 'richiesta');
  const lezioniSvolte = lezioniStudente.filter(l => l.stato === 'svolta' || l.penaleApplicata);

  lezioniFuture.sort((a, b) => a.data.localeCompare(b.data) || (a.oraInizio || '').localeCompare(b.oraInizio || ''));
  lezioniSvolte.sort((a, b) => b.data.localeCompare(a.data) || (b.oraInizio || '').localeCompare(a.oraInizio || ''));

  // 1. Calcolo dinamico del Totale Versato (dallo storico ricariche)
  const storicoRicariche = studente.storicoRicariche || [];
  const totaleVersatoCalcolato = storicoRicariche.reduce((acc, mov) => acc + (Number(mov.importo || mov.pagato) || 0), 0);

  // 2. Calcolo dinamico del Totale Consumato (dalle lezioni svolte)
  const totaleConsumatoCalcolato = lezioniSvolte.reduce((acc, lez) => {
    if (lez.prezzoPersonalizzato !== undefined && lez.prezzoPersonalizzato !== null && lez.prezzoPersonalizzato !== '') {
      return acc + Number(lez.prezzoPersonalizzato);
    }
    const ore = calcolaOre(lez.oraInizio, lez.oraFine);
    return acc + (ore * tariffaBase);
  }, 0);

  // 3. Saldo Effettivo
  const saldoCalcolato = totaleVersatoCalcolato - totaleConsumatoCalcolato;

  const getNomeProf = (lez) => {
    const prof = insegnanti.find(i => i.id === lez.insegnanteId);
    if (lez.isGruppo && !lez.insegnanteId) return 'Gruppo Misto';
    return prof ? `${prof.nome} ${prof.cognome}` : 'Da assegnare';
  };

  // Salva Profilo Anagrafico
  const salvaProfilo = async (e) => {
    e.preventDefault();
    setIsSavingProfilo(true);
    try {
      await updateDoc(doc(db, 'studenti', studente.id), {
        ...editStd,
        totaleVersato: totaleVersatoCalcolato,
        totaleConsumato: totaleConsumatoCalcolato
      });
      if (aggiungiLog) aggiungiLog(`Aggiornata anagrafica: ${editStd.nome} ${editStd.cognome}`);
      alert("✅ Profilo salvato!");
    } catch (error) { 
      console.error(error); 
      alert("Errore salvataggio."); 
    } finally { 
      setIsSavingProfilo(false); 
    }
  };

  // Apertura Modifica Lezione
  const handleStartEdit = (lez) => {
    setEditingLezioneId(lez.id);
    setEditFormData({ 
      oraInizio: lez.oraInizio || '', 
      oraFine: lez.oraFine || '', 
      data: lez.data || '',
      prezzoPersonalizzato: lez.prezzoPersonalizzato !== undefined && lez.prezzoPersonalizzato !== null ? lez.prezzoPersonalizzato : ''
    });
  };

  // Salvataggio Modifica Lezione
  const handleSaveEdit = async () => {
    if (onUpdateLezioneCompleta) {
      await onUpdateLezioneCompleta({ 
        lezioneId: editingLezioneId, 
        oraInizio: editFormData.oraInizio, 
        oraFine: editFormData.oraFine, 
        data: editFormData.data,
        prezzoPersonalizzato: editFormData.prezzoPersonalizzato !== '' ? Number(editFormData.prezzoPersonalizzato) : null
      });
      if (aggiungiLog) aggiungiLog(`Modificata lezione ${editFormData.data} per ${studente.nome}`);
    }
    setEditingLezioneId(null);
  };

  // Annullamento Lezione
  const avviaAnnullamento = () => {
    setAnnullaConfig(prev => ({ ...prev, isOpen: false }));
    setPinConfig({
      isOpen: true,
      description: `Annullamento ${annullaConfig.tipo === 'penale' ? 'CON PENALE' : 'GRATUITO'}`,
      actionCallback: async () => {
        if (onUpdateLezioneStatus) {
          await onUpdateLezioneStatus(annullaConfig.lezioneId, 'annullata', annullaConfig.note, annullaConfig.tipo);
          if (aggiungiLog) aggiungiLog(`Lezione annullata per ${studente.nome}`);
        }
      }
    });
  };

  // GESTIONE MOVIMENTI CONTABILI (AGGIUNGI / MODIFICA)
  const handleSalvaMovimento = async (e) => {
    e.preventDefault();
    const importoNum = Number(movimentoForm.importo);
    if (isNaN(importoNum) || importoNum <= 0) return alert("Inserisci un importo valido.");

    const listaAggiornata = [...storicoRicariche];

    if (editingMovimentoIndex !== null) {
      // Modifica movimento esistente
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
      // Nuovo movimento
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

    const nuovoTotaleVersato = listaAggiornata.reduce((acc, m) => acc + (Number(m.importo || m.pagato) || 0), 0);

    try {
      await updateDoc(doc(db, 'studenti', studente.id), {
        storicoRicariche: listaAggiornata,
        totaleVersato: nuovoTotaleVersato
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
      alert("Errore durante il salvataggio del movimento.");
    }
  };

  // ELIMINAZIONE MOVIMENTO CONTABILE
  const handleEliminaMovimento = async (index) => {
    const mov = storicoRicariche[index];
    if (!window.confirm(`Vuoi cancellare il versamento di € ${Number(mov.importo || mov.pagato).toFixed(2)} del ${mov.data}?`)) return;

    const listaAggiornata = storicoRicariche.filter((_, i) => i !== index);
    const nuovoTotaleVersato = listaAggiornata.reduce((acc, m) => acc + (Number(m.importo || m.pagato) || 0), 0);

    try {
      await updateDoc(doc(db, 'studenti', studente.id), {
        storicoRicariche: listaAggiornata,
        totaleVersato: nuovoTotaleVersato
      });
    } catch (err) {
      console.error(err);
      alert("Errore durante l'eliminazione.");
    }
  };

  // APRI FORM MODIFICA MOVIMENTO
  const handleApriModificaMovimento = (index) => {
    const mov = storicoRicariche[index];
    setMovimentoForm({
      data: mov.data || new Date().toISOString().split('T')[0],
      importo: mov.importo || mov.pagato || '',
      causale: mov.causale || mov.tipoPacchetto || 'Ricarica Plafond',
      metodo: mov.metodo || 'Contanti',
      note: mov.note || ''
    });
    setEditingMovimentoIndex(index);
    setShowRicarica(true);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start pt-6 pb-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col border border-slate-200 overflow-hidden min-h-[620px] my-auto">
        
        {/* HEADER SCHEDA */}
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
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-slate-400 text-xs font-medium">
                <span className="capitalize">{studente.scuola || studente.categoriaTariffaria || 'Primaria'}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                  Tariffa base: {tariffaBase} €/h
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors bg-slate-800 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* NAVIGAZIONE TAB */}
        <div className="flex border-b border-gray-200 bg-slate-50 px-6 shrink-0">
          <button onClick={() => setActiveTab('contabilita')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'contabilita' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <CreditCard className="w-4 h-4 text-emerald-600"/> Contabilità & Estratto Conto
          </button>
          <button onClick={() => setActiveTab('lezioni')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'lezioni' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Calendar className="w-4 h-4"/> Lezioni Future ({lezioniFuture.length})
          </button>
          <button onClick={() => setActiveTab('profilo')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'profilo' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <User className="w-4 h-4"/> Profilo, Recapiti & GDPR
          </button>
        </div>

        {/* CONTENUTO TAB */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          
          {/* TAB: CONTABILITÀ & ESTRATTO CONTO TRASPARENTE */}
          {activeTab === 'contabilita' && (
            <div className="space-y-6">
              
              {/* I 3 QUADRANTI DI RIEPILOGO AUTOMATICI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border ${saldoCalcolato < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Saldo Attuale (Credito)</p>
                  <p className={`text-3xl font-black ${saldoCalcolato < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {saldoCalcolato > 0 ? '+' : ''}{saldoCalcolato.toFixed(2)} €
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400">Ricalcolato in tempo reale</span>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1 text-emerald-700">
                    <ArrowDownRight className="w-3.5 h-3.5"/> Totale Versato (+)
                  </p>
                  <p className="text-2xl font-black text-slate-800">{totaleVersatoCalcolato.toFixed(2)} €</p>
                  <span className="text-[10px] font-semibold text-slate-400">{storicoRicariche.length} versamenti registrati</span>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1 text-rose-700">
                    <ArrowUpRight className="w-3.5 h-3.5"/> Totale Consumato (-)
                  </p>
                  <p className="text-2xl font-black text-slate-800">{totaleConsumatoCalcolato.toFixed(2)} €</p>
                  <span className="text-[10px] font-semibold text-slate-400">{lezioniSvolte.length} lezioni svolte</span>
                </div>
              </div>

              {/* BARRA AZIONI CONTABILI */}
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Registro Pagamenti & Ricariche</span>
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
                  <PlusCircle className="w-4 h-4"/> + Aggiungi Versamento / Pacchetto
                </button>
              </div>

              {/* MODULO INSERIMENTO / MODIFICA MOVIMENTO */}
              {showRicarica && (
                <form onSubmit={handleSalvaMovimento} className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-emerald-900 uppercase">
                      {editingMovimentoIndex !== null ? '✏️ Modifica Versamento' : '➕ Registra Nuovo Pagamento / Pacchetto'}
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
                      <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Importo (€) *</label>
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
                      <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Causale / Tipo</label>
                      <input 
                        type="text" 
                        placeholder="Es. Pacchetto 10 ore, Acconto..."
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
                        <option>Bonifico</option>
                        <option>POS</option>
                        <option>Assegno</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Note aggiuntive (opzionale)" 
                      className="flex-1 p-2 text-xs bg-white border border-emerald-200 rounded-xl"
                      value={movimentoForm.note} 
                      onChange={e => setMovimentoForm({...movimentoForm, note: e.target.value})}
                    />
                    <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow hover:bg-slate-800">
                      {editingMovimentoIndex !== null ? 'Salva Modifica' : 'Conferma'}
                    </button>
                  </div>
                </form>
              )}

              {/* LISTA ESTRATTO CONTO MODIFICABILE */}
              <div className="space-y-2">
                {storicoRicariche.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-xs text-slate-400">
                    Nessun versamento registrato. Clicca su "+ Aggiungi Versamento" per ricaricare il credito.
                  </div>
                ) : (
                  storicoRicariche.map((mov, index) => (
                    <div key={index} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition text-xs shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                          €
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">+{Number(mov.importo || mov.pagato).toFixed(2)} €</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{mov.metodo || 'Contanti'}</span>
                            <span className="text-slate-600 font-bold">{mov.causale || mov.tipoPacchetto || 'Ricarica Plafond'}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Data: <b>{mov.data}</b> {mov.note && `• "${mov.note}"`}
                          </p>
                        </div>
                      </div>

                      {/* PULSANTI MODIFICA ED ELIMINA */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApriModificaMovimento(index)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition"
                          title="Modifica Versamento"
                        >
                          <Edit2 className="w-3.5 h-3.5"/>
                        </button>
                        <button
                          onClick={() => handleEliminaMovimento(index)}
                          className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                          title="Elimina Versamento"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* STORICO SCALO LEZIONI SVOLTE */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-700 uppercase mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-500"/> Storico Lezioni Svolte (Addebiti)
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {lezioniSvolte.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nessuna lezione svolta addebitata.</p>
                  ) : (
                    lezioniSvolte.map(lez => {
                      const ore = calcolaOre(lez.oraInizio, lez.oraFine);
                      const importoScalato = lez.prezzoPersonalizzato !== undefined && lez.prezzoPersonalizzato !== null && lez.prezzoPersonalizzato !== ''
                        ? Number(lez.prezzoPersonalizzato)
                        : (ore * tariffaBase);

                      return (
                        <div key={lez.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800">{lez.materia || 'Lezione'}</span>
                              <span className="text-[10px] text-slate-500">({ore}h con {getNomeProf(lez)})</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{lez.data} • {lez.oraInizio}-{lez.oraFine}</span>
                          </div>
                          <span className="font-black text-rose-600 text-sm">
                            -{importoScalato.toFixed(2)} €
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: LEZIONI PROGRAMMATE */}
          {activeTab === 'lezioni' && (
            <div className="space-y-4">
              {lezioniFuture.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-3xl bg-gray-50">
                  <p className="text-sm font-bold text-gray-500">Nessuna lezione futura in programma</p>
                </div>
              ) : (
                lezioniFuture.map(lez => (
                  <div key={lez.id} className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-black text-slate-900 text-base">{lez.materia || 'Lezione'}</span>
                          <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">{lez.stato}</span>
                          {lez.isGruppo && <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase">Gruppo</span>}
                          {lez.prezzoPersonalizzato !== undefined && lez.prezzoPersonalizzato !== null && (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <Tag className="w-3 h-3"/> Costo concordato: € {Number(lez.prezzoPersonalizzato).toFixed(2)}
                            </span>
                          )}
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
                                <Euro className="w-3.5 h-3.5 text-emerald-600"/> Importo addebitato (€):
                              </label>
                              <input 
                                type="number" 
                                step="0.5" 
                                placeholder="Lascia vuoto per tariffa oraria" 
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
                            <button onClick={() => handleStartEdit(lez)} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5"><Edit2 className="w-3.5 h-3.5"/> Modifica</button>
                            <button onClick={() => setAnnullaConfig({ isOpen: true, lezioneId: lez.id, tipo: 'gratuito', note: '' })} className="px-3 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors">Annulla</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: PROFILO, RECAPITI & GDPR */}
          {activeTab === 'profilo' && (
            <form onSubmit={salvaProfilo} className="space-y-6">
              
              {/* BOX CONSENSO PRIVACY & GDPR */}
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
                  <span className="text-[11px] font-bold text-amber-600 self-start sm:self-center">PDF non ancora archiviato</span>
                )}
              </div>

              {/* DATI ANAGRAFICI STUDENTE */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Anagrafica Studente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white" value={editStd.nome || ''} onChange={e => setEditStd({...editStd, nome: e.target.value})} required/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cognome</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white" value={editStd.cognome || ''} onChange={e => setEditStd({...editStd, cognome: e.target.value})} required/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Scuola Frequentata</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.scuola || ''} onChange={e => setEditStd({...editStd, scuola: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data di Nascita</label><input type="date" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.dataNascita || ''} onChange={e => setEditStd({...editStd, dataNascita: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Telefono Studente</label><input type="tel" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.telefono || ''} onChange={e => setEditStd({...editStd, telefono: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Studente</label><input type="email" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.email || ''} onChange={e => setEditStd({...editStd, email: e.target.value})}/></div>
                </div>
              </div>

              {/* DATI GENITORE / PAGATORE */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Intestatario Pagamenti (Genitore)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome e Cognome Genitore</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white" value={editStd.genitoreNome || ''} onChange={e => setEditStd({...editStd, genitoreNome: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Codice Fiscale Genitore</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm uppercase bg-white" value={editStd.codiceFiscale || ''} onChange={e => setEditStd({...editStd, codiceFiscale: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cellulare Genitore</label><input type="tel" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm bg-white" value={editStd.genitoreTelefono || ''} onChange={e => setEditStd({...editStd, genitoreTelefono: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email App & Ricevute</label><input type="email" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm text-blue-700 bg-white" value={editStd.genitoreEmail || ''} onChange={e => setEditStd({...editStd, genitoreEmail: e.target.value})}/></div>
                </div>
              </div>

              {/* TARIFFE SUGGERITE */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4"/> Inquadramento Tariffario Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Categoria Scolastica</label>
                    <select className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white" value={editStd.categoriaTariffaria || 'elementari'} onChange={e => setEditStd({...editStd, categoriaTariffaria: e.target.value})}>
                      <option value="elementari">Primaria (18 €/h)</option>
                      <option value="medie">Secondaria I grado (22 €/h)</option>
                      <option value="superiori">Secondaria II grado (26 €/h)</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-2 p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500" checked={editStd.haTariffaRiservata || false} onChange={e => setEditStd({...editStd, haTariffaRiservata: e.target.checked})}/>
                      <span className="text-xs font-bold text-slate-700">Applica Tariffa Oraria Riservata</span>
                    </label>
                  </div>
                  {editStd.haTariffaRiservata && (
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Tariffa Oraria Convenzionata (€/h)</label>
                      <input type="number" step="0.5" className="w-full md:w-1/2 p-2.5 rounded-xl border border-amber-300 bg-amber-50 font-black text-sm text-slate-900" value={editStd.tariffaRiservataValore || ''} onChange={e => setEditStd({...editStd, tariffaRiservataValore: e.target.value})}/>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSavingProfilo} className="px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2">
                  <Save className="w-4 h-4"/> Salva Modifiche Profilo
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* MODALE CONFERMA ANNULLAMENTO */}
      {annullaConfig.isOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-rose-600"/> Annulla Lezione</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Tipo di Annullamento</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900" value={annullaConfig.tipo} onChange={(e) => setAnnullaConfig({...annullaConfig, tipo: e.target.value})}>
                  <option value="gratuito">Annullamento Gratuito</option>
                  <option value="penale">Addebita Penale (100%)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Motivazione</label>
                <input type="text" placeholder="Es. Malattia, assenza..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium" value={annullaConfig.note} onChange={(e) => setAnnullaConfig({...annullaConfig, note: e.target.value})}/>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => setAnnullaConfig({...annullaConfig, isOpen: false})} className="px-4 py-2 bg-gray-100 font-bold rounded-xl text-xs">Indietro</button>
              <button onClick={avviaAnnullamento} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs">Procedi all'Annullamento</button>
            </div>
          </div>
        </div>
      )}

      <ModalePin isOpen={pinConfig.isOpen} descrizione={pinConfig.description} onClose={() => setPinConfig({ isOpen: false, actionCallback: null, description: '' })} onSuccess={() => { if (pinConfig.actionCallback) pinConfig.actionCallback(); setPinConfig({ isOpen: false, actionCallback: null, description: '' }); }} />
    </div>
  );
}
