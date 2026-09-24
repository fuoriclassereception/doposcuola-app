import React, { useState } from 'react';
import { Plus, Phone, Mail, Edit, Trash2, CheckCircle2, AlertCircle, UserCheck, Send, KeyRound } from 'lucide-react';

export default function GestioneStudenti({
  studenti,
  searchQuery,
  onOpenModal,
  onToggleStato,
  onDelete
}) {
  const [invitedIds, setInvitedIds] = useState({});

  const filteredStudenti = studenti.filter(s =>
    `${s.nome} ${s.cognome} ${s.scuola || ''} ${s.genitoreNome || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendInvite = (std) => {
    const targetEmail = std.isMinorenne ? std.genitoreEmail : std.email;
    const targetNome = std.isMinorenne ? `Genitore di ${std.nome}` : std.nome;

    if (!targetEmail) {
      alert(`Attenzione: inserisci un'email per ${targetNome} per poter inviare l'invito.`);
      return;
    }

    setInvitedIds(prev => ({ ...prev, [std.id]: true }));
    alert(`Email di invito per l'accesso all'App inviata con successo a ${targetNome} (${targetEmail})!`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Intestazione Sezione */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Anagrafica Studenti & Genitori</h2>
          <p className="text-xs text-gray-500 mt-1">Gestione allievi, recapiti dei genitori e invio credenziali App</p>
        </div>
        <button
          onClick={() => onOpenModal()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4"/>
          <span>+ Nuovo Studente</span>
        </button>
      </div>

      {/* Griglia Card Studenti */}
      {filteredStudenti.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <p className="text-sm font-bold text-gray-400">Nessun studente presente in anagrafica.</p>
          <p className="text-xs text-gray-400 mt-1">Clicca su "+ Nuovo Studente" per inserire la prima scheda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudenti.map((std) => {
            const isInvited = invitedIds[std.id] || std.invitoInviato;

            return (
              <div key={std.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  {/* Intestazione Card Studente */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm shadow-sm">
                        {std.nome?.[0]}{std.cognome?.[0]}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900">{std.nome} {std.cognome}</h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {std.scuola || 'Scuola non spec.'}
                          </span>
                          {std.isMinorenne && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                              Minorenne
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleStato(std.id)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        std.attivo
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                    >
                      {std.attivo ? 'Iscritto' : 'Inattivo'}
                    </button>
                  </div>

                  {/* Recapiti e Sezione Genitore */}
                  <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
                    {std.isMinorenne ? (
                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 text-xs space-y-1">
                        <p className="font-bold text-amber-900 flex items-center">
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-amber-700"/> Genitore: {std.genitoreNome}
                        </p>
                        <div className="flex items-center space-x-2 text-amber-800">
                          <Phone className="w-3 h-3 text-amber-600"/>
                          <span>{std.genitoreTelefono || 'Tel. non inserito'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-amber-800">
                          <Mail className="w-3 h-3 text-amber-600"/>
                          <span>{std.genitoreEmail || 'Email non inserita'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400"/>
                          <span>{std.telefono || 'Telefono non inserito'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400"/>
                          <span>{std.email || 'Email non inserita'}</span>
                        </div>
                      </div>
                    )}

                    {/* Stato Invito App e GDPR */}
                    <div className="pt-2 flex flex-col space-y-1 text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        {isInvited ? (
                          <span className="text-amber-700 font-bold flex items-center">
                            <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-600"/> Invito App Inviato
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium flex items-center">
                            <KeyRound className="w-3.5 h-3.5 mr-1 text-gray-400"/> App non attivata
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {std.gdprConfermato ? (
                          <span className="text-emerald-700 font-bold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600"/> GDPR Firmato
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

                {/* Tasti Modifica / Elimina / Invita */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleSendInvite(std)}
                    className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold px-2.5 border border-amber-300 flex items-center transition-all bg-amber-50"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5"/> {isInvited ? 'Reinvia Invito' : 'Invia Invito App'}
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => onDelete(std.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold px-2.5 border border-rose-200 flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1"/> Elimina
                    </button>
                    <button
                      onClick={() => onOpenModal(std)}
                      className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold px-3 border border-gray-200 flex items-center"
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
    </div>
  );
}
