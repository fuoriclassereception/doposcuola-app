import React, { useState } from 'react';
import { Plus, Phone, Mail, Edit, Trash2, CheckCircle2, AlertCircle, Send, KeyRound } from 'lucide-react';
import ModalePin from './ModalePin';

export default function GestioneInsegnanti({
  insegnanti = [],
  searchQuery = '',
  onOpenModal,
  onToggleStato,
  onDelete
}) {
  const [invitedIds, setInvitedIds] = useState({});
  const [pinConfig, setPinConfig] = useState({ isOpen: false, docenteId: null, docenteNome: '' });

  const filteredInsegnanti = insegnanti.filter(i =>
    `${i.nome || ''} ${i.cognome || ''} ${i.materia || ''}`.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleSendInvite = (ins) => {
    if (!ins.email) {
      alert("Attenzione: è necessario inserire un'email valida per inviare l'invito d'accesso.");
      return;
    }
    setInvitedIds(prev => ({ ...prev, [ins.id]: true }));
    alert(`Email di invito per la creazione della password inviata con successo a: ${ins.email}`);
  };

  const richiestaEliminazione = (ins) => {
    setPinConfig({
      isOpen: true,
      docenteId: ins.id,
      docenteNome: `${ins.nome} ${ins.cognome}`
    });
  };

  const confermaEliminazione = () => {
    if (onDelete && pinConfig.docenteId) {
      onDelete(pinConfig.docenteId);
    }
    setPinConfig({ isOpen: false, docenteId: null, docenteNome: '' });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Intestazione Sezione */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Gestione Insegnanti</h2>
          <p className="text-xs text-gray-500 mt-1">Anagrafica dei docenti e stato di attivazione nel planning</p>
        </div>
        <button
          onClick={() => onOpenModal && onOpenModal()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4"/>
          <span>+ Nuovo Insegnante</span>
        </button>
      </div>

      {/* Griglia Card Insegnanti */}
      {filteredInsegnanti.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <p className="text-sm font-bold text-gray-400">Nessun insegnante trovato.</p>
          <p className="text-xs text-gray-400 mt-1">Clicca su "+ Nuovo Insegnante" per inserire un docente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsegnanti.map((ins) => {
            const isInvited = invitedIds[ins.id] || ins.invitoInviato;

            return (
              <div key={ins.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        style={{ backgroundColor: ins.colore || '#3b82f6' }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-sm"
                      >
                        {ins.nome?.[0]}{ins.cognome?.[0]}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900">{ins.nome} {ins.cognome}</h3>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          {ins.materia || 'Materia non specificata'}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Attivo / Inattivo */}
                    <button
                      onClick={() => onToggleStato && onToggleStato(ins.id)}
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                        ins.attivo !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Clicca per attivare o disattivare dal planning"
                    >
                      {ins.attivo !== false ? '● Attivo' : '○ Inattivo'}
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

                    {/* Stato Invito App & GDPR */}
                    <div className="pt-2 flex flex-col space-y-1 text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        {isInvited ? (
                          <span className="text-indigo-600 font-bold flex items-center">
                            <KeyRound className="w-3.5 h-3.5 mr-1 text-indigo-500"/> Invito App inviato (In attesa di registrazione)
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium flex items-center">
                            <KeyRound className="w-3.5 h-3.5 mr-1 text-gray-400"/> App non attivata
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {ins.gdprConfermato ? (
                          <span className="text-emerald-700 font-bold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600"/> GDPR Confermato da App
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-500"/> GDPR In attesa di firma
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pulsanti Azione */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleSendInvite(ins)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold px-2.5 border border-indigo-200 flex items-center transition-all"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5"/> {isInvited ? 'Reinvia Invito' : 'Invia Invito App'}
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => richiestaEliminazione(ins)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold px-2.5 border border-rose-200 flex items-center transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1"/> Elimina
                    </button>
                    <button
                      onClick={() => onOpenModal && onOpenModal(ins)}
                      className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold px-3 border border-gray-200 flex items-center transition-all"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1"/> Modifica
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale PIN isolato per cancellazione sicura */}
      <ModalePin
        isOpen={pinConfig.isOpen}
        descrizione={`Eliminazione docente: ${pinConfig.docenteNome}`}
        onClose={() => setPinConfig({ isOpen: false, docenteId: null, docenteNome: '' })}
        onSuccess={confermaEliminazione}
      />
    </div>
  );
}
