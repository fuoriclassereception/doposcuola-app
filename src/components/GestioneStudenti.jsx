import React, { useMemo, useState } from 'react';
import { Plus, User, Search, Eye, Edit2, Trash2, Power, Phone, Mail, FileText, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { generaEstrattoConto } from '../utils/pricing';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function GestioneStudenti({ 
  studenti = [], 
  lezioni = [],
  searchQuery = '', 
  onOpenModal, 
  onSelectStudent, 
  onToggleStato, 
  onDelete 
}) {
  const [sendingEmailId, setSendingEmailId] = useState(null);

  const studentiFiltrati = useMemo(() => {
    return (studenti || []).filter(std => {
      const q = (searchQuery || '').toLowerCase();
      const nomeCompleto = `${std.nome || ''} ${std.cognome || ''}`.toLowerCase();
      const scuola = (std.scuola || '').toLowerCase();
      const genitore = (std.genitoreNome || '').toLowerCase();
      return nomeCompleto.includes(q) || scuola.includes(q) || genitore.includes(q);
    });
  }, [studenti, searchQuery]);

  // Invio email automatica in background dalla card
  const handleInviaEmailAutomatica = async (std) => {
    const emailDest = std.genitoreEmail || std.email;
    if (!emailDest) return alert("Questo studente non ha un indirizzo email registrato.");

    const baseUrl = window.location.origin;
    setSendingEmailId(std.id);

    try {
      await addDoc(collection(db, 'mail'), {
        to: emailDest,
        message: {
          subject: "Accesso all'App FuoriClasse",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #0f172a;">Benvenuto su <span style="color: #f59e0b;">FuoriClasse</span>!</h2>
              <p>Gentile <b>${std.genitoreNome || std.nome}</b>,</p>
              <p>puoi accedere alla tua area personale FuoriClasse con la tua email: <b>${emailDest}</b>.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Accedi all'App ➔
                </a>
              </div>
            </div>
          `
        },
        createdAt: serverTimestamp()
      });

      alert(`✅ Email inviata in background a ${emailDest}!`);
    } catch (err) {
      console.error(err);
      alert("Errore invio email.");
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleInviaWhatsApp = (std) => {
    const tel = (std.genitoreTelefono || std.telefono || '').replace(/\D/g, '');
    if (!tel) return alert("Nessun numero di telefono inserito.");
    const baseUrl = window.location.origin;
    const msg = `Ciao ${std.genitoreNome || std.nome}! Ecco il link per accedere all'App FuoriClasse:\n${baseUrl}\nAccedi con la tua email per vedere orari e saldo plafond.`;
    window.open(`https://wa.me/39${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Anagrafica Studenti</h1>
          <p className="text-xs text-slate-500 mt-1">Gestione allievi, accordi tariffari e stato dei plafond.</p>
        </div>
        <button
          onClick={() => onOpenModal && onOpenModal(null)}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4"/> + Nuovo Studente
        </button>
      </div>

      {/* GRIGLIA CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {studentiFiltrati.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-bold bg-white rounded-3xl border border-dashed border-slate-200">
            Nessuno studente trovato corrispondente alla ricerca.
          </div>
        ) : (
          studentiFiltrati.map(std => {
            const estratto = generaEstrattoConto(std, lezioni);
            const saldo = estratto.saldo;
            const versato = estratto.totaleVersato;
            const consumato = estratto.totaleConsumato;

            return (
              <div 
                key={std.id} 
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
                        {std.nome?.charAt(0)}{std.cognome?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base leading-tight">
                          {std.nome} {std.cognome}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {std.categoriaTariffaria || std.scuola || 'Primaria'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${std.attivo !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      {std.attivo !== false ? 'Iscritto' : 'Inattivo'}
                    </span>
                  </div>

                  {/* BOXETTI CONTABILITA */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center mb-3">
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Plafond</span>
                      <span className="text-xs font-black text-slate-800">€ {versato.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Consumato</span>
                      <span className="text-xs font-black text-slate-800">€ {consumato.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Saldo</span>
                      <span className={`text-xs font-black ${saldo < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {saldo > 0 ? '+' : ''}{saldo.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* CONTATTI */}
                  <div className="space-y-1 text-xs">
                    {std.genitoreNome && (
                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50">
                        <p className="text-[11px] font-extrabold text-amber-950 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-700"/> Genitore: {std.genitoreNome}
                        </p>
                        {std.genitoreTelefono && (
                          <p className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400"/> {std.genitoreTelefono}
                          </p>
                        )}
                        {std.genitoreEmail && (
                          <p className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400"/> {std.genitoreEmail}
                          </p>
                        )}
                      </div>
                    )}

                    {std.telefono && (
                      <p className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 px-1">
                        <Phone className="w-3 h-3 text-slate-400"/> Allievo: {std.telefono}
                      </p>
                    )}
                  </div>

                  {/* TASTI RAPIDI DI INVITO RAPIDO APP (WHATSAPP + EMAIL AUTOMATICA) */}
                  <div className="flex gap-2 pt-2.5">
                    <button
                      type="button"
                      onClick={() => handleInviaWhatsApp(std)}
                      className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-xl text-[11px] flex items-center justify-center gap-1 transition border border-emerald-200"
                    >
                      <Send className="w-3 h-3"/> WA
                    </button>
                    <button
                      type="button"
                      disabled={sendingEmailId === std.id}
                      onClick={() => handleInviaEmailAutomatica(std)}
                      className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-xl text-[11px] flex items-center justify-center gap-1 transition border border-blue-200 disabled:opacity-50"
                    >
                      <Mail className="w-3 h-3"/> {sendingEmailId === std.id ? 'Invio...' : 'Email'}
                    </button>
                  </div>
                </div>

                {/* PULSANTI AZIONE IN BASSO */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleStato && onToggleStato(std.id)}
                      className={`p-2 rounded-xl transition ${std.attivo !== false ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}
                      title={std.attivo !== false ? 'Disattiva' : 'Attiva'}
                    >
                      <Power className="w-4 h-4"/>
                    </button>
                    <button
                      onClick={() => onOpenModal && onOpenModal(std)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                      title="Modifica Anagrafica"
                    >
                      <Edit2 className="w-4 h-4"/>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Sei sicuro di voler eliminare lo studente ${std.nome} ${std.cognome}?`)) {
                          onDelete && onDelete(std.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectStudent && onSelectStudent(std.id)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5"/> Scheda
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
