import React, { useState, useEffect } from 'react';
import { X, Clock, User, BookOpen, Users, Lock, AlertTriangle, Search, Check, Calendar } from 'lucide-react';

export default function ModaleLezione({
  isOpen,
  onClose,
  onSave,
  insegnanti,
  studenti,
  lezioni,
  initialData
}) {
  const [formData, setFormData] = useState({
    insegnanteId: '',
    isGruppo: false,
    studentiSelezionati: [], // [{ id, nome, cognome, dataNascita }]
    materia: '',
    oraInizio: '14:00',
    oraFine: '15:00',
    note: ''
  });

  // Stato Ricerca Studente
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stato Gestione Conflitti & PIN
  const [doubleBookingWarning, setDoubleBookingWarning] = useState(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        insegnanteId: initialData.insegnanteId || '',
        isGruppo: initialData.isGruppo || false,
        studentiSelezionati: initialData.studentiSelezionati || [],
        materia: initialData.materia || '',
        oraInizio: initialData.oraInizio || '14:00',
        oraFine: initialData.oraFine || '15:00',
        note: initialData.note || ''
      });
    } else {
      setFormData({
        insegnanteId: insegnanti[0]?.id || '',
        isGruppo: false,
        studentiSelezionati: [],
        materia: '',
        oraInizio: '14:00',
        oraFine: '15:00',
        note: ''
      });
    }
    setSearchTerm('');
    setDoubleBookingWarning(null);
    setRequiresPin(false);
    setAdminPin('');
    setPinError(false);
  }, [initialData, isOpen, insegnanti]);

  if (!isOpen) return null;

  // Risultati Ricerca Studenti (si attiva dalla 3a lettera)
  const filteredStudenti = searchTerm.trim().length >= 3
    ? studenti.filter(s => {
        const query = searchTerm.toLowerCase();
        const fullName = `${s.nome} ${s.cognome}`.toLowerCase();
        return fullName.includes(query);
      })
    : [];

  const handleSelectStudent = (std) => {
    if (formData.isGruppo) {
      if (!formData.studentiSelezionati.some(s => s.id === std.id)) {
        setFormData({
          ...formData,
          studentiSelezionati: [...formData.studentiSelezionati, std]
        });
      }
    } else {
      setFormData({ ...formData, studentiSelezionati: [std] });
    }
    setSearchTerm('');
  };

  const handleRemoveStudent = (id) => {
    setFormData({
      ...formData,
      studentiSelezionati: formData.studentiSelezionati.filter(s => s.id !== id)
    });
  };

  const handleSubmit = (e, isForced = false) => {
    if (e) e.preventDefault();

    if (formData.studentiSelezionati.length === 0) {
      alert('Seleziona almeno uno studente per inserire la lezione.');
      return;
    }

    // Controllo Doppio Inserimento Studente nello stesso orario
    if (!isForced && !doubleBookingWarning) {
      const dataOggi = new Date().toISOString().split('T')[0];
      const conflitti = [];

      formData.studentiSelezionati.forEach(std => {
        const giaPresente = lezioni.find(l => 
          l.data === dataOggi &&
          (l.studentiIds || []).includes(std.id) &&
          ((formData.oraInizio >= l.oraInizio && formData.oraInizio < l.oraFine) ||
           (formData.oraFine > l.oraInizio && formData.oraFine <= l.oraFine))
        );
        if (giaPresente) {
          conflitti.push({ studente: std, lezione: giaPresente });
        }
      });

      if (conflitti.length > 0) {
        setDoubleBookingWarning(conflitti);
        return; // Mostra alert di avviso
      }
    }

    // Controllo PIN per Sovrapposizione Docente
    if (requiresPin) {
      if (adminPin !== '1234') {
        setPinError(true);
        return;
      }
    }

    const payload = {
      ...formData,
      studentiIds: formData.studentiSelezionati.map(s => s.id)
    };

    const success = onSave(payload, requiresPin || isForced);
    if (!success) {
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

        {/* ALERT: Avviso Doppio Inserimento Studente */}
        {doubleBookingWarning ? (
          <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl space-y-3">
            <div className="flex items-start space-x-2 text-rose-900 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"/>
              <div>
                <p className="font-black text-rose-950 text-sm">Attenzione: Studente già impegnato!</p>
                <p className="mt-1">
                  I seguenti studenti risultano già inseriti in un'altra lezione in questa fascia oraria:
                </p>
                <ul className="list-disc pl-4 mt-1 font-bold text-rose-800">
                  {doubleBookingWarning.map((c, idx) => (
                    <li key={idx}>
                      {c.studente.nome} {c.studente.cognome} ({c.lezione.oraInizio} - {c.lezione.oraFine})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-rose-200">
              <button
                type="button"
                onClick={() => setDoubleBookingWarning(null)}
                className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 font-bold rounded-xl text-xs hover:bg-rose-100"
              >
                Annulla Inserimento
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(null, true)}
                className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 shadow-sm"
              >
                Forza Comunque
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            {/* ALERT PIN Sovrapposizione Docente */}
            {requiresPin && (
              <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl space-y-3">
                <div className="flex items-start space-x-2 text-amber-800 text-xs font-semibold">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0"/>
                  <span>
                    <strong>Orario Occupato:</strong> Inserisci il <strong>PIN Amministratore</strong> per forzare la sovrapposizione docente.
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-amber-700"/>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="PIN (es. 1234)"
                    value={adminPin}
                    onChange={(e) => { setAdminPin(e.target.value); setPinError(false); }}
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-amber-300 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                {pinError && <p className="text-[11px] font-bold text-rose-600">PIN errato. Riprova.</p>}
              </div>
            )}

            {/* Scelta Colonna */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Destinazione / Colonna</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isGruppo: false, studentiSelezionati: formData.studentiSelezionati.slice(0, 1) })}
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

            {/* Seleziona Docente (se non gruppo) */}
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

            {/* Materia */}
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

            {/* Ricerca Rapida Studente (dalla 3a lettera) */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700">
                {formData.isGruppo ? 'Cerca e aggiungi Studenti al Gruppo' : 'Cerca Studente'}
              </label>

              {/* Studenti già selezionati */}
              {formData.studentiSelezionati.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {formData.studentiSelezionati.map(std => (
                    <span key={std.id} className="inline-flex items-center bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      {std.nome} {std.cognome}
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(std.id)}
                        className="ml-1.5 hover:text-amber-400"
                      >
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                <input
                  type="text"
                  placeholder="Digita almeno 3 lettere del nome o cognome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />

                {/* Dropdown Risultati Filtro */}
                {searchTerm.trim().length >= 3 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-30 divide-y divide-gray-100">
                    {filteredStudenti.length === 0 ? (
                      <p className="p-3 text-xs text-gray-400 text-center font-medium">Nessun studente trovato.</p>
                    ) : (
                      filteredStudenti.map(std => {
                        const isAlreadySelected = formData.studentiSelezionati.some(s => s.id === std.id);

                        return (
                          <div
                            key={std.id}
                            onClick={() => !isAlreadySelected && handleSelectStudent(std)}
                            className={`p-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs transition-all ${
                              isAlreadySelected ? 'opacity-50 pointer-events-none' : ''
                            }`}
                          >
                            <div>
                              <span className="font-extrabold text-slate-900">{std.nome} {std.cognome}</span>
                              {std.dataNascita && (
                                <span className="text-[11px] font-medium text-gray-400 ml-2">
                                  — nato/a il {std.dataNascita}
                                </span>
                              )}
                            </div>
                            {isAlreadySelected && <Check className="w-4 h-4 text-emerald-600"/>}
                          </div>
                        );
                      })
                    )}
                  </div>
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
                {requiresPin ? 'Sblocca e Salva' : 'Salva Lezione'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
