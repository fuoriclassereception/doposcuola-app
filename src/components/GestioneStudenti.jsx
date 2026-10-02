import React, { useMemo } from 'react';
import { Plus, User, Search, Eye, Edit2, Trash2, Power, Phone, Mail, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { generaEstrattoConto } from '../utils/pricing';

export default function GestioneStudenti({ 
  studenti = [], 
  lezioni = [],
  searchQuery = '', 
  onOpenModal, 
  onSelectStudent, 
  onToggleStato, 
  onDelete 
}) {
  const studentiFiltrati = useMemo(() => {
    return (studenti || []).filter(std => {
      const q = (searchQuery || '').toLowerCase();
      const nomeCompleto = `${std.nome || ''} ${std.cognome || ''}`.toLowerCase();
      const scuola = (std.scuola || '').toLowerCase();
      const genitore = (std.genitoreNome || '').toLowerCase();
      return nomeCompleto.includes(q) || scuola.includes(q) || genitore.includes(q);
    });
  }, [studenti, searchQuery]);

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

      {/* GRIGLIA CARD STUDENTI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {studentiFiltrati.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-bold bg-white rounded-3xl border border-dashed border-slate-200">
            Nessuno studente trovato corrispondente alla ricerca.
          </div>
        ) : (
          studentiFiltrati.map(std => {
            // Calcolo esatto allineato a DettaglioStudente e Cassa
            const estratto = generaEstrattoConto(std, lezioni);
            const saldo = estratto.saldo;
            const versato = estratto.totaleVersato;
            const consumato = estratto.totaleConsumato;

            return (
              <div 
                key={std.id} 
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* INTESTAZIONE CARD */}
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

                  {/* BOXETTI CONTABILITA ALLINEATI IN TEMPO REALE */}
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

                  {/* CONTATTI GENITORE & STUDENTE */}
                  <div className="space-y-1 text-xs">
                    {std.genitoreNome && (
                      <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-200/50">
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
                </div>

                {/* PULSANTI AZIONE */}
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
