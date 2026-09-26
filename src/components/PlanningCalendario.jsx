import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, X, User, CheckCircle, FileText, Info, AlertOctagon, RotateCcw, Clock, Lock, Bell, Check, MessageSquare } from 'lucide-react';
import ModalePin from './ModalePin'; // Importiamo il componente separato

export default function PlanningCalendario({
  insegnanti,
  studenti,
  lezioni,
  aggiungiLog,
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
  
  const [showRichiesteModal, setShowRichiesteModal] = useState(false);
  const [showAnnullateModal, setShowAnnullateModal] = useState(false);
  
  // PIN ESTERNO CONFIG
  const [pinConfig, setPinConfig] = useState({ isOpen: false, actionData: null, description: '' });

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

  // IL BUG ERA QUI: Sistemato per inviare il moveData perfetto.
  const handleDrop = (e, targetInsegnanteId, targetIsGruppo = false, targetOraStr) => {
    e.preventDefault();
    const dataJson = e.dataTransfer.getData('application/json');
    if (!dataJson) return;

    const payload = JSON.parse(dataJson);
    const lezioneId = payload.id;
    if (!lezioneId) return;

    const [tH, tM] = targetOraStr.split(':').map(Number);
    const startMinsNew = tH * 60 + tM;
    const [hStart, mStart] = payload.oraInizio.split(':').map(Number);
    const [hEnd, mEnd] = payload.oraFine.split(':').map(Number);
    const durataMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);

    const endTotalMins = startMinsNew + (durataMins > 0 ? durataMins : 60);
    const endH = Math.floor(endTotalMins / 60).toString().padStart(2, '0');
    const endM = (endTotalMins % 60).toString().padStart(2, '0');
    const oraFineNuova = `${endH}:${endM}`;

    // Creiamo il pacchetto Dati ESATTO richiesto da App.jsx
    const datiSpostamento = {
      lezioneId: lezioneId,
      data: dataSelezionata,
      oraInizio: targetOraStr,
      oraFine: oraFineNuova,
      insegnanteId: targetIsGruppo ? '' : targetInsegnanteId,
      isGruppo: Boolean(targetIsGruppo)
    };

    setPinConfig({
      isOpen: true,
      actionData: datiSpostamento,
      description: `Spostamento lezione alle ore ${targetOraStr}`
    });
  };

  // Esegue l'azione dopo il successo del PIN Modale
  const eseguiSpostamento = () => {
    if (onUpdateLezioneCompleta && pinConfig.actionData) {
      onUpdateLezioneCompleta(pinConfig.actionData);
      aggiungiLog(`Spostamento lezione autorizzato (ID: ${pinConfig.actionData.lezioneId}) a orario ${pinConfig.actionData.oraInizio}-${pinConfig.actionData.oraFine}`);
    }
    setPinConfig({ isOpen: false, actionData: null, description: '' });
  };

  const gridTemplateColumns = `60px repeat(${insegnanti.length}, minmax(150px, 1fr)) 160px`;

  return (
    <div className="w-full h-full p-0 flex flex-col space-y-3 select-none">
      
      {/* HEADER CALENDARIO */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 mx-4 mt-4 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl"><CalendarIcon className="w-5 h-5"/></div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Planning Lezioni</h2>
            <p className="text-xs text-gray-500">Trascina le lezioni per spostarle</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-white rounded-xl text-gray-700"><ChevronLeft className="w-4 h-4"/></button>
          <input type="date" value={dataSelezionata} onChange={(e) => setDataSelezionata(e.target.value)} className="bg-transparent font-extrabold text-xs text-slate-900 focus:outline-none px-2" />
          <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-white rounded-xl text-gray-700"><ChevronRight className="w-4 h-4"/></button>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <button onClick={() => setShowRichiesteModal(true)} className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${ lezioniRichiesteOggi.length > 0 ? 'bg-rose-500 text-white border-rose-600 shadow-md animate-pulse' : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100' }`}>
            <Bell className="w-4 h-4"/>
            <span>Richieste</span>
            {lezioniRichiesteOggi.length > 0 && <span className="bg-white text-rose-600 px-1.5 py-0.2 rounded-full text-[10px] font-black">{lezioniRichiesteOggi.length}</span>}
          </button>
          <button onClick={() => setShowAnnullateModal(true)} className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-sm">
            <AlertOctagon className="w-4 h-4 text-slate-600"/>
            <span>Annullate ({lezioniAnnullateOggi.length})</span>
          </button>
          <button onClick={() => { onOpenModal(); aggiungiLog("Apertura modale inserimento nuova lezione"); }} className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm">
            <Plus className="w-4 h-4"/><span>+ Nuova</span>
          </button>
        </div>
      </div>

      {/* GRIGLIA CALENDARIO */}
      <div className="flex-1 bg-white border border-gray-200 rounded-3xl mx-4 mb-4 overflow-x-auto flex flex-col min-h-[650px] shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 grid w-full min-w-[750px] rounded-t-3xl" style={{ gridTemplateColumns }}>
          <div className="p-3 text-center text-[11px] font-extrabold text-gray-400 border-r border-gray-200">ORA</div>
          {insegnanti.map(ins => (
            <div key={ins.id} className="p-3 text-center border-r border-gray-200 flex flex-col items-center justify-center">
              <div style={{ backgroundColor: ins.colore || '#3b82f6' }} className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"/>
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate">{ins.nome}</span>
            </div>
          ))}
          <div className="p-3 text-center bg-amber-100/60 flex flex-col items-center justify-center cursor-pointer rounded-tr-3xl">
            <Users className="w-4 h-4 text-amber-800 mb-0.5"/>
            <span className="font-black text-xs text-amber-950 uppercase tracking-wider">GRUPPO</span>
          </div>
        </div>

        <div className="relative flex-1 grid w-full min-w-[750px]" style={{ gridTemplateColumns }}>
          <div className="border-r border-gray-200 bg-gray-50/40 text-center divide-y divide-gray-100">
            {slots30.map((slot, i) => (
              <div key={i} className="h-8 text-[10px] font-extrabold text-gray-400 pt-1">{slot.oraStr.endsWith(':00') ? slot.oraStr : ''}</div>
            ))}
          </div>

          {insegnanti.map(ins => {
            const lezioniDocente = lezioniAttive.filter(l => l.insegnanteId === ins.id && !l.isGruppo);
            return (
              <div key={ins.id} className="border-r border-gray-100 relative divide-y divide-gray-100/60 bg-white">
                {slots30.map((slot, i) => (
                  <div key={i} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, ins.id, false, slot.oraStr)} className="h-8 hover:bg-slate-50/60 transition-colors"/>
                ))}
                {lezioniDocente.map(lez => {
                  const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
                  const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
                  const topPercent = ((hStart * 60 + mStart - startHourMins) / totalHoursMins) * 100;
                  const heightPercent = (((hEnd * 60 + mEnd) - (hStart * 60 + mStart)) / totalHoursMins) * 100;
                  return (
                    <div key={lez.id} draggable onDragStart={(e) => handleDragStart(e, lez)} onClick={() => setSelectedLezioneDetail(lez)}
                      style={{ top: `${topPercent}%`, height: `${heightPercent}%`, backgroundColor: (ins.colore || '#3b82f6') + '20', borderColor: ins.colore || '#3b82f6' }}
                      className="absolute left-1 right-1 border-l-4 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all z-10">
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

          <div className="bg-amber-50/30 relative divide-y divide-amber-100/50">
            {slots30.map((slot, i) => <div key={i} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, '', true, slot.oraStr)} className="h-8 hover:bg-amber-100/30 transition-colors"/>)}
            {gruppiFusiList.map((gf, idx) => {
              const [hStart, mStart] = gf.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = gf.oraFine.split(':').map(Number);
              const topPercent = ((hStart * 60 + mStart - startHourMins) / totalHoursMins) * 100;
              const heightPercent = (((hEnd * 60 + mEnd) - (hStart * 60 + mStart)) / totalHoursMins) * 100;
              return (
                <div key={idx} draggable onDragStart={(e) => handleDragStart(e, { isGruppoFuso: true, lezioni: gf.lezioni })}
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                  className="absolute left-1 right-1 bg-amber-300 border-l-4 border-amber-600 rounded-xl p-2.5 text-xs shadow-md flex flex-col justify-between cursor-pointer hover:bg-amber-400 z-10">
                  <div>
                    <div className="font-black text-amber-950 flex justify-between"><span className="truncate">👥 Gruppo Studio</span><span className="bg-amber-950 text-amber-300 font-black text-[10px] px-2 rounded-full">{gf.lezioni.flatMap(l => l.studentiIds || []).length} rag.</span></div>
                    <div className="text-[10px] font-extrabold text-amber-900 mt-1">🕒 {gf.oraInizio} - {gf.oraFine}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {isToday && redLineTop >= 0 && redLineTop <= 100 && (
            <div style={{ top: `${redLineTop}%` }} className="absolute left-0 right-0 border-b-2 border-rose-500 z-30 pointer-events-none flex items-center">
              <span className="bg-rose-500 text-white text-[9px] font-black px-1 rounded-r">ORA</span>
            </div>
          )}
        </div>
      </div>

      {/* COMPONENTE MODALE PIN IMPORTATO */}
      <ModalePin
        isOpen={pinConfig.isOpen}
        descrizione={pinConfig.description}
        onClose={() => setPinConfig({ isOpen: false, actionData: null, description: '' })}
        onSuccess={eseguiSpostamento}
      />
    </div>
  );
}

function stdsNames(studentiIds = [], studenti = []) {
  if (!studentiIds || studentiIds.length === 0) return 'Nessuno studente';
  return studentiIds.map(id => { const s = studenti.find(std => std.id === id); return s ? `${s.nome} ${s.cognome[0]}.` : ''; }).filter(Boolean).join(', ');
}
