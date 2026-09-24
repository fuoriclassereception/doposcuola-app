import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, X, User, CheckCircle, FileText, Info, AlertOctagon, RotateCcw, Clock } from 'lucide-react';

export default function PlanningCalendario({
  insegnanti,
  studenti,
  lezioni,
  onDeleteLezione,
  onOpenModal,
  onSelectStudent,
  onUpdateLezioneStatus,
  onRestoreLezione,
  onUpdateLezioneOrari // Callback per aggiornare oraInizio/oraFine al drag o dal popup
}) {
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedLezioneDetail, setSelectedLezioneDetail] = useState(null);

  // Per il resizing con trascinamento dei margini
  const [resizingState, setResizingState] = useState(null); // { lezioneId, edge: 'top'|'bottom', initialY, initialTime }
  const gridRef = useRef(null);

  const orari = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const startHour = 9;
  const totalHours = 12;

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
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

  const isToday = dataSelezionata === new Date().toISOString().split('T')[0];
  const redLineTop = ((currentTimeMinutes - startHour * 60) / (totalHours * 60)) * 100;

  const lezioniAttive = lezioni.filter(l => l.data === dataSelezionata && l.stato !== 'annullata');
  const lezioniAnnullateOggi = lezioni.filter(l => l.data === dataSelezionata && l.stato === 'annullata');
  const lezioniGruppoOggi = lezioniAttive.filter(l => l.isGruppo);

  const handleStudentClick = (studentId) => {
    setShowGroupModal(false);
    setSelectedLezioneDetail(null);
    if (onSelectStudent) {
      onSelectStudent(studentId);
    }
  };

  // --- LOGICA DI DRAG & RESIZE (SCATTI DA 15 MINUTI) ---
  const handleMouseDownResize = (e, lezione, edge) => {
    e.stopPropagation();
    setResizingState({
      lezione,
      edge,
      startY: e.clientY,
      originalStart: lezione.oraInizio,
      originalEnd: lezione.oraFine
    });
  };

  useEffect(() => {
    if (!resizingState) return;

    const handleMouseMove = (e) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const deltaY = e.clientY - resizingState.startY;
      
      // Converti deltaY pixel in minuti (altezza griglia = rect.height)
      const minutesPerPixel = (totalHours * 60) / rect.height;
      let deltaMinutes = Math.round((deltaY * minutesPerPixel) / 15) * 15; // Arrotonda a multipli di 15 min

      const [hStart, mStart] = resizingState.originalStart.split(':').map(Number);
      const [hEnd, mEnd] = resizingState.originalEnd.split(':').map(Number);

      let startMins = hStart * 60 + mStart;
      let endMins = hEnd * 60 + mEnd;

      if (resizingState.edge === 'bottom') {
        endMins = Math.max(startMins + 15, endMins + deltaMinutes);
      } else if (resizingState.edge === 'top') {
        startMins = Math.min(endMins - 15, Math.max(startHour * 60, startMins + deltaMinutes));
      }

      const formatTime = (mins) => {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
      };

      if (onUpdateLezioneOrari) {
        onUpdateLezioneOrari(resizingState.lezione.id, formatTime(startMins), formatTime(endMins));
      }
    };

    const handleMouseUp = () => {
      setResizingState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingState, onUpdateLezioneOrari]);

  // Helper per incrementare/decrementare gli orari di 15 min nel Popup
  const adjustTime = (timeStr, deltaMinutes) => {
    const [h, m] = timeStr.split(':').map(Number);
    let total = h * 60 + m + deltaMinutes;
    if (total < 0) total = 0;
    if (total > 23 * 60 + 45) total = 23 * 60 + 45;
    const newH = Math.floor(total / 60).toString().padStart(2, '0');
    const newM = (total % 60).toString().padStart(2, '0');
    return `${newH}:${newM}`;
  };

  return (
    <div className="w-full h-full p-0 flex flex-col space-y-3 select-none">
      {/* Controlli Data */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 mx-4 mt-4 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl">
            <CalendarIcon className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Planning Lezioni</h2>
            <p className="text-xs text-gray-500">Trascina i margini delle lezioni per modificare la durata (+/- 15 min)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-white rounded-xl text-gray-700">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <input
            type="date"
            value={dataSelezionata}
            onChange={(e) => setDataSelezionata(e.target.value)}
            className="bg-transparent font-extrabold text-xs text-slate-900 focus:outline-none px-2"
          />
          <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-white rounded-xl text-gray-700">
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>

        <button
          onClick={() => onOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4"/>
          <span>+ Nuova Lezione</span>
        </button>
      </div>

      {/* Griglia Calendario Full Width */}
      <div className="flex-1 bg-white border-t border-b border-gray-200 overflow-x-auto flex flex-col min-h-[650px] w-full">
        <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(140px,1fr))_160px] border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 w-full min-w-[900px]">
          <div className="p-3 text-center text-[11px] font-extrabold text-gray-400 border-r border-gray-200">
            ORA
          </div>

          {insegnanti.map(ins => (
            <div key={ins.id} className="p-3 text-center border-r border-gray-200 flex flex-col items-center justify-center">
              <div style={{ backgroundColor: ins.colore || '#3b82f6' }} className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"/>
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate">
                {ins.nome}
              </span>
            </div>
          ))}

          <div
            onClick={() => setShowGroupModal(true)}
            className="p-3 text-center bg-amber-100/60 hover:bg-amber-100 border-r border-amber-300 flex flex-col items-center justify-center cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-800 mb-0.5"/>
            <span className="font-black text-xs text-amber-950 uppercase tracking-wider flex items-center">
              GRUPPO <span className="ml-1 text-[10px] bg-amber-300 text-amber-950 px-1.5 rounded-full">{lezioniGruppoOggi.length}</span>
            </span>
          </div>

          <div className="p-3 text-center bg-slate-200/80 border-l-2 border-slate-300 flex flex-col items-center justify-center">
            <AlertOctagon className="w-4 h-4 text-slate-600 mb-0.5"/>
            <span className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center">
              ANNULLATE <span className="ml-1 text-[10px] bg-slate-300 text-slate-800 px-1.5 rounded-full">{lezioniAnnullateOggi.length}</span>
            </span>
          </div>
        </div>

        {/* Corpo della Griglia */}
        <div ref={gridRef} className="relative flex-1 grid grid-cols-[60px_repeat(auto-fit,minmax(140px,1fr))_160px] w-full min-w-[900px]">
          <div className="border-r border-gray-200 bg-gray-50/40 text-center divide-y divide-gray-100">
            {orari.map(ora => (
              <div key={ora} className="h-16 text-[11px] font-extrabold text-gray-400 pt-2">
                {ora}:00
              </div>
            ))}
          </div>

          {/* Colonne Insegnanti Singoli */}
          {insegnanti.map(ins => {
            const lezioniDocente = lezioniAttive.filter(l => l.insegnanteId === ins.id && !l.isGruppo);

            return (
              <div key={ins.id} className="border-r border-gray-100 relative divide-y divide-gray-100 bg-white">
                {orari.map(ora => <div key={ora} className="h-16 hover:bg-slate-50/50"/>)}

                {lezioniDocente.map(lez => {
                  const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
                  const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
                  const topPercent = (((hStart - startHour) * 60 + mStart) / (totalHours * 60)) * 100;
                  const heightPercent = (((hEnd - hStart) * 60 + (mEnd - mStart)) / (totalHours * 60)) * 100;
                  const nomiStudenti = stdsNames(lez.studentiIds, studenti);

                  return (
                    <div
                      key={lez.id}
                      onClick={() => setSelectedLezioneDetail(lez)}
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                        backgroundColor: (ins.colore || '#3b82f6') + '20',
                        borderColor: ins.colore || '#3b82f6'
                      }}
                      className="absolute left-1 right-1 border-l-4 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between cursor-pointer group transition-all"
                    >
                      {/* Margine Superiore Trascinabile per Orario Inizio */}
                      <div
                        onMouseDown={(e) => handleMouseDownResize(e, lez, 'top')}
                        className="absolute top-0 left-0 right-0 h-2 bg-transparent group-hover:bg-slate-400/30 cursor-ns-resize rounded-t-xl"
                        title="Trascina per modificare l'orario d'inizio"
                      />

                      <div>
                        <div className="font-extrabold text-slate-900 truncate">{nomiStudenti}</div>
                        <div className="text-[10px] font-bold text-gray-600 truncate">{lez.materia || 'Materia non spec.'}</div>
                        <div className="text-[9px] font-extrabold text-gray-500 mt-0.5">{lez.oraInizio} - {lez.oraFine}</div>
                      </div>

                      {/* Margine Inferiore Trascinabile per Orario Fine */}
                      <div
                        onMouseDown={(e) => handleMouseDownResize(e, lez, 'bottom')}
                        className="absolute bottom-0 left-0 right-0 h-2 bg-transparent group-hover:bg-slate-400/30 cursor-ns-resize rounded-b-xl"
                        title="Trascina per modificare l'orario di fine (+/- 15 min)"
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Colonna GRUPPO */}
          <div onClick={() => setShowGroupModal(true)} className="border-r border-amber-200 bg-amber-50/30 relative divide-y divide-amber-100/50 cursor-pointer">
            {orari.map(ora => <div key={ora} className="h-16 hover:bg-amber-100/30"/>)}

            {lezioniGruppoOggi.map(lez => {
              const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
              const topPercent = (((hStart - startHour) * 60 + mStart) / (totalHours * 60)) * 100;
              const heightPercent = (((hEnd - hStart) * 60 + (mEnd - mStart)) / (totalHours * 60)) * 100;

              return (
                <div
                  key={lez.id}
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                  className="absolute left-1 right-1 bg-amber-200/90 border-l-4 border-amber-500 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div className="font-black text-amber-950 flex items-center justify-between">
                    <span className="truncate">👥 {lez.materia || 'Gruppo Studio'}</span>
                    <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                      {lez.studentiIds?.length || 0} ragazzi
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-amber-900 mt-0.5">
                    Orario: {lez.oraInizio} - {lez.oraFine}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Colonna ANNULLATE */}
          <div className="bg-slate-100/70 border-l-2 border-slate-300 relative divide-y divide-slate-200">
            {orari.map(ora => <div key={ora} className="h-16"/>)}

            {lezioniAnnullateOggi.map(lez => {
              const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
              const topPercent = (((hStart - startHour) * 60 + mStart) / (totalHours * 60)) * 100;
              const heightPercent = (((hEnd - hStart) * 60 + (mEnd - mStart)) / (totalHours * 60)) * 100;

              return (
                <div
                  key={lez.id}
                  onClick={() => setSelectedLezioneDetail(lez)}
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                  className="absolute left-1 right-1 bg-slate-300/80 border-l-4 border-slate-500 rounded-xl p-2 text-xs shadow-sm line-through opacity-80 cursor-pointer"
                >
                  <div className="font-extrabold text-slate-800 truncate">{stdsNames(lez.studentiIds, studenti)}</div>
                  <div className="text-[10px] font-bold text-slate-600 truncate">{lez.materia}</div>
                </div>
              );
            })}
          </div>

          {/* Linea orario rossa */}
          {isToday && redLineTop >= 0 && redLineTop <= 100 && (
            <div style={{ top: `${redLineTop}%` }} className="absolute left-0 right-0 border-b-2 border-rose-500 z-30 pointer-events-none flex items-center">
              <span className="bg-rose-500 text-white text-[9px] font-black px-1 rounded-r">ORA</span>
            </div>
          )}
        </div>
      </div>

      {/* POPUP DETTAGLIO LEZIONE CON PULSANTI ORARIO DA 15 MINUTI */}
      {selectedLezioneDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-slate-900"/>
                <h3 className="font-extrabold text-lg text-slate-900">Dettaglio e Modifica Durata</h3>
              </div>
              <button onClick={() => setSelectedLezioneDetail(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Regolazione Rapida Durata (Multipli di 15 Minuti) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="font-black text-slate-900 text-sm">{selectedLezioneDetail.materia || 'Lezione'}</div>
              
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-slate-500"/> Ora Inizio:
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      const newStart = adjustTime(selectedLezioneDetail.oraInizio, -15);
                      onUpdateLezioneOrari(selectedLezioneDetail.id, newStart, selectedLezioneDetail.oraFine);
                      setSelectedLezioneDetail({ ...selectedLezioneDetail, oraInizio: newStart });
                    }}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 font-black text-xs rounded-lg"
                  >
                    -15m
                  </button>
                  <span className="font-black text-xs px-2">{selectedLezioneDetail.oraInizio}</span>
                  <button
                    onClick={() => {
                      const newStart = adjustTime(selectedLezioneDetail.oraInizio, 15);
                      onUpdateLezioneOrari(selectedLezioneDetail.id, newStart, selectedLezioneDetail.oraFine);
                      setSelectedLezioneDetail({ ...selectedLezioneDetail, oraInizio: newStart });
                    }}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 font-black text-xs rounded-lg"
                  >
                    +15m
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-slate-500"/> Ora Fine:
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      const newEnd = adjustTime(selectedLezioneDetail.oraFine, -15);
                      onUpdateLezioneOrari(selectedLezioneDetail.id, selectedLezioneDetail.oraInizio, newEnd);
                      setSelectedLezioneDetail({ ...selectedLezioneDetail, oraFine: newEnd });
                    }}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 font-black text-xs rounded-lg"
                  >
                    -15m
                  </button>
                  <span className="font-black text-xs px-2">{selectedLezioneDetail.oraFine}</span>
                  <button
                    onClick={() => {
                      const newEnd = adjustTime(selectedLezioneDetail.oraFine, 15);
                      onUpdateLezioneOrari(selectedLezioneDetail.id, selectedLezioneDetail.oraInizio, newEnd);
                      setSelectedLezioneDetail({ ...selectedLezioneDetail, oraFine: newEnd });
                    }}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 font-black text-xs rounded-lg"
                  >
                    +15m
                  </button>
                </div>
              </div>
            </div>

            {/* Studenti */}
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Studenti Iscritti
              </label>
              <div className="space-y-1">
                {(selectedLezioneDetail.studentiIds || []).map(sId => {
                  const std = studenti.find(s => s.id === sId);
                  return (
                    <button
                      key={sId}
                      onClick={() => handleStudentClick(sId)}
                      className="w-full bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl flex items-center justify-between font-extrabold text-slate-900 text-left text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-700"/>
                        <span>{std ? `${std.nome} ${std.cognome}` : 'Studente'}</span>
                      </div>
                      <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold">
                        Vedi Scheda
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tasti azione */}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              {selectedLezioneDetail.stato === 'annullata' ? (
                <button
                  onClick={() => {
                    if (onRestoreLezione) onRestoreLezione(selectedLezioneDetail.id);
                    setSelectedLezioneDetail(null);
                  }}
                  className="px-3 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                >
                  <RotateCcw className="w-4 h-4"/>
                  <span>Ripristina</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onUpdateLezioneStatus) onUpdateLezioneStatus(selectedLezioneDetail.id, 'annullata');
                    setSelectedLezioneDetail(null);
                  }}
                  className="px-3 py-2 bg-rose-50 text-rose-700 font-bold rounded-xl text-xs flex items-center space-x-1"
                >
                  <AlertOctagon className="w-4 h-4"/>
                  <span>Annulla Lezione</span>
                </button>
              )}

              <button onClick={() => setSelectedLezioneDetail(null)} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
