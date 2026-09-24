import React from 'react';
import { X } from 'lucide-react';

export default function ModaleInsegnante({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEditing,
  colorOptions
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-extrabold text-base text-gray-900">
            {isEditing ? 'Modifica Insegnante' : 'Nuovo Insegnante'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                required
                placeholder="Es. Marco"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cognome *</label>
              <input
                type="text"
                required
                placeholder="Es. Bianchi"
                value={formData.cognome}
                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Materia / Disciplina *</label>
            <input
              type="text"
              required
              placeholder="Es. Pianoforte, Canto, Matematica..."
              value={formData.materia}
              onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Telefono</label>
              <input
                type="text"
                placeholder="Es. 333 1234567"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="docente@email.it"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Colore Calendario</label>
            <div className="flex space-x-2">
              {colorOptions.map((c) => (
                <button
                  key={c.class}
                  type="button"
                  onClick={() => setFormData({ ...formData, colore: c.class })}
                  className={`w-6 h-6 rounded-full ${c.class} ${formData.colore === c.class ? 'ring-2 ring-offset-2 ring-slate-900' : 'opacity-70'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
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
              Salva Scheda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
