import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, X, User, CheckCircle, FileText, Info, AlertOctagon, RotateCcw, Clock, Lock, ShieldAlert, Paperclip, ArrowRightLeft, UserMinus, GripHorizontal, Bell, Check, MessageSquare } from 'lucide-react';

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
  onEstraiStudenteDaGruppo,
  onAcceptRichiesta, // Funziona per accettare/spostare la richiesta app
  onRejectRichiesta  // Funzione per rifiutare la richiesta app
}) {
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Modali
  const [groupModalData, setGroupModalData] = useState(null);
  const [selectedLezioneDetail, setSelectedLezioneDetail] = useState(null);
  const [richiestaDaGestire, setRichiestaDaGestire] = useState(null); // Per gestire richieste app
  const [nuovoDocenteRichiesta, setNuovoDocenteRichiesta] = useState('');

  // Estrazione Studente da Gruppo
  const [estrazioneData, setEstrazioneData] = useState(null);
  const [estrazioneForm, setEstrazioneForm] = useState({ data: '', insegnanteId: '', oraInizio: '15:00', oraFine: '16:00' });

  // Annullamento
  const [lezioneDaAnnullare, setLezioneDaAnnullare] = useState(null);
  const [motivoAnnullamento, setMotivoAnnullamento] = useState('');
  const [tipoAnnullamento, setTipoAnnullamento] = useState('gratuito');

  // Spostamento
  const [isEditingMove, setIsEditingMove] = useState(false);
  const [moveForm, setMoveForm] = useState({ data: '', oraInizio: '', oraFine: '', insegnanteId: '', isGruppo: false });

  // PIN e Drag
  const [pendingMove, setPendingMove] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [resizingLezione, setResizingLezione] = useState(null);

  const pinInputRef = useRef(null);

  const slots30 = [];
  for (let h = 9; h < 20; h++) {
    slots30.push({ oraStr: `${h.toString().padStart(2, '0')}:00`, totalMins: h * 60 });
    slots30.push({ oraStr: `${h.toString().padStart(2, '0')}:30`, totalMins: h * 60 + 30 });
  }
  const startHourMins = 9 * 60;
  const totalHoursMins = 11 * 60;

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

  const lezioniAttive = lezioni.filter(l => l.data === dataSelezionata && l.stato !== 'annullata' && l.stato !== 'richiesta');
  const lezioniRichiesteOggi = lezioni.filter(l => l.data === dataSelezionata && l.stato === 'richiesta');
  const lezioniAnnullateOggi = lezioni.filter(l => l.data === dataSelezionata && l.stato === 'annullata');
  const lezioniGruppoOggi = lezioniAttive.filter(l => l.isGruppo);

  const gruppiFusiMap = {};
  lezioniGruppoOggi.forEach(l => {
    const key = `${l.oraInizio}-${l.oraFine}`;
    if (!gruppiFusiMap[key]) {
      gruppiFusiMap[key] = { oraInizio: l.oraInizio, oraFine: l.oraFine, lezioni: [] };
    }
    gruppiFusiMap[key].lezioni.push(l);
  });
  const gruppiFusiList = Object.values(gruppiFusiMap);

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

  const handleResizeStep = (deltaMins) => {
    if (!resizingLezione) return;
    const [hEnd, mEnd] = resizingLezione.oraFine.split(':').map(Number);
    let totalEnd = hEnd * 60 + mEnd + deltaMins;

    const [hStart, mStart] = resizingLezione.oraInizio.split(':').map(Number);
    const totalStart = hStart * 60 + mStart;

    if (totalEnd <= totalStart + 30) totalEnd = totalStart + 30;

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

  // Apertura WhatsApp con nome insegnante incluso
  const sendWhatsAppConfirmation = (lez) => {
    const std = studenti.find(s => (lez.studentiIds || []).includes(s.id));
    const ins = insegnanti.find(i => i.id === lez.insegnanteId);
    const nomeStudente = std ? `${std.nome} ${std.cognome}` : 'Studente';
    const nomeDocente = ins ? `${ins.nome} ${ins.cognome}` : 'un nostro docente';

    const testo = `Buongiorno, le confermo la prenotazione della lezione di ${lez.materia || 'doposcuola'} per ${nomeStudente} in data ${lez.data} dalle ${lez.oraInizio} alle ${lez.oraFine} con il docente ${nomeDocente}. Cordiali saluti - Fuori Classe Reception.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(testo)}`;
    window.open(url, '_blank');
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
            <p className="text-xs text-gray-500">Gestione flussi, richieste app e docenti</p>
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

      {/* Griglia Calendario (Colonna Annullate resa molto più stretta / compatta) */}
      <div className="flex-1 bg-white border-t border-b border-gray-200 overflow-x-auto flex flex-col min-h-[650px] w-full">
        <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(140px,1fr))_130px_90px] border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 w-full min-w-[950px]">
          <div className="p-3 text-center text-[11px] font-extrabold text-gray-400 border-r border-gray-200">ORA</div>

          {insegnanti.map(ins => (
            <div key={ins.id} className="p-3 text-center border-r border-gray-200 flex flex-col items-center justify-center">
              <div style={{ backgroundColor: ins.colore || '#3b82f6' }} className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"/>
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate">{ins.nome}</span>
            </div>
          ))}

          {/* Colonna RICHIESTE APP */}
          <div className="p-3 text-center bg-sky-50 border-r border-sky-200 flex flex-col items-center justify-center">
            <Bell className="w-4 h-4 text-sky-700 mb-0.5 animate-bounce"/>
            <span className="font-black text-[11px] text-sky-950 uppercase tracking-wider flex items-center">
              RICHIESTE <span className="ml-1 text-[9px] bg-sky-200 text-sky-900 px-1 rounded-full">{lezioniRichiesteOggi.length}</span>
            </span>
          </div>

          {/* Colonna ANNULLATE COMPATTA */}
          <div className="p-3 text-center bg-slate-100 border-l border-slate-200 flex flex-col items-center justify-center">
            <AlertOctagon className="w-3.5 h-3.5 text-slate-500 mb-0.5"/>
            <span className="font-black text-[10px] text-slate-600 uppercase tracking-wider">
              ANNULLATE ({lezioniAnnullateOggi.length})
            </span>
          </div>
        </div>

        {/* Corpo della Griglia */}
        <div className="relative flex-1 grid grid-cols-[60px_repeat(auto-fit,minmax(140px,1fr))_130px_90px] w-full min-w-[950px]">
          <div className="border-r border-gray-200 bg-gray-50/40 text-center divide-y divide-gray-100">
            {slots30.map((slot, i) => (
              <div key={i} className="h-8 text-[10px] font-extrabold text-gray-400 pt-1">
                {slot.oraStr.endsWith(':00') ? slot.oraStr : ''}
              </div>
            ))}
          </div>

          {/* Colonne Insegnanti Singoli con Pre-assegnazione Richieste */}
          {insegnanti.map(ins => {
            const lezioniDocente = lezioniAttive.filter(l => l.insegnanteId === ins.id && !l.isGruppo);
            // Richieste pendenti per questo specifico insegnante
            const richiesteDocente = lezioniRichiesteOggi.filter(l => l.insegnanteId === ins.id);

            return (
              <div key={ins.id} className="border-r border-gray-100 relative divide-y divide-gray-100/60 bg-white">
                {slots30.map((slot, i) => (
                  <div key={i} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, ins.id, false, slot.oraStr)} className="h-8 hover:bg-slate-50/60"/>
                ))}

                {/* Lezioni Attive Docente */}
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
                    </div>
                  );
                })}

                {/* RICHIESTE IN ATTESA SUL DOCENTE (Grigio trasparente con bordo lampeggiante) */}
                {richiesteDocente.map(req => {
                  const [hStart, mStart] = req.oraInizio.split(':').map(Number);
                  const [hEnd, mEnd] = req.oraFine.split(':').map(Number);
                  const topMins = hStart * 60 + mStart - startHourMins;
                  const durationMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);
                  const topPercent = (topMins / totalHoursMins) * 100;
                  const heightPercent = (durationMins / totalHoursMins) * 100;

                  return (
                    <div
                      key={req.id}
                      onClick={() => setRichiestaDaGestire(req)}
                      style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                      className="absolute left-1 right-1 bg-gray-200/90 border-2 border-dashed border-amber-500 rounded-xl p-2 text-xs shadow-md animate-pulse cursor-pointer flex flex-col justify-between z-20"
                    >
                      <div>
                        <div className="font-black text-slate-900 truncate">⏳ {stdsNames(req.studentiIds, studenti)}</div>
                        <div className="text-[9px] font-bold text-amber-800">Richiesta App (Da Approvare)</div>
                      </div>
                      <span className="text-[8px] bg-amber-500 text-white px-1 py-0.5 rounded font-black w-max">Gestisci</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* COLONNA GRUPPO */}
          <div className="border-r border-amber-200 bg-amber-50/30 relative divide-y divide-amber-100/50">
            {slots30.map((slot, i) => (
              <div key={i} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, '', true, slot.oraStr)} className="h-8 hover:bg-amber-100/30"/>
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
                    <div className="text-[10px] font-extrabold text-amber-900 mt-1">🕒 {gf.oraInizio} - {gf.oraFine}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* COLONNA RICHIESTE APP (Generiche senza docente specifico) */}
          <div className="border-r border-sky-200 bg-sky-50/40 relative divide-y divide-sky-100">
            {slots30.map((_, i) => <div key={i} className="h-8"/>)}

            {lezioniRichiesteOggi.filter(l => !l.insegnanteId || !insegnanti.some(i => i.id === l.insegnanteId)).map(req => {
              const [hStart, mStart] = req.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = req.oraFine.split(':').map(Number);
              const topMins = hStart * 60 + mStart - startHourMins;
              const durationMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);
              const topPercent = (topMins / totalHoursMins) * 100;
              const heightPercent = (durationMins / totalHoursMins) * 100;

              return (
                <div
                  key={req.id}
                  onClick={() => setRichiestaDaGestire(req)}
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                  className="absolute left-1 right-1 bg-sky-200 border-2 border-sky-400 rounded-xl p-2 text-xs shadow-md cursor-pointer hover:bg-sky-300 flex flex-col justify-between z-20"
                >
                  <div>
                    <div className="font-black text-sky-950 truncate">🔔 {stdsNames(req.studentiIds, studenti)}</div>
                    <div className="text-[9px] font-bold text-sky-800">{req.oraInizio} - {req.oraFine}</div>
                  </div>
                  <span className="text-[8px] bg-sky-900 text-white px-1 py-0.5 rounded font-black w-max">Da Assegnare</span>
                </div>
              );
            })}
          </div>

          {/* COLONNA ANNULLATE COMPATTA */}
          <div className="bg-slate-50 border-l border-slate-200 relative divide-y divide-slate-100">
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
                  className="absolute left-1 right-1 bg-slate-200 border-l-2 border-slate-400 rounded-lg p-1 text-[10px] shadow-sm opacity-75 cursor-pointer truncate"
                >
                  <span className="line-through font-bold text-slate-700">{stdsNames(lez.studentiIds, studenti)}</span>
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

      {/* MODALE GESTIONE RICHIESTA APP (Accetta / Rifiuta / Sposta Docente) */}
      {richiestaDaGestire && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-sky-700">
                <Bell className="w-5 h-5"/>
                <h3 className="font-extrabold text-base text-slate-900">Gestione Richiesta Utente App</h3>
              </div>
              <button onClick={() => setRichiestaDaGestire(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-slate-900">Studente: <strong className="text-sky-950">{stdsNames(richiestaDaGestire.studentiIds, studenti)}</strong></p>
                <p className="font-bold text-slate-900">Data e Ora: <strong className="text-sky-950">{richiestaDaGestire.data} ({richiestaDaGestire.oraInizio} - {richiestaDaGestire.oraFine})</strong></p>
                <p className="font-bold text-slate-900">Materia / Richiesta: <strong className="text-sky-950">{richiestaDaGestire.materia || 'Doposcuola'}</strong></p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Assegna / Conferma Insegnante</label>
                <select
                  value={nuovoDocenteRichiesta || richiestaDaGestire.insegnanteId || insegnanti[0]?.id}
                  onChange={(e) => setNuovoDocenteRichiesta(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900"
                >
                  {insegnanti.map(ins => (
                    <option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome} ({ins.materia})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  const docId = nuovoDocenteRichiesta || richiestaDaGestire.insegnanteId || insegnanti[0]?.id;
                  if (onAcceptRichiesta) onAcceptRichiesta(richiestaDaGestire.id, docId);
                  setRichiestaDaGestire(null);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4"/> Accetta e Conferma Lezione
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onRejectRichiesta) onRejectRichiesta(richiestaDaGestire.id, 'Orario o docente già occupato');
                    setRichiestaDaGestire(null);
                  }}
                  className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5"/> Rifiuta (Già Occupato)
                </button>
                <button onClick={() => setRichiestaDaGestire(null)} className="py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs">
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETTAGLIO LEZIONE CON PULSANTE WHATSAPP E NOME DOCENTE */}
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
                {selectedLezioneDetail.insegnanteId && (
                  <p className="text-slate-800 font-bold">
                    Docente Assegnato: <span className="text-amber-700">{insegnanti.find(i => i.id === selectedLezioneDetail.insegnanteId)?.nome || 'N.D.'}</span>
                  </p>
                )}

                {/* Pulsante invio WhatsApp di conferma con nome docente */}
                <button
                  onClick={() => sendWhatsAppConfirmation(selectedLezioneDetail)}
                  className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5"/>
                  <span>Invia Conferma WhatsApp</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Studenti Iscritti</label>
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

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedLezioneDetail(null)} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs">Chiudi</button>
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
