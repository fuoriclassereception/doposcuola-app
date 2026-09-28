import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, CreditCard, Clock, CheckCircle, AlertCircle, Edit2, X, PlusCircle, History, Printer, Save, FileText, Paperclip } from 'lucide-react';
import ModalePin from './ModalePin';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function DettaglioStudente({ 
  studente, 
  lezioni = [], 
  insegnanti = [], // <-- Ora riceviamo i prof!
  onClose, 
  onUpdateLezioneCompleta, 
  onUpdateLezioneStatus,
  onRicaricaPacchetto,
  aggiungiLog
}) {
  const [activeTab, setActiveTab] = useState('lezioni'); 

  const [editStd, setEditStd] = useState({});
  const [isSavingProfilo, setIsSavingProfilo] = useState(false);

  useEffect(() => {
    if (studente) setEditStd(studente);
  }, [studente]);

  const [editingLezioneId, setEditingLezioneId] = useState(null);
  const [editFormData, setEditFormData] = useState({ oraInizio: '', oraFine: '', data: '' });
  const [annullaConfig, setAnnullaConfig] = useState({ isOpen: false, lezioneId: null, tipo: 'gratuito', note: '' });
  const [pinConfig, setPinConfig] = useState({ isOpen: false, actionCallback: null, description: '' });

  const [showRicarica, setShowRicarica] = useState(false);
  const [ricaricaData, setRicaricaData] = useState({
    costoDaAggiungere: '', pagatoDaAggiungere: '', metodoPagamento: 'Contanti',
    tariffaApplicata: studente?.haTariffaRiservata ? studente.tariffaRiservataValore : (studente?.categoriaTariffaria === 'elementari' ? 18 : studente?.categoriaTariffaria === 'superiori' ? 26 : 22),
    note: ''
  });

  if (!studente) return null;

  const lezioniStudente = lezioni.filter(l => l && (l.studentiIds || []).includes(studente.id));
  const lezioniFuture = lezioniStudente.filter(l => l.stato === 'attiva' || l.stato === 'richiesta');
  const lezioniPassate = lezioniStudente.filter(l => l.stato !== 'attiva' && l.stato !== 'richiesta');

  lezioniFuture.sort((a, b) => a.data.localeCompare(b.data) || (a.oraInizio || '').localeCompare(b.oraInizio || ''));
  lezioniPassate.sort((a, b) => b.data.localeCompare(a.data) || (b.oraInizio || '').localeCompare(a.oraInizio || ''));

  // Funzione per ricavare il nome del prof formattato
  const getNomeProf = (lez) => {
    const prof = insegnanti.find(i => i.id === lez.insegnanteId);
    if (lez.isGruppo && !lez.insegnanteId) return 'Gruppo Misto';
    return prof ? `${prof.nome} ${prof.cognome}` : 'Da assegnare';
  };

  const salvaProfilo = async (e) => {
    e.preventDefault();
    setIsSavingProfilo(true);
    try {
      await updateDoc(doc(db, 'studenti', studente.id), editStd);
      if (aggiungiLog) aggiungiLog(`Modificata anagrafica studente: ${editStd.nome} ${editStd.cognome}`);
      alert("Profilo aggiornato con successo!");
    } catch (error) { console.error(error); alert("Errore salvataggio."); } 
    finally { setIsSavingProfilo(false); }
  };

  const handleStartEdit = (lez) => {
    setEditingLezioneId(lez.id);
    setEditFormData({ oraInizio: lez.oraInizio, oraFine: lez.oraFine, data: lez.data });
  };

  const handleSaveEdit = async () => {
    if (onUpdateLezioneCompleta) {
      await onUpdateLezioneCompleta({ lezioneId: editingLezioneId, oraInizio: editFormData.oraInizio, oraFine: editFormData.oraFine, data: editFormData.data });
      if (aggiungiLog) aggiungiLog(`Spostata lezione ${studente.nome} al ${editFormData.data} ore ${editFormData.oraInizio}`);
    }
    setEditingLezioneId(null);
  };

  const avviaAnnullamento = () => {
    setAnnullaConfig(prev => ({ ...prev, isOpen: false }));
    setPinConfig({
      isOpen: true,
      description: `Annullamento ${annullaConfig.tipo === 'penale' ? 'CON PENALE' : 'GRATUITO'}`,
      actionCallback: async () => {
        if (onUpdateLezioneStatus) {
          await onUpdateLezioneStatus(annullaConfig.lezioneId, 'annullata', annullaConfig.note, annullaConfig.tipo);
          if (aggiungiLog) aggiungiLog(`Lezione annullata (${annullaConfig.tipo}) per ${studente.nome}. Motivo: ${annullaConfig.note}`);
        }
      }
    });
  };

  const handleRicaricaSubmit = async (e) => {
    e.preventDefault();
    if (onRicaricaPacchetto) await onRicaricaPacchetto(studente.id, ricaricaData);
    setShowRicarica(false);
    setRicaricaData({ costoDaAggiungere: '', pagatoDaAggiungere: '', metodoPagamento: 'Contanti', tariffaApplicata: ricaricaData.tariffaApplicata, note: '' });
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start pt-10 pb-10 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col border border-slate-200 overflow-hidden min-h-[600px]">
        
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-400 text-slate-900 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
              {studente.nome?.charAt(0)}{studente.cognome?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3">
                {studente.nome} {studente.cognome}
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${studente.attivo !== false ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {studente.attivo !== false ? 'Attivo' : 'Inattivo'}
                </span>
              </h2>
              <div className="flex gap-4 mt-2 text-slate-400 text-xs font-medium">
                <span>{studente.categoriaTariffaria || 'medie'}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                  Tariffa: {studente.haTariffaRiservata ? studente.tariffaRiservataValore : (studente.categoriaTariffaria === 'elementari' ? 18 : studente.categoriaTariffaria === 'superiori' ? 26 : 22)} €/h
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors bg-slate-800 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex border-b border-gray-200 bg-slate-50 px-6 shrink-0">
          <button onClick={() => setActiveTab('lezioni')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'lezioni' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><Calendar className="w-4 h-4"/> Lezioni ({lezioniFuture.length})</button>
          <button onClick={() => setActiveTab('profilo')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'profilo' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><User className="w-4 h-4"/> Profilo & Recapiti</button>
          <button onClick={() => setActiveTab('contabilita')} className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'contabilita' ? 'border-amber-500 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><CreditCard className="w-4 h-4"/> Contabilità & Storico</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          
          {/* TAB: LEZIONI PROGRAMMATE */}
          {activeTab === 'lezioni' && (
            <div className="space-y-4">
              {lezioniFuture.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-3xl bg-gray-50"><p className="text-sm font-bold text-gray-500">Nessuna lezione in programma</p></div>
              ) : (
                lezioniFuture.map(lez => (
                  <div key={lez.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-black text-slate-900 text-base">{lez.materia || 'Lezione'}</span>
                        <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">{lez.stato}</span>
                        {lez.isGruppo && <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase">Gruppo</span>}
                        {lez.allegatoUrl && (<a href={lez.allegatoUrl} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors"><Paperclip className="w-3 h-3"/> Appunti</a>)}
                      </div>
                      
                      {editingLezioneId === lez.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input type="date" className="text-xs font-bold bg-white border border-slate-300 rounded p-2" value={editFormData.data} onChange={(e) => setEditFormData({...editFormData, data: e.target.value})}/>
                          <input type="time" className="text-xs font-bold bg-white border border-slate-300 rounded p-2" value={editFormData.oraInizio} onChange={(e) => setEditFormData({...editFormData, oraInizio: e.target.value})}/>
                          <span className="text-slate-400">-</span>
                          <input type="time" className="text-xs font-bold bg-white border border-slate-300 rounded p-2" value={editFormData.oraFine} onChange={(e) => setEditFormData({...editFormData, oraFine: e.target.value})}/>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-slate-600 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 text-blue-700 shadow-sm"><User className="w-3.5 h-3.5"/> {getNomeProf(lez)}</span>
                          <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-200"><Calendar className="w-3.5 h-3.5 text-amber-500"/> {lez.data}</span>
                          <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-200"><Clock className="w-3.5 h-3.5 text-amber-500"/> {lez.oraInizio} - {lez.oraFine}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
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
                ))
              )}
            </div>
          )}

          {/* TAB: PROFILO & RECAPITI */}
          {activeTab === 'profilo' && (
            <form onSubmit={salvaProfilo} className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Anagrafica Studente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm" value={editStd.nome || ''} onChange={e => setEditStd({...editStd, nome: e.target.value})} required/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cognome</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm" value={editStd.cognome || ''} onChange={e => setEditStd({...editStd, cognome: e.target.value})} required/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Scuola Frequentata</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm" value={editStd.scuola || ''} onChange={e => setEditStd({...editStd, scuola: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data di Nascita</label><input type="date" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm" value={editStd.dataNascita || ''} onChange={e => setEditStd({...editStd, dataNascita: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Telefono Studente</label><input type="tel" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm" value={editStd.telefono || ''} onChange={e => setEditStd({...editStd, telefono: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Studente</label><input type="email" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm" value={editStd.email || ''} onChange={e => setEditStd({...editStd, email: e.target.value})}/></div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4"/> Inquadramento Tariffario</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Categoria Scolastica (Base)</label>
                    <select className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm" value={editStd.categoriaTariffaria || 'medie'} onChange={e => setEditStd({...editStd, categoriaTariffaria: e.target.value})}>
                      <option value="elementari">Primaria (18 €/h)</option><option value="medie">Secondaria I grado (22 €/h)</option><option value="superiori">Secondaria II grado (26 €/h)</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-2 p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500" checked={editStd.haTariffaRiservata || false} onChange={e => setEditStd({...editStd, haTariffaRiservata: e.target.checked})}/>
                      <span className="text-xs font-bold text-slate-700">Applica Tariffa Riservata</span>
                    </label>
                  </div>
                  {editStd.haTariffaRiservata && (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Valore Tariffa Personalizzata (€/h)</label>
                      <input type="number" step="0.5" className="w-1/2 p-2.5 rounded-xl border border-amber-300 bg-amber-50 font-black text-sm text-slate-900" value={editStd.tariffaRiservataValore || ''} onChange={e => setEditStd({...editStd, tariffaRiservataValore: e.target.value})}/>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Intestatario Pagamenti (Genitore)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome Genitore</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm" value={editStd.genitoreNome || ''} onChange={e => setEditStd({...editStd, genitoreNome: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Codice Fiscale Genitore</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm uppercase" value={editStd.codiceFiscale || ''} onChange={e => setEditStd({...editStd, codiceFiscale: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Telefono Genitore</label><input type="tel" className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-sm" value={editStd.genitoreTelefono || ''} onChange={e => setEditStd({...editStd, genitoreTelefono: e.target.value})}/></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email App & Ricevute</label><input type="email" className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm text-blue-700" value={editStd.genitoreEmail || ''} onChange={e => setEditStd({...editStd, genitoreEmail: e.target.value})}/></div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSavingProfilo} className="px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2"><Save className="w-4 h-4"/> Salva Modifiche Profilo</button>
              </div>
            </form>
          )}

          {/* TAB: CONTABILITÀ E STORICO */}
          {activeTab === 'contabilita' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div><h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-500"/> Situazione Plafond</h3></div>
                <button onClick={() => setShowRicarica(!showRicarica)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-colors flex items-center gap-2"><PlusCircle className="w-4 h-4"/> + Registra Ricarica</button>
              </div>

              {showRicarica && (
                <form onSubmit={handleRicaricaSubmit} className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
                  <h4 className="text-xs font-black text-emerald-900 uppercase mb-4">Nuova Ricarica</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div><label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">Costo Totale (€) *</label><input type="number" step="0.01" required className="w-full p-2.5 text-sm font-bold border border-emerald-200 rounded-xl bg-white" value={ricaricaData.costoDaAggiungere} onChange={e => setRicaricaData({...ricaricaData, costoDaAggiungere: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">Pagato Ora (€) *</label><input type="number" step="0.01" required className="w-full p-2.5 text-sm font-bold border border-emerald-200 rounded-xl bg-white" value={ricaricaData.pagatoDaAggiungere} onChange={e => setRicaricaData({...ricaricaData, pagatoDaAggiungere: e.target.value})}/></div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">Metodo</label>
                      <select className="w-full p-2.5 text-sm font-bold border border-emerald-200 rounded-xl bg-white" value={ricaricaData.metodoPagamento} onChange={e => setRicaricaData({...ricaricaData, metodoPagamento: e.target.value})}><option>Contanti</option><option>Bonifico</option><option>POS</option><option>Assegno</option></select>
                    </div>
                    <div><label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">Tariffa Appl. (€/h)</label><input type="number" step="0.5" required className="w-full p-2.5 text-sm font-bold border border-emerald-200 rounded-xl bg-white" value={ricaricaData.tariffaApplicata} onChange={e => setRicaricaData({...ricaricaData, tariffaApplicata: e.target.value})} /></div>
                  </div>
                  <div className="flex gap-3">
                    <input type="text" className="flex-1 p-2.5 text-sm border border-emerald-200 rounded-xl bg-white" placeholder="Note ricarica (opzionale)" value={ricaricaData.note} onChange={e => setRicaricaData({...ricaricaData, note: e.target.value})}/>
                    <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800">Conferma Ricarica</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-2xl border ${((studente.totaleVersato || 0) - (studente.totaleConsumato || 0)) < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Credito Residuo</p>
                  <p className={`text-4xl font-black ${((studente.totaleVersato || 0) - (studente.totaleConsumato || 0)) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {((studente.totaleVersato || 0) - (studente.totaleConsumato || 0)).toFixed(2)} €
                  </p>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"><p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Totale Versato</p><p className="text-2xl font-black text-slate-800">{(studente.totaleVersato || 0).toFixed(2)} €</p></div>
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"><p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Totale Consumato</p><p className="text-2xl font-black text-slate-800">{(studente.totaleConsumato || 0).toFixed(2)} €</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-100 pt-6">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><History className="w-4 h-4 text-blue-500"/> Storico Lezioni Passate</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {lezioniPassate.length === 0 ? <p className="text-xs text-gray-400 italic">Nessuna lezione passata.</p> : lezioniPassate.map(lez => (
                      <div key={lez.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl text-xs hover:border-blue-300 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 block">{lez.materia || 'Lezione'}</span>
                            {lez.allegatoUrl && (<a href={lez.allegatoUrl} target="_blank" rel="noreferrer" title="Vedi Appunti" className="text-blue-500 hover:text-blue-700"><Paperclip className="w-3.5 h-3.5"/></a>)}
                          </div>
                          <span className="text-slate-500 font-medium">{lez.data} • {lez.oraInizio}-{lez.oraFine}</span><br/>
                          <span className="text-blue-600 font-bold">{getNomeProf(lez)}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${lez.stato === 'svolta' ? 'bg-emerald-100 text-emerald-800' : lez.stato === 'annullata' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-600'}`}>{lez.stato}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500"/> Registro Ricevute</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {(!studente.storicoRicariche || studente.storicoRicariche.length === 0) ? <p className="text-xs text-gray-400 italic">Nessuna ricevuta emessa.</p> : studente.storicoRicariche.map((r, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl text-xs">
                        <div>
                          <p className="font-black text-emerald-700 text-sm">+{Number(r.pagato).toFixed(2)} €</p>
                          <p className="font-medium text-slate-500 text-[10px]">{r.data} • {r.metodo}</p>
                          {r.note && <p className="text-[10px] text-amber-600 mt-0.5 font-bold italic">"{r.note}"</p>}
                        </div>
                        <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors" title="Stampa Quietanza"><Printer className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {annullaConfig.isOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-rose-600"/> Annulla Lezione</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Tipo di Annullamento</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900" value={annullaConfig.tipo} onChange={(e) => setAnnullaConfig({...annullaConfig, tipo: e.target.value})}>
                  <option value="gratuito">Annullamento Gratuito</option><option value="penale">Addebita Penale (100%)</option>
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
