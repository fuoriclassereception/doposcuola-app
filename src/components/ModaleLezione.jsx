import React, { useState, useEffect } from 'react';
import { X, Clock, User, BookOpen, Users, Lock, AlertTriangle } from 'lucide-react';

export default function ModaleLezione({
  isOpen,
  onClose,
  onSave,
  insegnanti,
  studenti,
  initialData
}) {
  const [formData, setFormData] = useState({
    insegnanteId: '',
    isGruppo: false,
    studentiIds: [],
    materia: '',
    oraInizio: '14:00',
    oraFine: '15:00',
    note: ''
  });

  const [requiresPin, setRequiresPin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        insegnanteId: initialData.insegnanteId || '',
        isGruppo: initialData.isGruppo || false,
        studentiIds: initialData.studentiIds || (initialData.studenteId ? [initialData.studenteId] : []),
        materia: initialData.materia || '',
        oraInizio: initialData.oraInizio || '14:00',
        oraFine: initialData.oraFine || '15:00',
        note: initialData.note || ''
      });
    } else {
      setFormData({
        insegnanteId: insegnanti[0]?.id || '',
        isGruppo: false,
        studentiIds: [],
        materia: '',
        oraInizio: '14:00',
        oraFine: '15:00',
        note: ''
      });
    }
    setRequiresPin(false);
    setAdminPin('');
    setPinError(false);
  }, [initialData, isOpen, insegnanti]);

  if (!isOpen) return null;

  const handleStudentToggle = (id) => {
    if (formData.isGruppo) {
      if (formData.studentiIds.includes(id)) {
        setFormData({ ...formData, studentiIds: formData.studentiIds.filter(sId => sId !== id) });
      } else {
        setFormData({ ...formData, studentiIds: [...formData.studentiIds, id] });
      }
    } else {
      setFormData({ ...formData, studentiIds: [id] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.studentiIds.length === 0) {
      alert('Seleziona almeno uno studente per la lezione.');
      return;
    }

    // Se stiamo per salvare e c'è richiesta di PIN
    if (requiresPin) {
      if (adminPin !== '1234') { // PIN predefinito Amministratore / Reception
        setPinError(true);
        return;
      }
    }

    // Chiamata di salvataggio
    const success = onSave(formData, requiresPin);
    if (!success) {
      // Se c'è una sovrapposizione non autorizzata, richiedi il PIN
      setRequiresPin(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              {initialData?.id ? 'Modifica Lezione' : 'Nuova Lezione'}
            </h3>
            <p className="text-xs text-gray-500">Programma la lezione nel calendario dell'agenda</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sezione Avviso Sovrapposizione e PIN */}
          {requiresPin && (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl space-y-3">
              <div className="flex items-start space-x-2 text-amber-800 text-xs font-semibold">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0"/>
                <span>
                  <strong>Attenzione:</strong> Questo docente ha già una lezione programmata in questo orario. Inserisci il <strong>PIN Amministratore/Reception</strong> per forzare la sovrapposizione.
                </span>
              </div>
              <div className="flex space-x-2 items-center">
                <div className="relative flex-1">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-amber-700"/>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Inserisci PIN (es. 1234)"
                    value={adminPin}
                    onChange={(e) => { setAdminPin(e.target.value); setPinError(false); }}
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-amber-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              {pinError && <p className="text-[11px] font-bold text-rose-600">PIN non corretto. Riprova.</p>}
            </div>
          )}

          {/* Selezione Tipo Colonna */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Destinazione / Colonna</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isGruppo: false })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  !formData.isGruppo
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4"/>
                <span>Docente Singolo</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isGruppo: true })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  formData.isGruppo
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4"/>
                <span>Colonna GRUPPO</span>
              </button>
            </div>
          </div>

          {/* Selezione Insegnante (se non è gruppo) */}
          {!formData.isGruppo && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Insegnante</label>
              <select
                value={formData.insegnanteId}
                onChange={(e) => setFormData({ ...formData, insegnanteId: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                {insegnanti.map(ins => (
                  <option key={ins.id} value={ins.id}>
                    {ins.nome} {ins.cognome} ({ins.materia || 'Generico'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Orari */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Ora Inizio</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                <input
                  type="time"
                  value={formData.oraInizio}
                  onChange={(e) => setFormData({ ...formData, oraInizio: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Ora Fine</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                <input
                  type="time"
                  value={formData.oraFine}
                  onChange={(e) => setFormData({ ...formData, oraFine: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Materia / Argomento */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Materia o Argomento</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
              <input
                type="text"
                placeholder="Es. Matematica, Aiuto Compiti, Inglese..."
                value={formData.materia}
                onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Selezione Studente/i */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              {formData.isGruppo ? 'Seleziona Studenti per il Gruppo' : 'Seleziona Studente'}
            </label>
            <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50 space-y-1">
              {studenti.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">Nessuno studente in anagrafica.</p>
              ) : (
                studenti.map(std => {
                  const isSelected = formData.studentiIds.includes(std.id);
                  return (
                    <div
                      key={std.id}
                      onClick={() => handleStudentToggle(std.id)}
                      className={`p-2 rounded-lg cursor-pointer text-xs font-bold flex justify-between items-center transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      <span>{std.nome} {std.cognome}</span>
                      <span className="text-[10px] opacity-75">{std.scuola || ''}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tasti finale */}
          <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md"
            >
              {requiresPin ? 'Sblocca e Salva Lezione' : 'Salva Lezione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
