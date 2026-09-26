import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Search, UserCheck, FileText } from 'lucide-react';

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
    note: ''
  });

  const [searchStudente, setSearchStudente] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        data: initialData.data || prev.data,
        oraInizio: initialData.oraInizio || prev.oraInizio,
        oraFine: initialData.oraFine || prev.oraFine,
        materia: initialData.materia || prev.materia,
        note: initialData.note || prev.note,
        insegnanteId: initialData.insegnanteId !== undefined ? initialData.insegnanteId : prev.insegnanteId,
        studentiIds: initialData.studentiIds || prev.studentiIds,
        isGruppo: initialData.isGruppo !== undefined ? initialData.isGruppo : prev.isGruppo
      }));
    } else if (insegnanti.length > 0 && !formData.insegnanteId) {
      setFormData(prev => ({ ...prev, insegnanteId: insegnanti[0].id }));
    }
  }, [initialData, isOpen, insegnanti]);

  useEffect(() => {
    if (isOpen) {
      setSearchStudente('');
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Chiude il dropdown dei risultati cliccando all'esterno
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.studentiIds.length) {
      alert("Seleziona almeno uno studente per la lezione.");
      return;
    }
    onSave(formData);
  };

  const handleToggleStudente = (id) => {
    setFormData(prev => {
      const exists = prev.studentiIds.includes(id);
      if (exists) {
        return { ...prev, studentiIds: prev.studentiIds.filter(sId => sId !== id) };
      } else {
        return { ...prev, studentiIds: [...prev.studentiIds, id] };
      }
    });
  };

  const studentiAttivi = studenti.filter(s => s.attivo !== false);
  const studentiFiltrati = studentiAttivi.filter(s => {
    const nomeCompleto = `${s.nome} ${s.cognome}`.toLowerCase();
    return nomeCompleto.includes(searchStudente.toLowerCase().trim());
  });

  const studentiSelezionati = studenti.filter(s => formData.studentiIds.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-500"/>
            <h3 className="font-extrabold text-lg text-slate-900">
              {initialData?.isRischedulazione ? 'Rischedula Lezione' : 'Nuova Lezione'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tipologia: Singola vs Gruppo */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isGruppo: false }))}
              className={`flex-1 py-2 font-black rounded-xl transition-all ${!formData.isGruppo ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}
            >
              Docente Singolo
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isGruppo: true, insegnanteId: '' }))}
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
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              >
                {insegnanti.filter(i => i.attivo !== false).map(ins => (
                  <option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome} ({ins.materia})</option>
                ))}
              </select>
            </div>
          )}

          {/* Data e Orari */}
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
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Dalle</label>
              <input
                type="time"
                value={formData.oraInizio}
                onChange={(e) => setFormData(prev => ({ ...prev, oraInizio: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Alle</label>
              <input
                type="time"
                value={formData.oraFine}
                onChange={(e) => setFormData(prev => ({ ...prev, oraFine: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Materia */}
          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Materia / Argomento</label>
            <input
              type="text"
              placeholder="es. Matematica, Fisica..."
              value={formData.materia}
              onChange={(e) => setFormData(prev => ({ ...prev, materia: e.target.value }))}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Selezione Studenti con Dropdown Predittivo */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              Studenti Assegnati
            </label>

            {/* Chip degli studenti selezionati */}
            {studentiSelezionati.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50/60 rounded-xl border border-amber-200 mb-2">
                {studentiSelezionati.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center space-x-1 bg-amber-200/90 text-amber-950 font-bold px-2 py-1 rounded-lg text-[11px]"
                  >
                    <UserCheck className="w-3 h-3 text-amber-800"/>
                    <span>{s.nome} {s.cognome}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleStudente(s.id)}
                      className="ml-1 hover:text-rose-600 rounded"
                    >
                      <X className="w-3 h-3"/>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input di ricerca */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"/>
              <input
                type="text"
                placeholder="Digita per cercare lo studente..."
                value={searchStudente}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchStudente(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Tendina a comparsa: visibile solo con focus o digitazione */}
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
                        <span>{std.nome} {std.cognome}</span>
                        {isSelected && <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">Aggiunto</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Note storiche / Materiale didattico */}
          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Note / Materiale Trattato</label>
            <textarea
              rows="2"
              placeholder="Eventuali note su argomenti, compiti o richieste speciali..."
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-amber-400"
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
              {initialData?.isRischedulazione ? 'Conferma Rischedulazione' : 'Salva Lezione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
