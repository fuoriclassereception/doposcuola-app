import React from 'react';
import { X, UserCheck, ShieldAlert } from 'lucide-react';

export default function ModaleStudente({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEditing
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Intestazione Modale */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-base text-gray-900">
              {isEditing ? 'Modifica Scheda Studente' : 'Nuovo Studente'}
            </h3>
            <p className="text-xs text-gray-500">Inserisci i dati anagrafici e del referente legale</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          {/* Sezione 1: Dati Studente */}
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Dati dello Studente</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Studente *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Luca"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cognome Studente *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Rossi"
                  value={formData.cognome}
                  onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Data di Nascita</label>
                <input
                  type="date"
                  value={formData.dataNascita || ''}
                  onChange={(e) => setFormData({ ...formData, dataNascita: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Scuola / Indirizzo di Studi</label>
                <input
                  type="text"
                  placeholder="Es. Liceo Scientifico, III Media..."
                  value={formData.scuola || ''}
                  onChange={(e) => setFormData({ ...formData, scuola: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefono Studente</label>
                <input
                  type="text"
                  placeholder="Es. 333 9988776"
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Studente</label>
                <input
                  type="email"
                  placeholder="luca.rossi@email.it"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Selezione Minorenne / Maggiorenne */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Lo studente è minorenne?</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isMinorenne}
                onChange={(e) => setFormData({ ...formData, isMinorenne: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Sezione 2: Dati Genitore / Tutore (Mostrati se Minorenne) */}
          {formData.isMinorenne && (
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center">
                <UserCheck className="w-4 h-4 mr-1.5 text-amber-600"/> Dati Genitore / Tutore Legale
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome e Cognome Genitore *</label>
                  <input
                    type="text"
                    required={formData.isMinorenne}
                    placeholder="Es. Mario Rossi"
                    value={formData.genitoreNome || ''}
                    onChange={(e) => setFormData({ ...formData, genitoreNome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefono Genitore *</label>
                  <input
                    type="text"
                    required={formData.isMinorenne}
                    placeholder="Es. 338 1234567"
                    value={formData.genitoreTelefono || ''}
                    onChange={(e) => setFormData({ ...formData, genitoreTelefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Genitore</label>
                  <input
                    type="email"
                    placeholder="genitore@email.it"
                    value={formData.genitoreEmail || ''}
                    onChange={(e) => setFormData({ ...formData, genitoreEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Codice Fiscale Genitore (per fatturazione)</label>
                  <input
                    type="text"
                    placeholder="Es. RSSMRA80A01H501U"
                    value={formData.genitoreCodiceFiscale || ''}
                    onChange={(e) => setFormData({ ...formData, genitoreCodiceFiscale: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 bg-white uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Note Didattiche / DSA */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Note Didattiche / Segnalazioni (DSA, Obiettivi, ecc.)</label>
            <textarea
              rows="2"
              placeholder="Inserisci eventuali informazioni utili per le lezioni..."
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Bottoni di Azione */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-sm"
            >
              Salva Scheda Studente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
