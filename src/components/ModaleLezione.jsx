import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, BookOpen, CheckCircle, Users, MapPin, AlertTriangle, UserPlus } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ModaleLezione({ isOpen, onClose, onSave, insegnanti = [], studenti = [], lezioni = [], initialData = null }) {
  const [formData, setFormData] = useState({
    data: '', oraInizio: '', oraFine: '', materia: '', note: '', isGruppo: false,
    insegnanteId: '', coDocentiIds: [], studentiIds: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ricercaStudente, setRicercaStudente] = useState('');
  const [ricercaDocente, setRicercaDocente] = useState('');
  const [isCreandoOspite, setIsCreandoOspite] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          data: initialData.data || new Date().toISOString().split('T')[0],
          oraInizio: initialData.oraInizio || '15:00',
          oraFine: initialData.oraFine || '16:00',
          materia: initialData.materia || '',
          note: initialData.note || '',
          isGruppo: initialData.isGruppo || false,
          insegnanteId: initialData.insegnanteId || '',
          coDocentiIds: initialData.coDocentiIds || [],
          studentiIds: initialData.studentiIds || [],
          oldLezioneId: initialData.oldLezioneId || null
        });
      } else {
        setFormData({
          data: new Date().toISOString().split('T')[0], oraInizio: '15:00', oraFine: '16:00',
          materia: '', note: '', isGruppo: false, insegnanteId: '', coDocentiIds: [], studentiIds: []
        });
      }
      setRicercaStudente('');
      setRicercaDocente('');
      setIsCreandoOspite(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const toggleStudente = (id) => {
    setFormData(prev => ({
      ...prev,
      studentiIds: prev.studentiIds.includes(id) ? prev.studentiIds.filter(sId => sId !== id) : [...prev.studentiIds, id]
    }));
    setRicercaStudente('');
  };

  const toggleCoDocente = (id) => {
    setFormData(prev => ({
      ...prev,
      coDocentiIds: prev.coDocentiIds.includes(id) ? prev.coDocentiIds.filter(dId => dId !== id) : [...prev.coDocentiIds, id]
    }));
    setRicercaDocente('');
  };

  const handleCreaStudenteOspite = async () => {
    const nomeInserito = ricercaStudente.trim();
    if (!nomeInserito) return;
    setIsCreandoOspite(true);
    try {
      const parti = nomeInserito.split(' ');
      const nome = parti[0] || nomeInserito;
      const cognome = parti.slice(1).join(' ') || '(Ospite / Prova)';

      const docRef = await addDoc(collection(db, 'studenti'), {
        nome: nome,
        cognome: cognome,
        attivo: true,
        isProvvisorio: true,
        categoriaTariffaria: 'medie',
        totaleVersato: 0,
        totaleConsumato: 0,
        totalePattuito: 0,
        storicoRicariche: [],
        createdAt: serverTimestamp()
      });

      setFormData(prev => ({
        ...prev,
        studentiIds: [...prev.studentiIds, docRef.id]
      }));
      setRicercaStudente('');
    } catch (error) {
      console.error("Errore creazione allievo ospite:", error);
      alert("Errore durante la registrazione al volo dell'allievo.");
    } finally {
      setIsCreandoOspite(false);
    }
  };

  // Controlli anti accavallamento (Solo avviso per la Reception, non bloccante)
  const checkCollisioni = () => {
    const conflitti = [];
    if (!formData.data || !formData.oraInizio || !formData.oraFine) return conflitti;
    if (formData.oraInizio >= formData.oraFine) return ["Orari non validi (fine antecedente all'inizio)."];

    const lezioniGiorno = lezioni.filter(l => l.data === formData.data && l.stato !== 'annullata' && l.id !== formData.oldLezioneId);
    const profDaControllare = [...formData.coDocentiIds];
    if (formData.insegnanteId) profDaControllare.push(formData.insegnanteId);

    lezioniGiorno.forEach(lez => {
      const overlap = formData.oraInizio < lez.oraFine && formData.oraFine > lez.oraInizio;
      if (overlap) {
        profDaControllare.forEach(pId => {
          if (lez.insegnanteId === pId || (lez.coDocentiIds || []).includes(pId)) {
            const profInfo = insegnanti.find(i => i.id === pId);
            if(profInfo) conflitti.push(`⚠️ Il Prof. ${profInfo.cognome} è già occupato/a in questa fascia oraria.`);
          }
        });
        formData.studentiIds.forEach(sId => {
          if ((lez.studentiIds || []).includes(sId)) {
            const stdInfo = studenti.find(s => s.id === sId);
            if(stdInfo) conflitti.push(`⚠️ ${stdInfo.nome} ha già una lezione in questa fascia oraria.`);
          }
        });
      }
    });
    return [...new Set(conflitti)];
  };

  const conflittiAttuali = checkCollisioni();
  const formNonValido = formData.studentiIds.length === 0 || formData.oraInizio >= formData.oraFine;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formNonValido) return;
    setIsSubmitting(true);
    
    // Assicuriamoci che se ci sono più studenti sia flaggato come gruppo
    const finalData = { ...formData };
    if (finalData.studentiIds.length > 1) finalData.isGruppo = true;
    
    await onSave(finalData);
    setIsSubmitting(false);
  };

  const insegnantiAttivi = insegnanti.filter(i => i.attivo !== false);
  const studentiFiltrati = studenti.filter(s => s.attivo !== false && `${s.nome} ${s.cognome}`.toLowerCase().includes(ricercaStudente.toLowerCase()));
  const docentiFiltrati = insegnantiAttivi.filter(d => d.id !== formData.insegnanteId && `${d.nome} ${d.cognome}`.toLowerCase().includes(ricercaDocente.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        <div className="bg-slate-900 p-5 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400"/>
            {formData.oldLezioneId ? 'Modifica Lezione' : 'Inserisci Nuova Lezione'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ASSEGNAZIONE DOCENTI */}
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-4">
            
            {/* Titolare */}
            <div>
              <label className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Docente Titolare (Colonna Planning)</label>
              <select 
                className="w-full p-2.5 border border-amber-300 rounded-lg text-sm font-black bg-white text-slate-900"
                value={formData.insegnanteId} 
                onChange={e => {
                  setFormData(prev => ({ 
                    ...prev, 
                    insegnanteId: e.target.value,
                    coDocentiIds: prev.coDocentiIds.filter(id => id !== e.target.value)
                  }));
                }}
              >
                <option value="">Nessun Titolare (Colonna "Da Assegnare")</option>
                {insegnantiAttivi.map(ins => (
                  <option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome} ({ins.materia})</option>
                ))}
              </select>
            </div>

            {/* Co-Docenti */}
            <div className="pt-2 border-t border-amber-200">
              <label className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Docenti in Compresenza (Co-Docenti)</label>
              
              {formData.coDocentiIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.coDocentiIds.map(docId => {
                    const prof = insegnantiAttivi.find(i => i.id === docId);
                    if (!prof) return null;
                    return (
                      <span key={prof.id} className="bg-white text-slate-700 border border-slate-300 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        {prof.cognome} <button type="button" onClick={() => toggleCoDocente(prof.id)}><X className="w-3 h-3 text-slate-400 hover:text-red-500"/></button>
                      </span>
                    )
                  })}
                </div>
              )}
              
              <input type="text" placeholder="Cerca collega..." className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" value={ricercaDocente} onChange={e => setRicercaDocente(e.target.value)} />
              
              {ricercaDocente.trim().length > 0 && (
                <div className="mt-1 border border-amber-300 rounded-xl max-h-40 overflow-y-auto shadow-lg bg-white relative z-30">
                  {docentiFiltrati.length === 0 ? <div className="p-3 text-xs text-slate-400 text-center">Nessun risultato</div> : docentiFiltrati.map(doc => (
                    <div key={doc.id} onClick={() => toggleCoDocente(doc.id)} className="p-3 border-b border-slate-100 text-sm font-bold text-slate-700 hover:bg-amber-50 cursor-pointer">{doc.nome} {doc.cognome} ({doc.materia})</div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-amber-200 mt-2">
              <input type="checkbox" className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500" checked={formData.isGruppo} onChange={e => setFormData({...formData, isGruppo: e.target.checked})} />
              <span className="text-xs font-bold text-amber-900">Forza posizionamento in "Gruppo Studio"</span>
            </label>
          </div>

          {/* ALLIEVI (MULTI-SELEZIONE & OSPITE AL VOLO) */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Allievi Presenti *</label>
            {formData.studentiIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                {formData.studentiIds.map(stdId => {
                  const std = studenti.find(s => s.id === stdId);
                  return (
                    <span key={stdId} className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                      {std ? `${std.nome} ${std.cognome}` : 'Allievo Ospite'}
                      {std?.isProvvisorio && <span className="bg-amber-400 text-amber-950 text-[9px] px-1 rounded font-black">OSPITE</span>}
                      <button type="button" onClick={() => toggleStudente(stdId)}><X className="w-3 h-3 text-slate-400 hover:text-white"/></button>
                    </span>
                  );
                })}
              </div>
            )}
            <input type="text" placeholder="Cerca studente o scrivi per ospite al volo..." className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-400 outline-none" value={ricercaStudente} onChange={e => setRicercaStudente(e.target.value)} />
            
            {ricercaStudente.trim().length > 0 && (
              <div className="mt-1 border border-slate-200 rounded-xl max-h-48 overflow-y-auto shadow-lg bg-white relative z-20">
                {studentiFiltrati.length === 0 ? (
                  <div 
                    onClick={handleCreaStudenteOspite} 
                    className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <p className="text-xs font-black flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-amber-600"/>
                        {isCreandoOspite ? 'Creazione in corso...' : `Registra "${ricercaStudente}" come Allievo Ospite / Prova`}
                      </p>
                      <p className="text-[10px] text-amber-700 mt-0.5">Crea la scheda anagrafica al volo per salvare subito la lezione</p>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-950 px-2 py-1 rounded shadow-sm">
                      Crea al Volo
                    </span>
                  </div>
                ) : (
                  <>
                    {studentiFiltrati.map(std => (
                      <div key={std.id} onClick={() => toggleStudente(std.id)} className="p-3 border-b border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between items-center">
                        <span>{std.nome} {std.cognome}</span>
                        {std.isProvvisorio && <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded">OSPITE</span>}
                      </div>
                    ))}
                    <div 
                      onClick={handleCreaStudenteOspite} 
                      className="p-2.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-900 text-xs font-bold border-t border-slate-200 cursor-pointer flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-1">➕ Non è in lista? Aggiungi "{ricercaStudente}" come nuovo ospite</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* DATI LEZIONE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Data *</label><input type="date" required className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-sm font-bold" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} /></div>
            <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Dalle *</label><input type="time" required className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-sm font-bold" value={formData.oraInizio} onChange={e => setFormData({...formData, oraInizio: e.target.value})} /></div>
            <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Alle *</label><input type="time" required className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-sm font-bold" value={formData.oraFine} onChange={e => setFormData({...formData, oraFine: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Materia</label><input type="text" className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium" value={formData.materia} onChange={e => setFormData({...formData, materia: e.target.value})} placeholder="Es. Italiano" /></div>
          </div>

          <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Note (opzionale)</label><textarea rows="2" className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-sm resize-none" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Dettagli..."></textarea></div>

          {/* RADAR RECEPTION (Non bloccante, solo avviso) */}
          {conflittiAttuali.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
              <p className="text-xs font-black text-amber-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Avviso di Sovrapposizione:</p>
              <ul className="text-[11px] font-bold text-amber-700 space-y-1 mt-1">
                {conflittiAttuali.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-sm transition">Annulla</button>
            <button type="submit" disabled={isSubmitting || formNonValido || isCreandoOspite} className={`px-6 py-3 text-white font-black rounded-xl text-sm shadow-lg flex items-center gap-2 transition ${formNonValido ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}>
              <CheckCircle className="w-4 h-4"/> {isSubmitting ? 'Salvataggio...' : 'Conferma e Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
