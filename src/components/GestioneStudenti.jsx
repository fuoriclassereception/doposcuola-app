import React, { useState } from 'react';
import { Plus, Phone, Mail, Trash2, CheckCircle2, AlertCircle, UserCheck, KeyRound, User, MessageCircle, Sparkles } from 'lucide-react';

export default function GestioneStudenti({
  studenti,
  searchQuery,
  onOpenModal, // Per il pulsante "+ Nuovo Studente"
  onSelectStudent, // Per aprire la Scheda Completa dello studente
  onToggleStato,
  onDelete
}) {
  const [sendingEmailId, setSendingEmailId] = useState(null);

  const filteredStudenti = studenti.filter(s =>
    `${s.nome} ${s.cognome} ${s.scuola || ''} ${s.genitoreNome || ''}`.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleInviaWhatsApp = (std) => {
    const rawTel = std.isMinorenne ? (std.genitoreTelefono || std.telefono) : (std.telefono || std.genitoreTelefono);
    const tel = (rawTel || '').replace(/\D/g, '');

    if (!tel) {
      alert(`Attenzione: inserisci un recapito telefonico per ${std.nome} o per il genitore prima di inviare via WhatsApp.`);
      return;
    }

    const numeroCompleto = tel.startsWith('39') ? tel : `39${tel}`;
    const nomeDest = std.isMinorenne ? `Genitore di ${std.nome}` : std.nome;
    const linkApp = typeof window !== 'undefined' ? window.location.origin : 'https://fuoriclasse.vercel.app';
    const emailRif = (std.isMinorenne ? std.genitoreEmail : std.email) || 'la tua email';

    const messaggio = `Ciao ${nomeDest}! Ti diamo il benvenuto a FuoriClasse 📚\n\nAbbiamo attivato il profilo per *${std.nome}*.\nPer visualizzare il calendario lezioni, consultare il saldo ore e verificare le presenze, puoi accedere alla nostra Web App da questo link:\n${linkApp}\n\nAl primo accesso inserisci l'email *${emailRif}* e imposta la tua password personale cliccando su 'Primo Accesso / Password dimenticata'.\n\nA presto!\nLa Segreteria di FuoriClasse`;

    window.open(`https://wa.me/${numeroCompleto}?text=${encodeURIComponent(messaggio)}`, '_blank');
  };

  const handleInviaEmail = async (std) => {
    const targetEmail = std.isMinorenne ? (std.genitoreEmail || std.email) : (std.email || std.genitoreEmail);
    const targetNome = `${std.nome} ${std.cognome || ''}`.trim();

    if (!targetEmail) {
      alert(`Attenzione: inserisci un'email valida per ${std.nome} per poter inviare l'invito.`);
      return;
    }

    setSendingEmailId(std.id);

    try {
      const res = await fetch('/api/invito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          nomeStudente: targetNome,
          linkApp: typeof window !== 'undefined' ? window.location.origin : 'https://fuoriclasse.vercel.app'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Email di invito inviata con successo a ${targetEmail}!`);
      } else {
        alert(`❌ Errore nell'invio: ${data.message || 'Riprova più tardi'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Errore di connessione durante l'invio dell'email.");
    } finally {
      setSendingEmailId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Intestazione Sezione */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Anagrafica Studenti & Genitori</h2>
          <p className="text-xs text-gray-500 mt-1">Gestione allievi, recapiti e invio credenziali App</p>
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
            const versato = Number(std.totaleVersato || 0);
            const consumato = Number(std.totaleConsumato || 0);
            const saldo = versato - consumato;

            return (
              <div key={std.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm shadow-sm">
                        {std.nome?.[0]}{std.cognome?.[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-gray-900">{std.nome} {std.cognome}</h3>
                          {std.isProvvisorio && (
                            <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5"/> Prova
                            </span>
                          )}
                        </div>
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
                        std.attivo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                    >
                      {std.attivo ? 'Iscritto' : 'Inattivo'}
                    </button>
                  </div>

                  {/* MINI DASHBOARD FINANZIARIA */}
                  <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-center border-r border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Plafond</p>
                      <p className="font-black text-slate-700 text-xs">€ {versato.toFixed(2)}</p>
                    </div>
                    <div className="text-center border-r border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Consumato</p>
                      <p className="font-black text-slate-700 text-xs">€ {consumato.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Saldo</p>
                      <p className={`font-black text-xs ${saldo < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {saldo > 0 ? '+' : ''}€ {saldo.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
                    {std.isMinorenne ? (
                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 text-xs space-y-1">
                        <p className="font-bold text-amber-900 flex items-center">
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-amber-700"/> Genitore: {std.genitoreNome || 'Da specificare'}
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

                    <div className="pt-2 flex flex-col space-y-1 text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        {std.appAttivata ? (
                          <span className="text-emerald-700 font-bold flex items-center">
                            <KeyRound className="w-3.5 h-3.5 mr-1 text-emerald-600"/> App Attivata
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

                {/* PULSANTI DI AZIONE CARD */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Tasti Rapidi Invito */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleInviaWhatsApp(std)}
                      className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold px-2.5 border border-emerald-300 flex items-center transition-all bg-emerald-50 shadow-sm"
                      title="Invia link e invito via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600"/> WhatsApp
                    </button>

                    <button
                      type="button"
                      disabled={sendingEmailId === std.id}
                      onClick={() => handleInviaEmail(std)}
                      className="p-1.5 text-sky-800 hover:bg-sky-100 rounded-lg text-xs font-bold px-2.5 border border-sky-300 flex items-center transition-all bg-sky-50 shadow-sm disabled:opacity-50"
                      title="Invia credenziali via Email in automatico"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1 text-sky-600"/> 
                      {sendingEmailId === std.id ? 'Invio in corso...' : 'Email'}
                    </button>
                  </div>

                  {/* Tasti Gestione */}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => onDelete(std.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold px-2.5 border border-rose-200 flex items-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1"/> Elimina
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectStudent && onSelectStudent(std.id)}
                      className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold px-3 flex items-center shadow-sm transition-colors"
                    >
                      <User className="w-3.5 h-3.5 mr-1"/> Apri Scheda
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
