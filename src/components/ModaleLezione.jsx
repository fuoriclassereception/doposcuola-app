import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, User, Users } from 'lucide-react';

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

  // Popola automaticamente i campi se arrivano dati dalla selezione su planning (drag o tasto destro)
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        data: initialData.data || prev.data,
        oraInizio: initialData.oraInizio || prev.oraInizio,
        oraFine: initialData.oraFine || prev.oraFine,
        insegnanteId: initialData.insegnanteId !== undefined ? initialData.insegnanteId : prev.insegnanteId,
        isGruppo: initialData.isGruppo !== undefined ? initialData.isGruppo : prev.isGruppo
      }));
    } else if (insegnanti.length > 0 && !formData.insegnanteId) {
      setFormData(prev => ({ ...prev, insegnanteId: insegnanti[0].id }));
    }
  }, [initialData, isOpen, insegnanti]);

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-500"/>
            <h3 className="font-extrabold text-lg text-slate-900">Nuova Lezione</h3>
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

          {/* Docente (disabilitato se gruppo) */}
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
              placeholder="es. Matematica, Aiuto compiti..."
              value={formData.materia}
              onChange={(e) => setFormData(prev => ({ ...prev, materia: e.target.value }))}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Selezione Studenti */}
          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Seleziona Studente/i</label>
            <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-2xl p-2 space-y-1 bg-gray-50/50">
              {studenti.filter(s => s.attivo !== false).map(std => {
                const isSelected = formData.studentiIds.includes(std.id);
                return (
                  <div
                    key={std.id}
                    onClick={() => handleToggleStudente(std.id)}
                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer font-bold transition-colors ${isSelected ? 'bg-amber-100 text-slate-950 border border-amber-300' : 'bg-white hover:bg-gray-100 text-slate-700'}`}
                  >
                    <span>{std.nome} {std.cognome}</span>
                    <input type="checkbox" checked={isSelected} readOnly className="rounded text-amber-500 pointer-events-none"/>
                  </div>
                );
              })}
            </div>
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
              Salva Lezione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
