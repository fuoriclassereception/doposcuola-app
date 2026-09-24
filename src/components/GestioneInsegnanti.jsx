import React from 'react';
import { Plus, Phone, Mail, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GestioneInsegnanti({
  insegnanti,
  searchQuery,
  onOpenModal,
  onToggleStato,
  onDelete
}) {
  const filteredInsegnanti = insegnanti.filter(i =>
    `${i.nome} ${i.cognome} ${i.materia}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Intestazione Sezione (senza la parola Operatori) */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Gestione Insegnanti</h2>
          <p className="text-xs text-gray-500 mt-1">Anagrafica dei docenti abilitati alle lezioni e alla presenza nel planning</p>
        </div>
        <button
          onClick={() => onOpenModal()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4"/>
          <span>+ Nuovo Insegnante</span>
        </button>
      </div>

      {/* Griglia Card Insegnanti */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInsegnanti.map((ins) => (
          <div key={ins.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-sm ${ins.colore}`}>
                    {ins.nome[0]}{ins.cognome[0]}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">{ins.nome} {ins.cognome}</h3>
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                      {ins.materia || 'Materia non specificata'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onToggleStato(ins.id)}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    ins.attivo
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                >
                  {ins.attivo ? 'Attivo' : 'Inattivo'}
                </button>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400"/>
                  <span>{ins.telefono || 'Telefono non inserito'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400"/>
                  <span>{ins.email || 'Email non inserita'}</span>
                </div>

                <div className="pt-2 flex items-center space-x-1.5 text-[11px]">
                  {ins.gdprConfermato ? (
                    <span className="text-emerald-700 font-bold flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600"/> GDPR Confermato da App
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center">
                      <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-500"/> GDPR In attesa di conferma dall'App
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end space-x-2">
              <button
                onClick={() => onDelete(ins.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold px-2.5 border border-rose-200 flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1"/> Elimina
              </button>
              <button
                onClick={() => onOpenModal(ins)}
                className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold px-3 border border-gray-200 flex items-center"
              >
                <Edit className="w-3.5 h-3.5 mr-1"/> Modifica
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
