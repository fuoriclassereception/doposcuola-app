import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, X, User, CheckCircle, FileText, Info, AlertOctagon, RotateCcw, Clock, Lock, ShieldAlert, Paperclip, ArrowRightLeft, UserMinus, GripHorizontal } from 'lucide-react';

export default function PlanningCalendario({
  insegnanti,
  studenti,
  lezioni,
  onDeleteLezione,
  onOpenModal,
  onSelectStudent,
  onUpdateLezioneStatus,
  onRestoreLezione,
  onUpdateLezioneCompleta,
  onEstraiStudenteDaGruppo
}) {
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Modali
  const [groupModalData, setGroupModalData] = useState(null);
  const [selectedLezioneDetail, setSelectedLezioneDetail] = useState(null);

  // Modale Estrazione Studente Singolo (con Data inclusa)
  const [estrazioneData, setEstrazioneData] = useState(null);
  const [estrazioneForm, setEstrazioneForm] = useState({ data: '', insegnanteId: '', oraInizio: '15:00', oraFine: '16:00' });

  // Modale Annullamento
  const [lezioneDaAnnullare, setLezioneDaAnnullare] = useState(null);
  const [motivoAnnullamento, setMotivoAnnullamento] = useState('');
  const [tipoAnnullamento, setTipoAnnullamento] = useState('gratuito');

  // Spostamento da Dettaglio
  const [isEditingMove, setIsEditingMove] = useState(false);
  const [moveForm, setMoveForm] = useState({ data: '', oraInizio: '', oraFine: '', insegnanteId: '', isGruppo: false });

  // PIN e Drag / Resize
  const [pendingMove, setPendingMove] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [resizingLezione, setResizingLezione] = useState(null);

  const pinInputRef = useRef(null);

  // Slot orari divisi ogni 30 minuti (dalle 9:00 alle 20:00)
  const slots30 = [];
  for (let h = 9; h < 20; h++) {
    slots30.push({ oraStr: `${h.toString().padStart(2, '0')}:00`, totalMins: h * 60 });
    slots30.push({ oraStr: `${h.toString().padStart(2, '0')}:30`, totalMins: h * 60 + 30 });
  }
  const startHourMins = 9 * 60;
  const totalHoursMins = 11 * 60; // 9:00 - 20:00 = 11 ore

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pendingMove) {
      const timer = setTimeout(() => pinInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [pendingMove]);

  const changeDate = (days) => {
    const current = new Date(dataSelezionata);
    current.setDate(current.getDate() + days);
    setDataSelezionata(current.toISOString().split('T')[0]);
  };

  const isToday = dataSelezionata === new Date().toISOString().split('T')[0];
  const redLineTop = ((currentTimeMinutes - startHourMins) / totalHoursMins) * 100;

  const lezioniAttive = lezioni.filter(l => l.data === dataSelezionata && l.stato !== 'annullata');
  const lezioniAnnullateOggi = lezioni.filter(l => l.data === dataSelezionata && l.stato === 'annullata');
  const lezioniGruppoOggi = lezioniAttive.filter(l => l.isGruppo);

  // RAGGRUPPAMENTO COLONNA GRUPPO
  const gruppiFusiMap = {};
  lezioniGruppoOggi.forEach(l => {
    const key = `${l.oraInizio}-${l.oraFine}`;
    if (!gruppiFusiMap[key]) {
      gruppiFusiMap[key] = { oraInizio: l.oraInizio, oraFine: l.oraFine, lezioni: [] };
    }
    gruppiFusiMap[key].lezioni.push(l);
  });
  const gruppiFusiList = Object.values(gruppiFusiMap);

  // DRAG & DROP SULLE MEZZE ORE
  const handleDragStart = (e, payloadData) => {
    e.dataTransfer.setData('application/json', JSON.stringify(payloadData));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetInsegnanteId, targetIsGruppo = false, targetOraStr) => {
    e.preventDefault();
    const dataJson = e.dataTransfer.getData('application/json');
    if (!dataJson) return;

    const payload = JSON.parse(dataJson);
    const [tH, tM] = targetOraStr.split(':').map(Number);
    const startMinsNew = tH * 60 + tM;

    if (payload.isGruppoFuso) {
      const firstLez = payload.lezioni[0];
      const [hStart, mStart] = firstLez.oraInizio.split(':').map(Number);
      const [hEnd, mEnd] = firstLez.oraFine.split(':').map(Number);
      const durataMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);

      const endTotalMins = startMinsNew + durataMins;
      const endH = Math.floor(endTotalMins / 60).toString().padStart(2, '0');
      const endM = (endTotalMins % 60).toString().padStart(2, '0');

      setPendingMove({
        isGruppoFuso: true,
        lezioniIds: payload.lezioni.map(l => l.id),
        data: dataSelezionata,
        oraInizio: targetOraStr,
        oraFine: `${endH}:${endM}`,
        insegnanteId: targetIsGruppo ? '' : targetInsegnanteId,
        isGruppo: targetIsGruppo
      });
    } else {
      const [hStart, mStart] = payload.oraInizio.split(':').map(Number);
      const [hEnd, mEnd] = payload.oraFine.split(':').map(Number);
      const durataMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);

      const endTotalMins = startMinsNew + durataMins;
      const endH = Math.floor(endTotalMins / 60).toString().padStart(2, '0');
      const endM = (endTotalMins % 60).toString().padStart(2, '0');

      setPendingMove({
        lezioneId: payload.id,
        data: dataSelezionata,
        oraInizio: targetOraStr,
        oraFine: `${endH}:${endM}`,
        insegnanteId: targetIsGruppo ? '' : targetInsegnanteId,
        isGruppo: Boolean(targetIsGruppo)
      });
    }

    setPinInput('');
    setPinError(false);
  };

  // RIDIMENSIONAMENTO DURATA (RESIZE)
  const handleResizeStart = (e, lezione) => {
    e.stopPropagation();
    setResizingLezione(lezione);
  };

  const handleResizeStep = (deltaMins) => {
    if (!resizingLezione) return;
    const [hEnd, mEnd] = resizingLezione.oraFine.split(':').map(Number);
    let totalEnd = hEnd * 60 + mEnd + deltaMins;

    const [hStart, mStart] = resizingLezione.oraInizio.split(':').map(Number);
    const totalStart = hStart * 60 + mStart;

    if (totalEnd <= totalStart + 30) totalEnd = totalStart + 30; // durata minima 30 min

    const newEndH = Math.floor(totalEnd / 60).toString().padStart(2, '0');
    const newEndM = (totalEnd % 60).toString().padStart(2, '0');

    setPendingMove({
      lezioneId: resizingLezione.id,
      data: resizingLezione.data,
      oraInizio: resizingLezione.oraInizio,
      oraFine: `${newEndH}:${newEndM}`,
      insegnanteId: resizingLezione.insegnanteId,
      isGruppo: resizingLezione.isGruppo
    });
    setResizingLezione(null);
  };

  const confirmPendingMoveWithPin = (e) => {
    if (e) e.preventDefault();

    if (pinInput !== '1234') {
      setPinError(true);
      return;
    }

    if (pendingMove && onUpdateLezioneCompleta) {
      if (pendingMove.isGruppoFuso) {
        pendingMove.lezioniIds.forEach(id => {
          onUpdateLezioneCompleta({ ...pendingMove, lezioneId: id });
        });
      } else {
        onUpdateLezioneCompleta(pendingMove);
      }
    }

    setPendingMove(null);
    setPinInput('');
    setPinError(false);
  };

  const handleOpenDetail = (lez) => {
    setSelectedLezioneDetail(lez);
    setIsEditingMove(false);
    setMoveForm({
      data: lez.data,
      oraInizio: lez.oraInizio,
      oraFine: lez.oraFine,
      insegnanteId: lez.insegnanteId || (insegnanti[0]?.id || ''),
      isGruppo: lez.isGruppo || false
    });
  };

  const handleRequestMoveFromDetail = () => {
    setPendingMove({
      lezioneId: selectedLezioneDetail.id,
      ...moveForm
    });
    setSelectedLezioneDetail(null);
    setIsEditingMove(false);
    setPinInput('');
    setPinError(false);
  };

  const handleConfirmEstrazioneStudente = () => {
    if (!estrazioneForm.insegnanteId) {
      alert('Seleziona un insegnante per la lezione individuale.');
      return;
    }

    if (onEstraiStudenteDaGruppo) {
      onEstraiStudenteDaGruppo(
        estrazioneData.lezioneOriginale.id,
        estrazioneData.studenteId,
        estrazioneForm.insegnanteId,
        estrazioneForm.oraInizio,
        estrazioneForm.oraFine,
        estrazioneForm.data || dataSelezionata
      );
    }
    setEstrazioneData(null);
    setGroupModalData(null);
  };

  return (
    <div className="w-full h-full p-0 flex flex-col space-y-3 select-none">
      {/* Header e Data */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 mx-4 mt-4 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl">
            <CalendarIcon className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Planning Lezioni</h2>
            <p className="text-xs text-gray-500">Drag & Drop a scatti di 30 min • Ridimensionamento durata sui margini</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-white rounded-xl text-gray-700"><ChevronLeft className="w-4 h-4"/></button>
          <input
            type="date"
            value={dataSelezionata}
            onChange={(e) => setDataSelezionata(e.target.value)}
            className="bg-transparent font-extrabold text-xs text-slate-900 focus:outline-none px-2"
          />
          <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-white rounded-xl text-gray-700"><ChevronRight className="w-4 h-4"/></button>
        </div>

        <button
          onClick={() => onOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4"/>
          <span>+ Nuova Lezione</span>
        </button>
      </div>

      {/* Griglia Calendario */}
      <div className="flex-1 bg-white border-t border-b border-gray-200 overflow-x-auto flex flex-col min-h-[650px] w-full">
        <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(140px,1fr))_160px] border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 w-full min-w-[900px]">
          <div className="p-3 text-center text-[11px] font-extrabold text-gray-400 border-r border-gray-200">ORA</div>

          {insegnanti.map(ins => (
            <div key={ins.id} className="p-3 text-center border-r border-gray-200 flex flex-col items-center justify-center">
              <div style={{ backgroundColor: ins.colore || '#3b82f6' }} className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"/>
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate">{ins.nome}</span>
            </div>
          ))}

          <div
            onClick={() => setGroupModalData({ fascia: 'Intero Giorno', lezioniGroup: lezioniGruppoOggi })}
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

        {/* Corpo della Griglia (Slot di 30 Minuti) */}
        <div className="relative flex-1 grid grid-cols-[60px_repeat(auto-fit,minmax(140px,1fr))_160px] w-full min-w-[900px]">
          <div className="border-r border-gray-200 bg-gray-50/40 text-center divide-y divide-gray-100">
            {slots30.map((slot, i) => (
              <div key={i} className="h-8 text-[10px] font-extrabold text-gray-400 pt-1">
                {slot.oraStr.endsWith(':00') ? slot.oraStr : ''}
              </div>
            ))}
          </div>

          {/* Colonne Insegnanti Singoli */}
          {insegnanti.map(ins => {
            const lezioniDocente = lezioniAttive.filter(l => l.insegnanteId === ins.id && !l.isGruppo);

            return (
              <div key={ins.id} className="border-r border-gray-100 relative divide-y divide-gray-100/60 bg-white">
                {slots30.map((slot, i) => (
                  <div
                    key={i}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, ins.id, false, slot.oraStr)}
                    className="h-8 hover:bg-slate-50/60"
                  />
                ))}

                {lezioniDocente.map(lez => {
                  const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
                  const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
                  const topMins = hStart * 60 + mStart - startHourMins;
                  const durationMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);

                  const topPercent = (topMins / totalHoursMins) * 100;
                  const heightPercent = (durationMins / totalHoursMins) * 100;

                  return (
                    <div
                      key={lez.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lez)}
                      onClick={() => handleOpenDetail(lez)}
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                        backgroundColor: (ins.colore || '#3b82f6') + '20',
                        borderColor: ins.colore || '#3b82f6'
                      }}
                      className="absolute left-1 right-1 border-l-4 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all group"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 truncate">{stdsNames(lez.studentiIds, studenti)}</div>
                        <div className="text-[10px] font-bold text-gray-600 truncate">{lez.materia || 'Materia'}</div>
                        <div className="text-[9px] font-extrabold text-gray-500 mt-0.5">{lez.oraInizio} - {lez.oraFine}</div>
                      </div>

                      {/* MANIGLIA PER ALLUNGARE/ACCORCIARE DURATA SUL MARGINE INFERIORE */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity pt-1 border-t border-black/10 mt-1 cursor-ns-resize"
                      >
                        <button
                          onClick={() => { setResizingLezione(lez); handleResizeStep(-30); }}
                          className="px-1 bg-white/80 rounded text-[9px] font-black text-slate-800 hover:bg-white"
                          title="Accorcia di 30 min"
                        >
                          -30m
                        </button>
                        <GripHorizontal className="w-3.5 h-3.5 text-gray-500"/>
                        <button
                          onClick={() => { setResizingLezione(lez); handleResizeStep(30); }}
                          className="px-1 bg-white/80 rounded text-[9px] font-black text-slate-800 hover:bg-white"
                          title="Allunga di 30 min"
                        >
                          +30m
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* COLONNA GRUPPO */}
          <div className="border-r border-amber-200 bg-amber-50/30 relative divide-y divide-amber-100/50">
            {slots30.map((slot, i) => (
              <div
                key={i}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, '', true, slot.oraStr)}
                className="h-8 hover:bg-amber-100/30"
              />
            ))}

            {gruppiFusiList.map((gf, idx) => {
              const [hStart, mStart] = gf.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = gf.oraFine.split(':').map(Number);
              const topMins = hStart * 60 + mStart - startHourMins;
              const durationMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);

              const topPercent = (topMins / totalHoursMins) * 100;
              const heightPercent = (durationMins / totalHoursMins) * 100;
              const tuttiStudentiIds = gf.lezioni.flatMap(l => l.studentiIds || []);

              return (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { isGruppoFuso: true, lezioni: gf.lezioni })}
                  onClick={() => setGroupModalData({ fascia: `${gf.oraInizio} - ${gf.oraFine}`, lezioniGroup: gf.lezioni })}
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                  className="absolute left-1 right-1 bg-amber-300 border-l-4 border-amber-600 rounded-xl p-2.5 text-xs shadow-md overflow-hidden flex flex-col justify-between cursor-pointer hover:bg-amber-400 transition-all z-10"
                >
                  <div>
                    <div className="font-black text-amber-950 flex items-center justify-between">
                      <span className="truncate">👥 Gruppo Studio</span>
                      <span className="bg-amber-950 text-amber-300 font-black text-[10px] px-2 py-0.5 rounded-full shrink-0">
                        {tuttiStudentiIds.length} ragazzi
                      </span>
                    </div>
                    <div className="text-[10px] font-extrabold text-amber-900 mt-1">
                      🕒 {gf.oraInizio} - {gf.oraFine}
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-amber-950 underline italic mt-1">
                    Clicca per dettaglio o per estrarre uno studente
                  </div>
                </div>
              );
            })}
          </div>

          {/* Colonna ANNULLATE */}
          <div className="bg-slate-100/70 border-l-2 border-slate-300 relative divide-y divide-slate-200">
            {slots30.map((_, i) => <div key={i} className="h-8"/>)}

            {lezioniAnnullateOggi.map(lez => {
              const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
              const topMins = hStart * 60 + mStart - startHourMins;
              const durationMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);

              const topPercent = (topMins / totalHoursMins) * 100;
              const heightPercent = (durationMins / totalHoursMins) * 100;

              return (
                <div
                  key={lez.id}
                  onClick={() => handleOpenDetail(lez)}
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                  className="absolute left-1 right-1 bg-slate-300/80 border-l-4 border-slate-500 rounded-xl p-2 text-xs shadow-sm opacity-80 cursor-pointer"
                >
                  <div className="font-extrabold text-slate-800 line-through truncate">{stdsNames(lez.studentiIds, studenti)}</div>
                  <div className="text-[10px] font-bold text-slate-600 truncate">{lez.materia}</div>
                </div>
              );
            })}
          </div>

          {/* Linea Rossa ORA */}
          {isToday && redLineTop >= 0 && redLineTop <= 100 && (
            <div style={{ top: `${redLineTop}%` }} className="absolute left-0 right-0 border-b-2 border-rose-500 z-30 pointer-events-none flex items-center">
              <span className="bg-rose-500 text-white text-[9px] font-black px-1 rounded-r">ORA</span>
            </div>
          )}
        </div>
      </div>

      {/* POPUP GRUPPO FUSO */}
      {groupModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <Users className="w-5 h-5"/>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Dettaglio Partecipanti Gruppo</h3>
                  <p className="text-xs text-gray-500">Fascia Oraria: <strong>{groupModalData.fascia}</strong></p>
                </div>
              </div>
              <button onClick={() => setGroupModalData(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5"/></button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {groupModalData.lezioniGroup.map((lg, idx) => (
                <div key={idx} className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
                    <span className="font-black text-xs text-amber-950 uppercase tracking-wide">{lg.materia || 'Gruppo Studio'}</span>
                    <span className="bg-amber-200 text-amber-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg">🕒 {lg.oraInizio} - {lg.oraFine}</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(lg.studentiIds || []).map(sId => {
                      const std = studenti.find(s => s.id === sId);
                      return (
                        <div key={sId} className="bg-white border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 shadow-sm">
                          <button
                            onClick={() => {
                              setGroupModalData(null);
                              if (onSelectStudent) onSelectStudent(sId);
                            }}
                            className="flex items-center space-x-2 truncate hover:text-amber-700"
                          >
                            <User className="w-4 h-4 text-amber-600 shrink-0"/>
                            <span className="truncate">{std ? `${std.nome} ${std.cognome}` : 'Studente'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setEstrazioneData({ lezioneOriginale: lg, studenteId: sId });
                              setEstrazioneForm({
                                data: dataSelezionata,
                                insegnanteId: insegnanti[0]?.id || '',
                                oraInizio: lg.oraInizio,
                                oraFine: lg.oraFine
                              });
                            }}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-[11px] font-extrabold flex items-center space-x-1 border border-amber-300"
                          >
                            <UserMinus className="w-3 h-3 text-amber-800"/>
                            <span>Estrai e Sposta a Docente</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setGroupModalData(null)} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP ESTRAZIONE STUDENTE SINGOLO CON SELEZIONE GIORNO */}
      {estrazioneData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Estrai Studente dal Gruppo</h3>
              <button onClick={() => setEstrazioneData(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
            </div>

            <p className="text-xs text-gray-600">
              Scegli il giorno, l'insegnante e la fascia oraria per la nuova lezione individuale:
            </p>

            <div className="space-y-2.5">
              {/* NUOVO CAMPO GIORNO / CALENDARIO */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Seleziona Giorno</label>
                <input
                  type="date"
                  value={estrazioneForm.data}
                  onChange={(e) => setEstrazioneForm({ ...estrazioneForm, data: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Assegna a Insegnante</label>
                <select
                  value={estrazioneForm.insegnanteId}
                  onChange={(e) => setEstrazioneForm({ ...estrazioneForm, insegnanteId: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 text-xs"
                >
                  {insegnanti.map(ins => (
                    <option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome} ({ins.materia})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Ora Inizio</label>
                  <input
                    type="time"
                    value={estrazioneForm.oraInizio}
                    onChange={(e) => setEstrazioneForm({ ...estrazioneForm, oraInizio: e.target.value })}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Ora Fine</label>
                  <input
                    type="time"
                    value={estrazioneForm.oraFine}
                    onChange={(e) => setEstrazioneForm({ ...estrazioneForm, oraFine: e.target.value })}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button onClick={() => setEstrazioneData(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">Annulla</button>
              <button onClick={handleConfirmEstrazioneStudente} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md">
                Estrai e Crea Lezione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP RICHIESTA PIN */}
      {pendingMove && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={confirmPendingMoveWithPin} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center space-x-2 text-amber-700">
              <ShieldAlert className="w-6 h-6 text-amber-600"/>
              <h3 className="font-extrabold text-base text-slate-900">Autorizza Modifica</h3>
            </div>
            <p className="text-xs text-gray-600">
              Conferma spostamento o durata alle ore <strong>{pendingMove.oraInizio} - {pendingMove.oraFine}</strong>. Inserisci il PIN (<strong>1234</strong>) e premi Invio:
            </p>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"/>
              <input
                ref={pinInputRef}
                type="password"
                maxLength={4}
                placeholder="1234"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            {pinError && <p className="text-[11px] font-bold text-rose-600">PIN errato. Inserisci 1234.</p>}
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setPendingMove(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">Annulla</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md">Autorizza</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE ANNULLAMENTO */}
      {lezioneDaAnnullare && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertOctagon className="w-5 h-5"/>
                <h3 className="font-extrabold text-base text-slate-900">Giustificazione e Annullamento</h3>
              </div>
              <button onClick={() => setLezioneDaAnnullare(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motivazione dell'Annullamento *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Es. Avviso in ritardo, malattia, impegno personale..."
                  value={motivoAnnullamento}
                  onChange={(e) => setMotivoAnnullamento(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Trattamento Addebito / Penale</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoAnnullamento('gratuito')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 ${
                      tipoAnnullamento === 'gratuito' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <span>🟢 Gratuito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoAnnullamento('addebito')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 ${
                      tipoAnnullamento === 'addebito' ? 'bg-rose-50 border-rose-500 text-rose-900' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <span>🔴 Con Addebito</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              <button onClick={() => setLezioneDaAnnullare(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">Chiudi</button>
              <button onClick={handleConfirmAnnullamento} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md">
                Conferma Annullamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETTAGLIO LEZIONE */}
      {selectedLezioneDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-slate-900"/>
                <h3 className="font-extrabold text-lg text-slate-900">Dettaglio Lezione</h3>
              </div>
              <button onClick={() => setSelectedLezioneDetail(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-black text-slate-900 text-sm">{selectedLezioneDetail.materia || 'Lezione'}</div>
                <div className="text-gray-600 font-bold flex items-center gap-2">
                  <span>📅 {selectedLezioneDetail.data}</span>
                  <span>🕒 {selectedLezioneDetail.oraInizio} - {selectedLezioneDetail.oraFine}</span>
                </div>

                <button
                  onClick={() => setIsEditingMove(!isEditingMove)}
                  className="w-full mt-2 py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5"/>
                  <span>{isEditingMove ? 'Chiudi Riprogrammazione' : 'Sposta / Riprogramma Lezione'}</span>
                </button>
              </div>

              {isEditingMove && (
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="font-extrabold text-amber-950 text-xs">Seleziona Nuovo Giorno e Orario</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Nuovo Giorno</label>
                      <input
                        type="date"
                        value={moveForm.data}
                        onChange={(e) => setMoveForm({ ...moveForm, data: e.target.value })}
                        className="w-full p-2 bg-white rounded-xl border border-amber-300 font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Insegnante / Destinazione</label>
                      <select
                        value={moveForm.isGruppo ? 'gruppo' : moveForm.insegnanteId}
                        onChange={(e) => {
                          if (e.target.value === 'gruppo') {
                            setMoveForm({ ...moveForm, isGruppo: true, insegnanteId: '' });
                          } else {
                            setMoveForm({ ...moveForm, isGruppo: false, insegnanteId: e.target.value });
                          }
                        }}
                        className="w-full p-2 bg-white rounded-xl border border-amber-300 font-bold text-slate-900 text-xs"
                      >
                        {insegnanti.map(ins => (
                          <option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome}</option>
                        ))}
                        <option value="gruppo">Colonna GRUPPO</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Ora Inizio</label>
                      <input
                        type="time"
                        value={moveForm.oraInizio}
                        onChange={(e) => setMoveForm({ ...moveForm, oraInizio: e.target.value })}
                        className="w-full p-2 bg-white rounded-xl border border-amber-300 font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Ora Fine</label>
                      <input
                        type="time"
                        value={moveForm.oraFine}
                        onChange={(e) => setMoveForm({ ...moveForm, oraFine: e.target.value })}
                        className="w-full p-2 bg-white rounded-xl border border-amber-300 font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRequestMoveFromDetail}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Conferma e Richiedi PIN
                  </button>
                </div>
              )}

              <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 space-y-1">
                <label className="block text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center">
                  <Paperclip className="w-3.5 h-3.5 mr-1 text-amber-700"/> Materiali & Compiti
                </label>
                <p className="text-gray-400 font-medium text-[11px] italic">Nessun allegato per questa lezione.</p>
              </div>

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
                        onClick={() => {
                          setSelectedLezioneDetail(null);
                          if (onSelectStudent) onSelectStudent(sId);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl flex items-center justify-between font-extrabold text-slate-900 text-left text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-700"/>
                          <span>{std ? `${std.nome} ${std.cognome}` : 'Studente'}</span>
                        </div>
                        <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold">Vedi Scheda</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

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
                  onClick={() => handleStartAnnullamento(selectedLezioneDetail)}
                  className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl text-xs flex items-center space-x-1"
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
