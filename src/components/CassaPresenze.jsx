import React, { useState, useMemo } from 'react';
import { 
  Wallet, ArrowDownRight, ArrowUpRight, Search, 
  PlusCircle, AlertTriangle, CheckCircle, CreditCard, DollarSign, Calendar
} from 'lucide-react';
import { generaEstrattoConto } from '../utils/pricing';

export default function CassaPresenze({ studenti = [], lezioni = [], onSelectStudent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState('tutti'); // 'tutti', 'debito', 'credito'

  // Calcola la situazione contabile aggregata per ogni studente
  const studentiConSaldo = useMemo(() => {
    return (studenti || []).map(std => {
      const estratto = generaEstrattoConto(std, lezioni);
      return {
        ...std,
        saldoCalcolato: estratto.saldo,
        totaleVersatoCalcolato: estratto.totaleVersato,
        totaleConsumatoCalcolato: estratto.totaleConsumato,
        movimenti: estratto.movimenti
      };
    });
  }, [studenti, lezioni]);

  // Calcoli globali della scuola
  const metricheGlobali = useMemo(() => {
    let incassoTotale = 0;
    let consumoTotale = 0;
    let debitoComplessivo = 0;

    studentiConSaldo.forEach(s => {
      incassoTotale += s.totaleVersatoCalcolato;
      consumoTotale += s.totaleConsumatoCalcolato;
      if (s.saldoCalcolato < 0) {
        debitoComplessivo += Math.abs(s.saldoCalcolato);
      }
    });

    return {
      incassoTotale,
      consumoTotale,
      debitoComplessivo,
      saldoScuola: incassoTotale - consumoTotale
    };
  }, [studentiConSaldo]);

  // Filtro ricerca e stato
  const studentiFiltrati = studentiConSaldo.filter(s => {
    const matchNome = `${s.nome || ''} ${s.cognome || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchNome) return false;
    if (filtroSaldo === 'debito') return s.saldoCalcolato < 0;
    if (filtroSaldo === 'credito') return s.saldoCalcolato > 0;
    return true;
  });

  return (
    <div className="p-6 space-y-6 select-none max-w-7xl mx-auto">
      
      {/* HEADER CRUSCOTTO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-amber-500" />
            Cassa & Gestione Plafond
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Libro mastro unificato: monitoraggio incassi, lezioni erogate e crediti delle famiglie.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
            {studentiConSaldo.length} Studenti Registrati
          </span>
        </div>
      </div>

      {/* METRICHE FINANZIARIE GLOBALI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <ArrowDownRight className="w-4 h-4 text-emerald-600"/> Totale Incassi Registrati
          </p>
          <p className="text-2xl font-black text-slate-900">€ {metricheGlobali.incassoTotale.toFixed(2)}</p>
          <span className="text-[10px] font-bold text-emerald-600">Entrate storiche plafond</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-blue-600"/> Totale Lezioni Erogate
          </p>
          <p className="text-2xl font-black text-slate-900">€ {metricheGlobali.consumoTotale.toFixed(2)}</p>
          <span className="text-[10px] font-bold text-blue-600">Servizi didattici svolti</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600"/> Scoperto Totale (Debiti Famiglie)
          </p>
          <p className="text-2xl font-black text-rose-600">€ {metricheGlobali.debitoComplessivo.toFixed(2)}</p>
          <span className="text-[10px] font-bold text-rose-500">Crediti da riscuotere</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-amber-500"/> Saldo Globale Plafond
          </p>
          <p className={`text-2xl font-black ${metricheGlobali.saldoScuola >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            € {metricheGlobali.saldoScuola.toFixed(2)}
          </p>
          <span className="text-[10px] font-bold text-slate-400">Plafond ancora disponibile</span>
        </div>

      </div>

      {/* FILTRI E RICERCA STUDENTE */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
          <input
            type="text"
            placeholder="Cerca studente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setFiltroSaldo('tutti')}
            className={`px-3 py-1.5 rounded-xl transition ${filtroSaldo === 'tutti' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Tutti ({studentiConSaldo.length})
          </button>
          <button
            onClick={() => setFiltroSaldo('debito')}
            className={`px-3 py-1.5 rounded-xl transition ${filtroSaldo === 'debito' ? 'bg-rose-50 text-rose-700 shadow font-black' : 'text-slate-500 hover:text-slate-900'}`}
          >
            In Debito ({studentiConSaldo.filter(s => s.saldoCalcolato < 0).length})
          </button>
          <button
            onClick={() => setFiltroSaldo('credito')}
            className={`px-3 py-1.5 rounded-xl transition ${filtroSaldo === 'credito' ? 'bg-emerald-50 text-emerald-700 shadow font-black' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Con Credito ({studentiConSaldo.filter(s => s.saldoCalcolato > 0).length})
          </button>
        </div>

      </div>

      {/* TABELLA POSIZIONI CONTABILI */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-6">Studente</th>
              <th className="py-4 px-6">Tariffa Applicata</th>
              <th className="py-4 px-6 text-right">Tot. Versato</th>
              <th className="py-4 px-6 text-right">Tot. Scalato</th>
              <th className="py-4 px-6 text-right">Saldo Plafond</th>
              <th className="py-4 px-6 text-center">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {studentiFiltrati.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 font-bold">
                  Nessuna posizione contabile trovata.
                </td>
              </tr>
            ) : (
              studentiFiltrati.map(std => {
                const inDebito = std.saldoCalcolato < 0;

                return (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-6">
                      <div className="font-black text-slate-900 text-sm">
                        {std.nome} {std.cognome}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {std.scuola || std.categoriaTariffaria || 'Primaria'} • {std.genitoreEmail || 'Email N.D.'}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 font-bold text-slate-700">
                      {std.haTariffaRiservata ? (
                        <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px] font-black">
                          Convenzione {std.tariffaRiservataValore} €/h
                        </span>
                      ) : (
                        <span className="text-slate-600">Standard</span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-right font-black text-slate-800">
                      € {std.totaleVersatoCalcolato.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-6 text-right font-bold text-slate-500">
                      € {std.totaleConsumatoCalcolato.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <span className={`px-2.5 py-1 rounded-xl font-black text-xs inline-block ${inDebito ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                        {std.saldoCalcolato > 0 ? '+' : ''}{std.saldoCalcolato.toFixed(2)} €
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-center">
                      <button
                        onClick={() => onSelectStudent && onSelectStudent(std.id)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black transition shadow-xs"
                      >
                        Estratto Conto ➔
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
