import React from 'react';
import { X, UserPlus, Tag, ShieldCheck } from 'lucide-react';
import { TARIFFE_STANDARD } from '../utils/tariffeConfig';

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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-amber-500"/>
            <h3 className="font-extrabold text-lg text-slate-900">
              {isEditing ? 'Modifica Studente' : 'Nuovo Iscritto FuoriClasse'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          {/* Dati Base Studente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Nome Studente</label>
              <input
                type="text"
                required
                value={formData.nome || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Cognome</label>
              <input
                type="text"
                required
                value={formData.cognome || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Data di Nascita</label>
              <input
                type="date"
                value={formData.dataNascita || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dataNascita: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Scuola / Classe</label>
              <input
                type="text"
                placeholder="es. 2° Media Galilei"
                value={formData.scuola || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, scuola: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* INQUADRAMENTO TARIFFARIO & MARKETING */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-amber-600"/>
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Inquadramento Tariffario</h4>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Categoria Scolastica (Tariffa Base)</label>
              <select
                value={formData.categoriaTariffaria || 'medie'}
                onChange={(e) => setFormData(prev => ({ ...prev, categoriaTariffaria: e.target.value }))}
                className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-slate-900 focus:outline-none"
              >
                {Object.values(TARIFFE_STANDARD).filter(t => t.id !== 'gruppo').map(tar => (
                  <option key={tar.id} value={tar.id}>
                    {tar.label} — {tar.prezzoOrarioDefault.toFixed(2)} €/h
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox Tariffa Riservata */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.haTariffaRiservata)}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    haTariffaRiservata: e.target.checked,
                    tariffaRiservataValore: e.target.checked ? (prev.tariffaRiservataValore || 20) : ''
                  }))}
                  className="rounded text-amber-500 w-4 h-4"
                />
                <span className="font-extrabold text-slate-900">Applica Tariffa Riservata (Accordo / Sconto Speciale)</span>
              </label>

              {formData.haTariffaRiservata && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Prezzo Concordato (€/h)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={formData.tariffaRiservataValore || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tariffaRiservataValore: e.target.value }))}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-black text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Motivo / Tipo Accordo</label>
                    <input
                      type="text"
                      placeholder="es. Sconto fratelli / 40h anticipate"
                      value={formData.tariffaRiservataMotivo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tariffaRiservataMotivo: e.target.value }))}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dati Genitore Referente (Intestatario Quietanza Fiscale) */}
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-sky-700"/>
              <h4 className="font-black text-sky-950 text-xs uppercase tracking-wider">Intestatario Pagamenti (Genitore)</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-sky-900 uppercase mb-1">Nome e Cognome Genitore</label>
                <input
                  type="text"
                  placeholder="Mario Rossi"
                  value={formData.genitoreNome || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genitoreNome: e.target.value }))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-sky-900 uppercase mb-1">Codice Fiscale Genitore</label>
                <input
                  type="text"
                  placeholder="RSSMRA80A01H501U"
                  value={formData.genitoreCodiceFiscale || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genitoreCodiceFiscale: e.target.value.toUpperCase() }))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl font-bold text-slate-900 uppercase focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-sky-900 uppercase mb-1">Telefono Genitore</label>
                <input
                  type="tel"
                  value={formData.genitoreTelefono || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genitoreTelefono: e.target.value }))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-sky-900 uppercase mb-1">Email Genitore (per ricevute)</label>
                <input
                  type="email"
                  value={formData.genitoreEmail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genitoreEmail: e.target.value }))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>
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
              Salva Scheda Studente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
