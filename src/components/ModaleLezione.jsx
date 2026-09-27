import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Search, UserCheck, Euro, Paperclip } from 'lucide-react'; // <-- Aggiunto Paperclip

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
    materia: 'Matematica',
    insegnanteId: '',
    studentiIds: [],
    isGruppo: false,
    tipoTariffa: 'standard',
    costoTotaleLezione: 22,
    note: '',
    allegatoUrl: '', // <-- AGGIUNTO CAMPO ALLEGATO
    oldLezioneId: null
  });

  const [searchStudente, setSearchStudente] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Lista sicura docenti e studenti (elimina undefined)
  const insegnantiValidi = (insegnanti || []).filter(i => i && i.nome && i.attivo !== false);
  const studentiValidi = (studenti || []).filter(s => s && s.nome && s.attivo !== false);

  const getDurataOre = (inizio, fine) => {
    if (!inizio || !fine) return 1;
    const [h1, m1] = inizio.split(':').map(Number);
    const [h2, m2] = fine.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return mins > 0 ? mins / 60 : 1;
  };

  // Calcolo automatico flessibile del costo
  const calcolaCosto = (isGruppo, studentiIds, inizio, fine, tipoTariffa, costoManuale) => {
    if (tipoTariffa === 'personalizzata') return Number(costoManuale || 0);

    const durata = getDurataOre(inizio, fine);
    if (isGruppo) return Number((durata * 12).toFixed(2));

    const std = studentiValidi.find(s => (studentiIds || []).includes(s?.id));
    let tariffaBase = 22;

    if (std) {
      if (std?.haTariffaRiservata && Number(std?.tariffaRiservataValore) > 0) {
        tariffaBase = Number(std.tariffaRiservataValore);
      } else if (std?.categoriaTariffaria === 'elementari') {
        tariffaBase = 18;
      } else if (std?.categoriaTariffaria === 'superiori') {
        tariffaBase = 26;
      }
    }

    // Se fa 2 o più ore consecutive: sconto blocco automatico (-2€/h)
    if (durata >= 2) {
      return Number((durata * (tariffaBase - 2)).toFixed(2));
    }

    return Number((durata * tariffaBase).toFixed(2));
  };

  useEffect(() => {
    if (isOpen) {
      const initGruppo = Boolean(initialData?.isGruppo);
      const initStudenti = initialData?.studentiIds || [];
      const initInizio = initialData?.oraInizio || '15:00';
      const initFine = initialData?.oraFine || '16:00';
      const defaultDocId = insegnantiValidi[0]?.id || '';
      const initDocente = initGruppo ? '' : (initialData?.insegnanteId || defaultDocId);
      
      const costoIniziale = calcolaCosto(
        initGruppo, 
        initStudenti, 
        initInizio, 
        initFine, 
        'standard', 
        initialData?.costoTotaleLezione
      );

      setFormData({
        data: initialData?.data || new Date().toISOString().split('T')[0],
        oraInizio: initInizio,
        oraFine: initFine,
        materia: initialData?.materia || 'Matematica',
        insegnanteId: initDocente,
        studentiIds: initStudenti,
        isGruppo: initGruppo,
        tipoTariffa: 'standard',
        costoTotaleLezione: costoIniziale,
        note: initialData?.note || '',
        allegatoUrl: initialData?.allegatoUrl || '', // <-- IMPOSPOSTA L'ALLEGATO RICEVUTO DALLA RICHIESTA
        oldLezioneId: initialData?.oldLezioneId || null
      });
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleToggleStudente = (id) => {
    setFormData(prev => {
      const exists = prev.studentiIds.includes(id);
      const nuovi = exists ? prev.studentiIds.filter(sId => sId !== id) : [...prev.studentiIds, id];
      const costo = calcolaCosto(prev.isGruppo, nuovi, prev.oraInizio, prev.oraFine, prev.tipoTariffa, prev.costoTotaleLezione);
      return { ...prev, studentiIds: nuovi, costoTotaleLezione: costo };
    });
  };

  const handleCambioOrario = (campo, valore) => {
    setFormData(prev => {
      const nuovoInizio = campo === 'oraInizio' ? valore : prev.oraInizio;
      const nuovaFine = campo === 'oraFine' ? valore : prev.oraFine;
      const costo = calcolaCosto(prev.isGruppo, prev.studentiIds, nuovoInizio, nuovaFine, prev.tipoTariffa, prev.costoTotaleLezione);
      return { ...prev, [campo]: valore, costoTotaleLezione: costo };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.studentiIds.length) {
      alert("Seleziona almeno uno studente per la lezione.");
      return;
    }
    onSave(formData);
  };

  const studentiFiltrati = studentiValidi.filter(s => {
    const nome = `${s?.nome || ''} ${s?.cognome || ''}`.toLowerCase();
    return nome.includes((searchStudente || '').toLowerCase().trim());
  });

  const studentiSelezionati = studentiValidi.filter(s => formData.studentiIds.includes(s?.id));
  const durataOre = getDurataOre(formData.oraInizio, formData.oraFine);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-500"/>
            <h3 className="font-extrabold text-lg text-slate-900">
              {formData.oldLezioneId ? 'Rischedula Lezione' : 'Nuova Lezione FuoriClasse'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* SE C'È UN ALLEGATO DALLA RICHIESTA GENITORE, MOSTRALO IN CIMA ALLA MODALE */}
        {formData.allegatoUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex justify-between items-center">
            <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-blue-500"/> 
              Il genitore ha inviato un allegato per questa lezione
            </span>
            <a 
              href={formData.allegatoUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              Vedi File
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tipo Lezione */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                const costo = calcolaCosto(false, formData.studentiIds, formData.oraInizio, formData.oraFine, formData.tipoTariffa, formData.costoTotaleLezione);
                setFormData(prev => ({ ...prev, isGruppo: false, insegnanteId: insegnantiValidi[0]?.id || '', costoTotaleLezione: costo }));
              }}
              className={`flex-1 py-2 font-black rounded-xl transition-all ${!formData.isGruppo ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}
            >
              Docente Singolo / Individuale
            </button>
            <button
              type="button"
              onClick={() => {
                const costo = calcolaCosto(true, formData.studentiIds, formData.oraInizio, formData.oraFine, formData.tipoTariffa, formData.costoTotaleLezione);
                setFormData(prev => ({ ...prev, isGruppo: true, insegnanteId: '', costoTotaleLezione: costo }));
              }}
              className={`flex-1 py-2 font-black rounded-xl transition-all ${formData.isGruppo ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-gray-500'}`}
            >
              Gruppo Studio
            </button>
          </div>

          {/* Docente Assegnato */}
          {!formData.isGruppo && (
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Docente Assegnato</label>
              <select
                value={formData.insegnanteId}
                onChange={(e) => setFormData(prev => ({ ...prev, insegnanteId: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
              >
                {insegnantiValidi.map(ins => (
                  <option key={ins.id} value={ins.id}>
                    {ins?.nome || 'Docente'} {ins?.cognome || ''} ({ins?.materia || 'Generale'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Orari */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Data</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Inizio</label>
              <input
                type="time"
                value={formData.oraInizio}
                onChange={(e) => handleCambioOrario('oraInizio', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Fine ({durataOre.toFixed(1)}h)</label>
              <input
                type="time"
                value={formData.oraFine}
                onChange={(e) => handleCambioOrario('oraFine', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Materia</label>
            <input
              type="text"
              placeholder="es. Matematica, Latino..."
              value={formData.materia}
              onChange={(e) => setFormData(prev => ({ ...prev, materia: e.target.value }))}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
            />
          </div>

          {/* Selezione Studenti */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              Studenti Iscritti
            </label>

            {studentiSelezionati.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50/60 rounded-xl border border-amber-200 mb-1">
                {studentiSelezionati.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center space-x-1 bg-amber-200 text-amber-950 font-bold px-2 py-1 rounded-lg text-[11px]"
                  >
                    <UserCheck className="w-3 h-3 text-amber-800"/>
                    <span>{s?.nome || 'Studente'} {s?.cognome || ''}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleStudente(s.id)}
                      className="ml-1 hover:text-rose-600"
                    >
                      <X className="w-3 h-3"/>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"/>
              <input
                type="text"
                placeholder="Cerca studente..."
                value={searchStudente}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchStudente(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none"
              />
            </div>

            {isDropdownOpen && searchStudente.trim().length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-1 max-h-44 overflow-y-auto border border-gray-200 rounded-2xl p-1.5 space-y-1 bg-white shadow-xl">
                {studentiFiltrati.length === 0 ? (
                  <div className="text-center py-3 text-gray-400 font-medium">Nessuno studente trovato</div>
                ) : (
                  studentiFiltrati.map(std => {
                    const isSelected = formData.studentiIds.includes(std.id);
                    return (
                      <div
                        key={std.id}
                        onClick={() => {
                          handleToggleStudente(std.id);
                          setSearchStudente('');
                          setIsDropdownOpen(false);
                        }}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer font-bold transition-all ${
                          isSelected ? 'bg-amber-100 text-slate-950' : 'hover:bg-gray-50 text-slate-700'
                        }`}
                      >
                        <span>{std?.nome || 'Studente'} {std?.cognome || ''}</span>
                        {isSelected && <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">Selezionato</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* GESTIONE FLESSIBILE COSTO LEZIONE */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-slate-900 text-xs flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-emerald-600"/>
                <span>Costo Totale per Questa Lezione</span>
              </span>
              <span className="text-[10px] text-gray-500 font-bold">Durata: {durataOre.toFixed(1)} ore</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo Calcolo</label>
                <select
                  value={formData.tipoTariffa}
                  onChange={(e) => {
                    const nuovoTipo = e.target.value;
                    const costo = calcolaCosto(formData.isGruppo, formData.studentiIds, formData.oraInizio, formData.oraFine, nuovoTipo, formData.costoTotaleLezione);
                    setFormData(prev => ({ ...prev, tipoTariffa: nuovoTipo, costoTotaleLezione: costo }));
                  }}
                  className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                >
                  <option value="standard">Calcolo Automatico Base</option>
                  <option value="personalizzata">Prezzo Forfait Manuale (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Importo da Scalare (€)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={formData.costoTotaleLezione}
                  disabled={formData.tipoTariffa !== 'personalizzata'}
                  onChange={(e) => setFormData(prev => ({ ...prev, costoTotaleLezione: parseFloat(e.target.value) || 0 }))}
                  className={`w-full p-2 rounded-xl font-black text-sm text-slate-900 border focus:outline-none ${
                    formData.tipoTariffa === 'personalizzata' ? 'bg-amber-50 border-amber-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Note (opzionale)</label>
            <input
              type="text"
              placeholder="es. compito in classe, accordo speciale..."
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm"
            >
              {formData.oldLezioneId ? 'Conferma Rischedulazione' : 'Salva Lezione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
