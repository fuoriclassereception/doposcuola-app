import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2 } from 'lucide-react';

export default function PlanningCalendario({
  insegnanti,
  studenti,
  lezioni,
  onSaveLezione,
  onDeleteLezione,
  onOpenModal
}) {
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Orari visibili nell'agenda (dalle 09:00 alle 20:00)
  const orari = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      setCurrentTimeMinutes(mins);
    };
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const changeDate = (days) => {
    const current = new Date(dataSelezionata);
    current.setDate(current.getDate() + days);
    setDataSelezionata(current.toISOString().split('T')[0]);
  };

  // Calcola posizione della linea orario rossa
  const startHour = 9;
  const totalHours = 12;
  const isToday = dataSelezionata === new Date().toISOString().split('T')[0];
  const redLineTop = ((currentTimeMinutes - startHour * 60) / (totalHours * 60)) * 100;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      {/* Intestazione e Controlli Data */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl">
            <CalendarIcon className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Planning Lezioni</h2>
            <p className="text-xs text-gray-500">Vista giornaliera per docente e gruppo</p>
          </div>
        </div>

        {/* Selettore Data */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-white rounded-xl text-gray-700 transition-all"
          >
            <ChevronLeft className="w-4 h-4"/>
          </button>

          <input
            type="date"
            value={dataSelezionata}
            onChange={(e) => setDataSelezionata(e.target.value)}
            className="bg-transparent font-extrabold text-xs text-slate-900 focus:outline-none px-2"
          />

          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-white rounded-xl text-gray-700 transition-all"
          >
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>

        <button
          onClick={() => onOpenModal()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4"/>
          <span>+ Nuova Lezione</span>
        </button>
      </div>

      {/* Griglia Calendario Stile Foglio/Agenda */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Intestazione Colonne (Insegnanti + GRUPPO) */}
        <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(140px,1fr))] border-b border-gray-200 bg-gray-50/80 sticky top-0 z-20">
          <div className="p-3 text-center text-[11px] font-extrabold text-gray-400 border-r border-gray-200">
            ORA
          </div>

          {insegnanti.map(ins => (
            <div key={ins.id} className="p-3 text-center border-r border-gray-200 flex flex-col items-center">
              <div
                style={{ backgroundColor: ins.colore || '#3b82f6' }}
                className="w-3 h-3 rounded-full mb-1 shadow-sm"
              />
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate max-w-[120px]">
                {ins.nome}
              </span>
            </div>
          ))}

          {/* Colonna GRUPPO Sempre Presente all'estrema destra */}
          <div className="p-3 text-center bg-amber-50/80 border-l-2 border-amber-300 flex flex-col items-center">
            <Users className="w-3.5 h-3.5 text-amber-700 mb-1"/>
            <span className="font-black text-xs text-amber-950 uppercase tracking-wider">
              GRUPPO
            </span>
          </div>
        </div>

        {/* Corpo della Griglia con Ore e Colonne */}
        <div className="relative flex-1 grid grid-cols-[60px_repeat(auto-fit,minmax(140px,1fr))]">
          {/* Indicatori Orari a Sinistra */}
          <div className="border-r border-gray-200 bg-gray-50/40 text-center divide-y divide-gray-100">
            {orari.map(ora => (
              <div key={ora} className="h-16 text-[11px] font-extrabold text-gray-400 pt-2">
                {ora}:00
              </div>
            ))}
          </div>

          {/* Colonne Insegnanti */}
          {insegnanti.map(ins => {
            const lezioniDocente = lezioni.filter(
              l => l.data === dataSelezionata && l.insegnanteId === ins.id && !l.isGruppo
            );

            return (
              <div key={ins.id} className="border-r border-gray-100 relative divide-y divide-gray-100 bg-white">
                {orari.map(ora => (
                  <div key={ora} className="h-16 hover:bg-slate-50/50 transition-all"/>
                ))}

                {/* Render Lezioni Docente */}
                {lezioniDocente.map(lez => {
                  const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
                  const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
                  
                  const topMinutes = (hStart - startHour) * 60 + mStart;
                  const durationMinutes = (hEnd - hStart) * 60 + (mEnd - mStart);

                  const topPercent = (topMinutes / (totalHours * 60)) * 100;
                  const heightPercent = (durationMinutes / (totalHours * 60)) * 100;

                  const nomiStudenti = stdsNames(lez.studentiIds, studenti);

                  return (
                    <div
                      key={lez.id}
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                        backgroundColor: (ins.colore || '#3b82f6') + '20',
                        borderColor: ins.colore || '#3b82f6'
                      }}
                      className="absolute left-1 right-1 border-l-4 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between group transition-all"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 truncate">
                          {nomiStudenti}
                        </div>
                        <div className="text-[10px] font-bold text-gray-600 truncate">
                          {lez.materia || 'Materia non specificata'}
                        </div>
                        <div className="text-[9px] font-extrabold text-gray-500 mt-0.5">
                          {lez.oraInizio} - {lez.oraFine}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteLezione(lez.id)}
                        className="opacity-0 group-hover:opacity-100 self-end p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-all"
                      >
                        <Trash2 className="w-3 h-3"/>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Colonna GRUPPO */}
          <div className="border-l-2 border-amber-200 bg-amber-50/20 relative divide-y divide-amber-100/50">
            {orari.map(ora => (
              <div key={ora} className="h-16 hover:bg-amber-100/30 transition-all"/>
            ))}

            {/* Render Lezioni Gruppo */}
            {lezioni.filter(l => l.data === dataSelezionata && l.isGruppo).map(lez => {
              const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
              
              const topMinutes = (hStart - startHour) * 60 + mStart;
              const durationMinutes = (hEnd - hStart) * 60 + (mEnd - mStart);

              const topPercent = (topMinutes / (totalHours * 60)) * 100;
              const heightPercent = (durationMinutes / (totalHours * 60)) * 100;

              const nomiStudenti = stdsNames(lez.studentiIds, studenti);

              return (
                <div
                  key={lez.id}
                  style={{
                    top: `${topPercent}%`,
                    height: `${heightPercent}%`,
                  }}
                  className="absolute left-1 right-1 bg-amber-200/80 border-l-4 border-amber-500 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="font-black text-amber-950 truncate">
                      👥 {nomiStudenti}
                    </div>
                    <div className="text-[10px] font-bold text-amber-900 truncate">
                      {lez.materia || 'Gruppo Studio'}
                    </div>
                    <div className="text-[9px] font-extrabold text-amber-800 mt-0.5">
                      {lez.oraInizio} - {lez.oraFine}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteLezione(lez.id)}
                    className="opacity-0 group-hover:opacity-100 self-end p-1 text-rose-700 hover:bg-rose-100 rounded-md transition-all"
                  >
                    <Trash2 className="w-3 h-3"/>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Linea orario corrente in tempo reale */}
          {isToday && redLineTop >= 0 && redLineTop <= 100 && (
            <div
              style={{ top: `${redLineTop}%` }}
              className="absolute left-0 right-0 border-b-2 border-rose-500 z-30 pointer-events-none flex items-center"
            >
              <span className="bg-rose-500 text-white text-[9px] font-black px-1 rounded-r shadow-sm">
                ORA
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Funzione helper per risalire ai nomi degli studenti dal loro ID
function stdsNames(studentiIds = [], studenti = []) {
  if (!studentiIds || studentiIds.length === 0) return 'Nessuno studente';
  return studentiIds
    .map(id => {
      const s = studenti.find(std => std.id === id);
      return s ? `${s.nome} ${s.cognome[0]}.` : '';
    })
    .filter(Boolean)
    .join(', ');
}
