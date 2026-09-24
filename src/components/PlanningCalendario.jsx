import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, X, User, CheckCircle, FileText, Info, AlertOctagon, RotateCcw, Clock, Lock, Bell, Check, MessageSquare } from 'lucide-react';

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
  onAcceptRichiesta,
  onRejectRichiesta
}) {
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  const [groupModalData, setGroupModalData] = useState(null);
  const [selectedLezioneDetail, setSelectedLezioneDetail] = useState(null);
  
  // Modali dedicati per Richieste e Annullate spostate in alto
  const [showRichiesteModal, setShowRichiesteModal] = useState(false);
  const [showAnnullateModal, setShowAnnullateModal] = useState(false);
  const [richiestaDaGestire, setRichiestaDaGestire] = useState(null);
  const [nuovoDocenteRichiesta, setNuovoDocenteRichiesta] = useState('');

  const [pendingMove, setPendingMove] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const pinInputRef = useRef(null);

  // Rilevamento nuove richieste per suono e allerta
  const prevRichiesteCountRef = useRef(0);

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

  const lezioniAttive = lezioni.filter(l => l.data === dataSelezionata && l.stato !== 'annullata' && l.stato !== 'richiesta');
  const lezioniRichiesteOggi = lezioni.filter(l => l.data === dataSelezionata && l.stato === 'richiesta');
  const lezioniAnnullateOggi = lezioni.filter(l => l.data === dataSelezionata && l.stato === 'annullata');
  const lezioniGruppoOggi = lezioniAttive.filter(l => l.isGruppo);

  // Effetto sonoro (Audio Beep nativo) e apertura automatica / alert visivo all'arrivo di nuove richieste
  useEffect(() => {
    if (lezioniRichiesteOggi.length > prevRichiesteCountRef.current) {
      playNotificationSound();
    }
    prevRichiesteCountRef.current = lezioniRichiesteOggi.length;
  }, [lezioniRichiesteOggi.length]);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Nota D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log("Audio non supportato o bloccato dal browser");
    }
  };

  const changeDate = (days) => {
    const current = new Date(dataSelezionata);
    current.setDate(current.getDate() + days);
    setDataSelezionata(current.toISOString().split('T')[0]);
  };

  const isToday = dataSelezionata === new Date().toISOString().split('T')[0];
  const redLineTop = ((currentTimeMinutes - startHourMins) / totalHoursMins) * 100;

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
  };

  const handleOpenDetail = (lez) => {
    setSelectedLezioneDetail(lez);
  };

  const sendWhatsAppConfirmation = (lez) => {
    const std = studenti.find(s => (lez.studentiIds || []).includes(s.id));
    const ins = insegnanti.find(i => i.id === lez.insegnanteId);
    const nomeStudente = std ? `${std.nome} ${std.cognome}` : 'Studente';
    const nomeDocente = ins ? `${ins.nome} ${ins.cognome}` : 'un nostro docente';

    const testo = `Buongiorno, le confermo la prenotazione della lezione di ${lez.materia || 'doposcuola'} per ${nomeStudente} in data ${lez.data} dalle ${lez.oraInizio} alle ${lez.oraFine} con il docente ${nomeDocente}. Cordiali saluti - Fuori Classe Reception.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(testo)}`;
    window.open(url, '_blank');
  };

  // Dinamica colonne: Ora + Insegnanti + Gruppo (senza colonne fisse laterali per richieste/annullate)
  const gridTemplateColumns = `60px repeat(${insegnanti.length}, minmax(150px, 1fr)) 160px`;

  return (
    <div className="w-full h-full p-0 flex flex-col space-y-3 select-none">
      {/* Header, Data e Pulsanti di Notifica in Alto (Richieste & Annullate) */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 mx-4 mt-4 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl">
            <CalendarIcon className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Planning Lezioni</h2>
            <p className="text-xs text-gray-500">Gestione flussi e docenti</p>
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

        {/* NOTIFICHE IN ALTO (RICHIESTE & ANNULLATE) + NUOVA LEZIONE */}
        <div className="flex items-center space-x-2">
          {/* Pulsante Richieste App */}
          <button
            onClick={() => setShowRichiesteModal(true)}
            className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              lezioniRichiesteOggi.length > 0 
                ? 'bg-rose-500 text-white border-rose-600 shadow-md animate-pulse' 
                : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
            }`}
          >
            <Bell className="w-4 h-4"/>
            <span>Richieste App</span>
            {lezioniRichiesteOggi.length > 0 && (
              <span className="bg-white text-rose-600 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {lezioniRichiesteOggi.length}
              </span>
            )}
          </button>

          {/* Pulsante Annullate */}
          <button
            onClick={() => setShowAnnullateModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-sm"
          >
            <AlertOctagon className="w-4 h-4 text-slate-600"/>
            <span>Annullate ({lezioniAnnullateOggi.length})</span>
          </button>

          {/* Pulsante Nuova Lezione */}
          <button
            onClick={() => onOpenModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4"/>
            <span>+ Nuova Lezione</span>
          </button>
        </div>
      </div>

      {/* Griglia Calendario Pulita (In adattamento automatico per qualsiasi numero di insegnanti) */}
      <div className="flex-1 bg-white border-t border-b border-gray-200 overflow-x-auto flex flex-col min-h-[650px] w-full">
        {/* Intestazione Colonne */}
        <div 
          className="border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 grid w-full min-w-[850px]"
          style={{ gridTemplateColumns }}
        >
          <div className="p-3 text-center text-[11px] font-extrabold text-gray-400 border-r border-gray-200">ORA</div>

          {insegnanti.map(ins => (
            <div key={ins.id} className="p-3 text-center border-r border-gray-200 flex flex-col items-center justify-center">
              <div style={{ backgroundColor: ins.colore || '#3b82f6' }} className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"/>
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate">{ins.nome}</span>
            </div>
          ))}

          {/* Colonna Gruppo */}
          <div
            onClick={() => setGroupModalData({ fascia: 'Intero Giorno', lezioniGroup: lezioniGruppoOggi })}
            className="p-3 text-center bg-amber-100/60 hover:bg-amber-100 flex flex-col items-center justify-center cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-800 mb-0.5"/>
            <span className="font-black text-xs text-amber-950 uppercase tracking-wider flex items-center">
              GRUPPO <span className="ml-1 text-[10px] bg-amber-300 text-amber-950 px-1.5 rounded-full">{lezioniGruppoOggi.length}</span>
            </span>
          </div>
        </div>

        {/* Corpo della Griglia */}
        <div 
          className="relative flex-1 grid w-full min-w-[850px]"
          style={{ gridTemplateColumns }}
        >
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
                  <div key={i} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, ins.id, false, slot.oraStr)} className="h-8 hover:bg-slate-50/60"/>
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
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Colonna Gruppo */}
          <div className="bg-amber-50/30 relative divide-y divide-amber-100/50">
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

          {/* Linea Rossa ORA */}
          {isToday && redLineTop >= 0 && redLineTop <= 100 && (
            <div style={{ top: `${redLineTop}%` }} className="absolute left-0 right-0 border-b-2 border-rose-500 z-30 pointer-events-none flex items-center">
              <span className="bg-rose-500 text-white text-[9px] font-black px-1 rounded-r">ORA</span>
            </div>
          )}
        </div>
      </div>

      {/* MODALE GESTIONE RICHIESTE APP (In alto) */}
      {showRichiesteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Bell className="w-6 h-6 animate-bounce"/>
                <h3 className="font-extrabold text-lg text-slate-900">Richieste App in Attesa ({lezioniRichiesteOggi.length})</h3>
              </div>
              <button onClick={() => setShowRichiesteModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {lezioniRichiesteOggi.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-bold text-xs">Nessuna nuova richiesta in attesa per oggi.</div>
              ) : (
                lezioniRichiesteOggi.map(req => {
                  const insRichiesto = insegnanti.find(i => i.id === req.insegnanteId);
                  return (
                    <div key={req.id} className="bg-sky-50 border border-sky-200 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">👤 {stdsNames(req.studentiIds, studenti)}</h4>
                          <p className="text-xs text-sky-900 font-bold mt-0.5">Materia: {req.materia || 'Doposcuola'} • 🕒 {req.oraInizio} - {req.oraFine}</p>
                          <p className="text-[11px] text-gray-600 mt-1">
                            Docente richiesto: <strong className="text-amber-800">{insRichiesto ? `${insRichiesto.nome} ${insRichiesto.cognome}` : 'Nessuno specifico'}</strong>
                          </p>
                        </div>
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Da Approvare</span>
                      </div>

                      <div className="pt-2 border-t border-sky-200 flex items-center justify-between gap-2">
                        <select
                          defaultValue={req.insegnanteId || insegnanti[0]?.id}
                          id={`sel_doc_${req.id}`}
                          className="p-1.5 bg-white border border-sky-300 rounded-xl font-bold text-slate-900 text-xs flex-1"
                        >
                          {insegnanti.map(ins => (
                            <option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome} ({ins.materia})</option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            const selectedDocId = document.getElementById(`sel_doc_${req.id}`).value;
                            if (onAcceptRichiesta) onAcceptRichiesta(req.id, selectedDocId);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm shrink-0"
                        >
                          <Check className="w-3.5 h-3.5"/> Accetta
                        </button>

                        <button
                          onClick={() => {
                            if (onRejectRichiesta) onRejectRichiesta(req.id, 'Orario o docente non disponibile');
                          }}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs flex items-center gap-1 shrink-0"
                        >
                          <X className="w-3.5 h-3.5"/> Rifiuta
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowRichiesteModal(false)} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE ANNULLATE (In alto) */}
      {showAnnullateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-800">
                <AlertOctagon className="w-6 h-6"/>
                <h3 className="font-extrabold text-lg text-slate-900">Lezioni Annullate Oggi ({lezioniAnnullateOggi.length})</h3>
              </div>
              <button onClick={() => setShowAnnullateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {lezioniAnnullateOggi.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-bold text-xs">Nessuna lezione annullata registrata per oggi.</div>
              ) : (
                lezioniAnnullateOggi.map(lez => (
                  <div key={lez.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900 line-through">{stdsNames(lez.studentiIds, studenti)}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">
                        {lez.tipoAnnullamento === 'addebito' ? 'Con Addebito' : 'Gratuita'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{lez.materia} • 🕒 {lez.oraInizio} - {lez.oraFine}</p>
                    {lez.motivoAnnullamento && (
                      <p className="text-xs text-rose-700 font-bold mt-1">Motivo: {lez.motivoAnnullamento}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowAnnullateModal(false)} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">Chiudi</button>
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
                {selectedLezioneDetail.insegnanteId && (
                  <p className="text-slate-800 font-bold">
                    Docente: <span className="text-amber-700">{insegnanti.find(i => i.id === selectedLezioneDetail.insegnanteId)?.nome || 'N.D.'}</span>
                  </p>
                )}

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
