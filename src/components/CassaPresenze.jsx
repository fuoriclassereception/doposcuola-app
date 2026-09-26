import React, { useState } from 'react';
import { 
  Wallet, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Euro, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Banknote, 
  Layers, 
  Search,
  Check
} from 'lucide-react';
import ModalePin from './ModalePin';

export default function CassaPresenze({
  lezioni = [],
  studenti = [],
  insegnanti = [],
  onUpdateLezioneStatus,
  aggiungiLog
}) {
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [ricerca, setRicerca] = useState('');
  const [tariffaStandard, setTariffaStandard] = useState(25); // Tariffa standard oraria indicativa
  const [pinConfig, setPinConfig] = useState({ isOpen: false, callback: null, description: '' });

  const changeDate = (days) => {
    const current = new Date(dataSelezionata);
    current.setDate(current.getDate() + days);
    setDataSelezionata(current.toISOString().split('T')[0]);
  };

  // Filtriamo le lezioni della giornata selezionata escludendo le bozze/richieste non approvate
  const lezioniGiorno = lezioni.filter(l => l.data === dataSelezionata && l.stato !== 'richiesta');

  // Calcolo durata in ore
  const getDurataOre = (oraInizio, oraFine) => {
    if (!oraInizio || !oraFine) return 1;
    const [h1, m1] = oraInizio.split(':').map(Number);
    const [h2, m2] = oraFine.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return mins > 0 ? mins / 60 : 1;
  };

  // Nomi studenti
  const getStudentiInfo = (ids = []) => {
    return ids.map(id => studenti.find(s => s.id === id)).filter(Boolean);
  };

  // Conteggi e totali cassa
  const lezioniSvolte = lezioniGiorno.filter(l => l.stato === 'svolta');
  const lezioniInProgramma = lezioniGiorno.filter(l => (!l.stato || l.stato === 'attiva'));
  const lezioniAnnullate = lezioniGiorno.filter(l => l.stato === 'annullata');

  const oreTotaliSvolte = lezioniSvolte.reduce((acc, l) => acc + getDurataOre(l.oraInizio, l.oraFine), 0);
  const incassoStimato = oreTotaliSvolte * tariffaStandard;

  // Filtraggio rapido barra di ricerca
  const lezioniFiltrate = lezioniGiorno.filter(l => {
    const stds = getStudentiInfo(l.studentiIds).map(s => `${s.nome} ${s.cognome}`).join(' ');
    const ins = insegnanti.find(i => i.id === l.insegnanteId);
    const docenteNome = ins ? `${ins.nome} ${ins.cognome}` : '';
    const query = ricerca.toLowerCase();
    return stds.toLowerCase().includes(query) || (l.materia || '').toLowerCase().includes(query) || docenteNome.toLowerCase().includes(query);
  });

  const handleSegnaPresenza = (lezione, nuovoStato, motivo = '', tipo = 'gratuito') => {
    onUpdateLezioneStatus(lezione.id, nuovoStato, motivo, tipo);
    if (aggiungiLog) {
      aggiungiLog(`Registro Presenze: Lezione ID ${lezione.id} impostata come '${nuovoStato}'`);
    }
  };

  const handleRichiediStornoPin = (lezione) => {
    setPinConfig({
      isOpen: true,
      description: `Riapertura/Storno presenza lezione ID: ${lezione.id}`,
      callback: () => {
        handleSegnaPresenza(lezione, 'attiva');
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 select-none">
      
      {/* Intestazione e Navigazione Data */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl">
            <Wallet className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Cassa & Registro Presenze</h2>
            <p className="text-xs text-gray-500 mt-0.5">Appello rapido giornaliero e controllo incassi reception</p>
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

      {/* Riquadri Statistiche e Calcolo Cassa */}
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
            <div className="text-[11px] font-bold text-gray-500">Ore Didattiche Svolte</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-3xl shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Euro className="w-6 h-6"/>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">~ {incassoStimato.toFixed(0)} €</div>
            <div className="text-[11px] font-bold text-gray-500">Valore Didattico Giornaliero</div>
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

      {/* Lista Presenze / Appello del Giorno */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900">Appello Giornaliero ({lezioniGiorno.length} lezioni)</h3>
            <p className="text-xs text-gray-500">Segna la presenza al termine della lezione per aggiornare la cassa e il planning</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"/>
            <input
              type="text"
              placeholder="Filtra studente o materia..."
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
              const quotaStimata = (durata * tariffaStandard).toFixed(0);

              const isSvolta = lez.stato === 'svolta';
              const isAnnullata = lez.stato === 'annullata';

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
                  {/* Info Lezione */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-slate-900">
                        {stds.length > 0 ? stds.map(s => `${s.nome} ${s.cognome}`).join(', ') : 'Studente non specificato'}
                      </span>
                      {lez.isGruppo && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                          Gruppo Studio
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 font-medium flex items-center space-x-3">
                      <span>🕒 {lez.oraInizio} - {lez.oraFine} ({durata.toFixed(1)} ore)</span>
                      <span>•</span>
                      <span>{lez.materia || 'Doposcuola'}</span>
                      {ins && (
                        <>
                          <span>•</span>
                          <span className="text-slate-800 font-bold">Docente: {ins.nome}</span>
                        </>
                      )}
                    </div>

                    <div className="text-[11px] font-extrabold text-amber-900">
                      Valore stimato: {quotaStimata} €
                    </div>
                  </div>

                  {/* Pulsanti Rapidi Presenza / Ricevuta */}
                  <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    {!isSvolta && !isAnnullata && (
                      <>
                        <button
                          onClick={() => handleSegnaPresenza(lez, 'svolta')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5"/>
                          <span>Presente (Svolta)</span>
                        </button>

                        <button
                          onClick={() => handleSegnaPresenza(lez, 'annullata', 'Assente non giustificato', 'addebito')}
                          className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition-all"
                        >
                          Assente (Addebito)
                        </button>
                      </>
                    )}

                    {isSvolta && (
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-xl flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1"/> Svolta & Conteggiata
                        </span>
                        <button
                          onClick={() => handleRichiediStornoPin(lez)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                          title="Riapri o correggi presenza con PIN"
                        >
                          Storna
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
                          Ripristina
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

      {/* Modale PIN Isolato per le modifiche a lezioni già chiuse */}
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
