import React, { useState } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Euro, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import ModalePin from './ModalePin';

export default function CassaPresenze({
  lezioni = [],
  studenti = [],
  insegnanti = [],
  onConfermaPresenzaConScalo,
  onStornoPresenzaConRipristino,
  aggiungiLog
}) {
  // Data locale YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dataSelezionata, setDataSelezionata] = useState(getTodayStr());
  const [ricerca, setRicerca] = useState('');
  const [tariffaStandard, setTariffaStandard] = useState(25);
  const [pinConfig, setPinConfig] = useState({ isOpen: false, callback: null, description: '' });

  const changeDate = (days) => {
    const current = new Date(dataSelezionata + 'T12:00:00');
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setDataSelezionata(`${year}-${month}-${day}`);
  };

  // Filtriamo le lezioni del giorno ignorando maiuscole/minuscole nello stato
  const lezioniGiorno = lezioni.filter(l => {
    const statoLower = (l.stato || '').toLowerCase();
    return l.data === dataSelezionata && statoLower !== 'richiesta';
  });

  const getDurataOre = (oraInizio, oraFine) => {
    if (!oraInizio || !oraFine) return 1;
    const [h1, m1] = oraInizio.split(':').map(Number);
    const [h2, m2] = oraFine.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return mins > 0 ? mins / 60 : 1;
  };

  const getStudentiInfo = (ids = []) => {
    return ids.map(id => studenti.find(s => s.id === id)).filter(Boolean);
  };

  const lezioniSvolte = lezioniGiorno.filter(l => (l.stato || '').toLowerCase() === 'svolta');
  const lezioniAnnullate = lezioniGiorno.filter(l => (l.stato || '').toLowerCase() === 'annullata');

  const oreTotaliSvolte = lezioniSvolte.reduce((acc, l) => acc + getDurataOre(l.oraInizio, l.oraFine), 0);
  const incassoStimato = oreTotaliSvolte * tariffaStandard;

  const lezioniFiltrate = lezioniGiorno.filter(l => {
    const stds = getStudentiInfo(l.studentiIds).map(s => `${s.nome} ${s.cognome}`).join(' ');
    const ins = insegnanti.find(i => i.id === l.insegnanteId);
    const docenteNome = ins ? `${ins.nome} ${ins.cognome}` : '';
    const query = ricerca.toLowerCase();
    return stds.toLowerCase().includes(query) || (l.materia || '').toLowerCase().includes(query) || docenteNome.toLowerCase().includes(query);
  });

  const handleSegnaPresenza = (lezione) => {
    const durata = getDurataOre(lezione.oraInizio, lezione.oraFine);
    if (onConfermaPresenzaConScalo) {
      onConfermaPresenzaConScalo(lezione, durata);
    }
  };

  const handleSegnaAssenza = (lezione, tipo) => {
    const durata = getDurataOre(lezione.oraInizio, lezione.oraFine);
    if (tipo === 'addebito') {
      if (onConfermaPresenzaConScalo) {
        onConfermaPresenzaConScalo(lezione, durata, 'annullata', 'Assente non giustificato', 'addebito');
      }
    } else {
      if (onConfermaPresenzaConScalo) {
        onConfermaPresenzaConScalo(lezione, 0, 'annullata', 'Assente giustificato', 'gratuito');
      }
    }
  };

  const handleRichiediStornoPin = (lezione) => {
    const durata = getDurataOre(lezione.oraInizio, lezione.oraFine);
    setPinConfig({
      isOpen: true,
      description: `Storno presenza e riaccredito ore per lezione ID: ${lezione.id}`,
      callback: () => {
        if (onStornoPresenzaConRipristino) {
          onStornoPresenzaConRipristino(lezione, durata);
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 select-none">
      
      {/* Intestazione */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl">
            <Wallet className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Cassa & Presenze FuoriClasse</h2>
            <p className="text-xs text-gray-500 mt-0.5">Appello presenze e scalo automatico dai pacchetti ore</p>
          </div>
        </div>

        {/* Selettore Giorno */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-xl text-gray-700 transition-all">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <input
            type="date"
            value={dataSelezionata}
            onChange={(e) => setDataSelezionata(e.target.value)}
            className="bg-transparent font-black text-xs text-slate-900 focus:outline-none px-2"
          />
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded-xl text-gray-700 transition-all">
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Riquadri Statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-3xl shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6"/>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{lezioniSvolte.length}</div>
            <div className="text-[11px] font-bold text-gray-500">Lezioni Concluse</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-3xl shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <Clock className="w-6 h-6"/>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{oreTotaliSvolte.toFixed(1)} h</div>
            <div className="text-[11px] font-bold text-gray-500">Ore Scalate/Erogate</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-3xl shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Euro className="w-6 h-6"/>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">~ {incassoStimato.toFixed(0)} €</div>
            <div className="text-[11px] font-bold text-gray-500">Valore Didattico Giorno</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-3xl shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertOctagon className="w-6 h-6"/>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{lezioniAnnullate.length}</div>
            <div className="text-[11px] font-bold text-gray-500">Assenze / Annullate</div>
          </div>
        </div>
      </div>

      {/* Lista Presenze */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900">Registro Lezioni del Giorno ({lezioniGiorno.length})</h3>
            <p className="text-xs text-gray-500">Segnando "Svolta" le ore vengono scalate dal saldo dello studente</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"/>
            <input
              type="text"
              placeholder="Cerca studente o docente..."
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {lezioniFiltrate.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs font-bold">
            Nessuna lezione programmata per la data selezionata ({dataSelezionata}).
          </div>
        ) : (
          <div className="space-y-3">
            {lezioniFiltrate.map((lez) => {
              const stds = getStudentiInfo(lez.studentiIds);
              const ins = insegnanti.find(i => i.id === lez.insegnanteId);
              const durata = getDurataOre(lez.oraInizio, lez.oraFine);

              const statoNorm = (lez.stato || '').toLowerCase();
              const isSvolta = statoNorm === 'svolta';
              const isAnnullata = statoNorm === 'annullata';

              return (
                <div 
                  key={lez.id} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    isSvolta 
                      ? 'bg-emerald-50/40 border-emerald-200' 
                      : isAnnullata 
                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                        : 'bg-white border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {/* Info Lezione + Saldo Residuo Studente */}
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="font-black text-sm text-slate-900">
                        {stds.length > 0 ? stds.map(s => `${s.nome} ${s.cognome}`).join(', ') : 'Studente N.D.'}
                      </span>
                      {lez.isGruppo && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                          Gruppo Studio
                        </span>
                      )}
                      
                      {stds.map(s => {
                        const residuo = Number(((s.oreAcquistate || 0) - (s.oreSvolte || 0)).toFixed(1));
                        return (
                          <span 
                            key={s.id} 
                            className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                              residuo > 2 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : residuo > 0 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {residuo <= 0 && <AlertTriangle className="w-3 h-3"/>}
                            {s.nome}: {residuo}h rimaste
                          </span>
                        );
                      })}
                    </div>
                    
                    <div className="text-xs text-gray-600 font-medium flex items-center space-x-2 flex-wrap">
                      <span>🕒 {lez.oraInizio} - {lez.oraFine} ({durata.toFixed(1)}h)</span>
                      <span>•</span>
                      <span>{lez.materia || 'Doposcuola'}</span>
                      {ins && (
                        <>
                          <span>•</span>
                          <span className="text-slate-800 font-bold">Docente: {ins.nome}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pulsanti Rapidi */}
                  <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    {!isSvolta && !isAnnullata && (
                      <>
                        <button
                          onClick={() => handleSegnaPresenza(lez)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5"/>
                          <span>Presente (Scala {durata.toFixed(1)}h)</span>
                        </button>

                        <button
                          onClick={() => handleSegnaAssenza(lez, 'addebito')}
                          className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition-all"
                        >
                          Assente (Addebita)
                        </button>
                      </>
                    )}

                    {isSvolta && (
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-xl flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1"/> Svolta & Scalata
                        </span>
                        <button
                          onClick={() => handleRichiediStornoPin(lez)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                          title="Storna presenza e restituisci ore con PIN"
                        >
                          Storna (PIN)
                        </button>
                      </div>
                    )}

                    {isAnnullata && (
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-200 text-slate-800 text-xs font-black px-3 py-1.5 rounded-xl line-through">
                          Annullata
                        </span>
                        <button
                          onClick={() => handleRichiediStornoPin(lez)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                        >
                          Ripristina (PIN)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ModalePin
        isOpen={pinConfig.isOpen}
        descrizione={pinConfig.description}
        onClose={() => setPinConfig({ isOpen: false, callback: null, description: '' })}
        onSuccess={() => {
          if (pinConfig.callback) pinConfig.callback();
          setPinConfig({ isOpen: false, callback: null, description: '' });
        }}
      />

    </div>
  );
}
