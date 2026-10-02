import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, User, BookOpen, Euro, Paperclip, AlertCircle, Users, UserPlus, Search } from 'lucide-react';
import ModalePin from './ModalePin';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function ModaleLezione({ 
  isOpen, 
  onClose, 
  onSave, 
  insegnanti = [], 
  studenti = [], 
  lezioni = [], 
  initialData = null 
}) {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    oraInizio: '15:00',
    oraFine: '16:00',
    insegnanteId: '',
    studentiIds: [],
    materia: '',
    isGruppo: false,
    prezzoPersonalizzato: '',
    note: '',
    allegatoUrl: '',
    oldLezioneId: null
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [studenteSearch, setStudenteSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreandoOspite, setIsCreandoOspite] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        data: initialData.data || new Date().toISOString().split('T')[0],
        oraInizio: initialData.oraInizio || '15:00',
        oraFine: initialData.oraFine || '16:00',
        insegnanteId: initialData.insegnanteId || '',
        studentiIds: initialData.studentiIds || [],
        materia: initialData.materia || '',
        isGruppo: Boolean(initialData.isGruppo),
        prezzoPersonalizzato: initialData.prezzoPersonalizzato !== undefined && initialData.prezzoPersonalizzato !== null ? initialData.prezzoPersonalizzato : '',
        note: initialData.note || '',
        allegatoUrl: initialData.allegatoUrl || '',
        oldLezioneId: initialData.oldLezioneId || null
      });
    } else {
      setFormData({
        data: new Date().toISOString().split('T')[0],
        oraInizio: '15:00',
        oraFine: '16:00',
        insegnanteId: '',
        studentiIds: [],
        materia: '',
        isGruppo: false,
        prezzoPersonalizzato: '',
        note: '',
        allegatoUrl: '',
        oldLezioneId: null
      });
    }
    setStudenteSearch('');
    setIsDropdownOpen(false);
  }, [initialData, isOpen]);

  // Chiude dropdown se si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSelectStudent = (stdId) => {
    setFormData(prev => {
      if (prev.isGruppo) {
        const already = prev.studentiIds.includes(stdId);
        return {
          ...prev,
          studentiIds: already ? prev.studentiIds : [...prev.studentiIds, stdId]
        };
      } else {
        return {
          ...prev,
          studentiIds: [stdId]
        };
      }
    });
    setStudenteSearch('');
    setIsDropdownOpen(false);
  };

  const handleRemoveStudent = (stdId) => {
    setFormData(prev => ({
      ...prev,
      studentiIds: prev.studentiIds.filter(id => id !== stdId)
    }));
  };

  const handleCreaOspiteAlVolo = async () => {
    const nomeDigitato = studenteSearch.trim();
    if (!nomeDigitato) return;

    setIsCreandoOspite(true);
    try {
      const parti = nomeDigitato.split(' ');
      const nome = parti[0] || 'Ospite';
      const cognome = parti.slice(1).join(' ') || '(Ospite)';

      const docRef = await addDoc(collection(db, 'studenti'), {
        nome,
        cognome,
        isOspite: true,
        categoriaTariffaria: 'medie',
        attivo: true,
        totaleVersato: 0,
        totaleConsumato: 0,
        storicoRicariche: [],
        dataCreazione: new Date().toISOString()
      });

      handleSelectStudent(docRef.id);
    } catch (err) {
      console.error("Errore creazione ospite:", err);
      alert("Errore durante la creazione dello studente ospite.");
    } finally {
      setIsCreandoOspite(false);
    }
  };

  const handlePreSave = (e) => {
    e.preventDefault();
    if (!formData.data || !formData.oraInizio || !formData.oraFine) {
      return alert("Compila data e orari.");
    }
    if (formData.studentiIds.length === 0) {
      return alert("Seleziona almeno uno studente per la lezione.");
    }
    if (!formData.isGruppo && !formData.insegnanteId) {
      const conferma = window.confirm("Nessun docente selezionato: la lezione verrà posizionata nella colonna 'DA ASSEGNARE'. Vuoi procedere?");
      if (!conferma) return;
    }

    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    const payload = {
      ...formData,
      prezzoPersonalizzato: formData.prezzoPersonalizzato !== '' ? Number(formData.prezzoPersonalizzato) : null
    };

    if (onSave) {
      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    }
  };

  // Filtra SOLO quando si scrive qualcosa
  const queryPulita = studenteSearch.trim().toLowerCase();
  const studentiTrovati = queryPulita.length > 0
    ? (studenti || []).filter(s => `${s.nome || ''} ${s.cognome || ''}`.toLowerCase().includes(queryPulita))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
              <Calendar className="w-5 h-5"/>
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900">
                {formData.oldLezioneId ? 'Rischedula Lezione' : 'Nuova Prenotazione'}
              </h2>
              <p className="text-xs text-slate-400">Inserimento protetto da PIN reception</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handlePreSave} className="space-y-4 text-xs font-bold">
          
          {/* TIPO: INDIVIDUALE vs GRUPPO */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isGruppo: false, studentiIds: prev.studentiIds.slice(0, 1) }))}
              className={`flex-1 py-2 rounded-xl transition ${!formData.isGruppo ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
              Lezione Individuale
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isGruppo: true }))}
              className={`flex-1 py-2 rounded-xl transition ${formData.isGruppo ? 'bg-amber-400 shadow text-slate-950 font-black' : 'text-slate-500'}`}
            >
              Gruppo Studio
            </button>
          </div>

          {/* DATA E ORARI */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1">Data</label>
              <input 
                type="date" 
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.data}
                onChange={e => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1">Inizio</label>
              <input 
                type="time" 
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.oraInizio}
                onChange={e => setFormData({ ...formData, oraInizio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1">Fine</label>
              <input 
                type="time" 
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.oraFine}
                onChange={e => setFormData({ ...formData, oraFine: e.target.value })}
              />
            </div>
          </div>

          {/* DOCENTE */}
          {!formData.isGruppo && (
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1">Docente Assegnato</label>
              <select
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                value={formData.insegnanteId}
                onChange={e => setFormData({ ...formData, insegnanteId: e.target.value })}
              >
                <option value="">-- Metti in Sala Attesa (Da Assegnare) --</option>
                {insegnanti.map(ins => (
                  <option key={ins.id} value={ins.id}>
                    {ins.nome} {ins.cognome} ({ins.materia || 'Docente'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* MATERIA & PREZZO PERSONALIZZATO */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1">Materia</label>
              <input 
                type="text" 
                placeholder="Es. Matematica, Latino..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.materia}
                onChange={e => setFormData({ ...formData, materia: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1 flex items-center gap-1">
                <Euro className="w-3 h-3 text-emerald-600"/> Prezzo Forfait (€)
              </label>
              <input 
                type="number" 
                step="0.5" 
                placeholder="Vuoto = tariffa base"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.prezzoPersonalizzato}
                onChange={e => setFormData({ ...formData, prezzoPersonalizzato: e.target.value })}
              />
            </div>
          </div>

          {/* BARRA DI RICERCA STUDENTE (ZERO LISTA FISSA - SOLO DROPDOWN A COMPARSA) */}
          <div className="relative" ref={searchContainerRef}>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">
              {formData.isGruppo ? 'Aggiungi Allievi al Gruppo' : 'Seleziona Allievo'}
            </label>

            {/* CHIPS DEGLI STUDENTI GIA SELEZIONATI */}
            {formData.studentiIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formData.studentiIds.map(sId => {
                  const s = (studenti || []).find(std => std.id === sId);
                  return (
                    <span 
                      key={sId} 
                      className="bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs"
                    >
                      👤 {s ? `${s.nome} ${s.cognome}` : 'Studente'}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveStudent(sId)}
                        className="p-0.5 hover:bg-amber-500 rounded-full"
                      >
                        <X className="w-3 h-3"/>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* INPUT DI RICERCA */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
              <input 
                type="text" 
                placeholder="Inizia a digitare il nome dell'allievo o ospite..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                value={studenteSearch}
                onChange={e => {
                  setStudenteSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  if (studenteSearch.trim().length > 0) setIsDropdownOpen(true);
                }}
              />
            </div>

            {/* TENDINA RISULTATI DINAMICA (COMPARE SOLO SE DIGITI) */}
            {isDropdownOpen && queryPulita.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-52 overflow-y-auto p-1.5 space-y-1">
                
                {/* Tasto crea ospite al volo */}
                <button
                  type="button"
                  disabled={isCreandoOspite}
                  onClick={handleCreaOspiteAlVolo}
                  className="w-full p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 font-black rounded-xl flex items-center gap-2 text-left transition text-xs"
                >
                  <UserPlus className="w-4 h-4 text-amber-700 shrink-0"/>
                  <span className="truncate">+ Registra ed usa come Ospite: "<b>{studenteSearch.trim()}</b>"</span>
                </button>

                {studentiTrovati.map(std => {
                  const isSelected = formData.studentiIds.includes(std.id);
                  return (
                    <div 
                      key={std.id}
                      onClick={() => handleSelectStudent(std.id)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition text-xs ${isSelected ? 'bg-amber-100 text-amber-950 font-black' : 'hover:bg-slate-100 text-slate-700'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {std.isOspite && <span className="text-[9px] bg-slate-900 text-amber-300 px-1 py-0.2 rounded font-black uppercase">Ospite</span>}
                        {std.nome} {std.cognome}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase">{std.scuola || std.categoriaTariffaria || 'Medie'}</span>
                    </div>
                  );
                })}

                {studentiTrovati.length === 0 && (
                  <p className="p-2 text-center text-slate-400 text-xs font-normal">
                    Nessun iscritto trovato con questo nome.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* NOTE */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Note Opzionali</label>
            <input 
              type="text" 
              placeholder="Es. Recupero verifica, compiti vacanze..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          {/* PULSANTI */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold"
            >
              Annulla
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black shadow-md flex items-center gap-1.5"
            >
              Procedi al PIN ➔
            </button>
          </div>

        </form>

      </div>

      {/* VERIFICA PIN DI SICUREZZA CENTRALIZZATA (1234) */}
      <ModalePin
        isOpen={showPinModal}
        descrizione={`Conferma ${formData.oldLezioneId ? 'Rischedulazione' : 'Nuova Prenotazione'}`}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
      />

    </div>
  );
}
