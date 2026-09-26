import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, X, User, CheckCircle, FileText, Info, AlertOctagon, RotateCcw, Clock, Lock, Bell, Check, MessageSquare, History, Search } from 'lucide-react';

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
  
  const [showRichiesteModal, setShowRichiesteModal] = useState(false);
  const [showAnnullateModal, setShowAnnullateModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  
  // GESTIONE PIN UNIFICATA E AUTOMATICA
  const [pinModalConfig, setPinModalConfig] = useState({ isOpen: false, actionData: null, description: '' });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const PIN_SEGRETO = "1234";
  const pinInputRef = useRef(null);

  // LOG PERSISTENTE CON LOCALSTORAGE
  const [logsAttivita, setLogsAttivita] = useState(() => {
    try {
      const saved = localStorage.getItem('fuoriclasse_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 1, timestamp: new Date().toLocaleString(), operatore: 'Admin', azione: 'Avvio sistema planning e caricamento log di sicurezza' }
    ];
  });
  const [logSearchQuery, setLogSearchQuery] = useState('');

  const prevRichiesteCountRef = useRef(0);

  useEffect(() => {
    localStorage.setItem('fuoriclasse_logs', JSON.stringify(logsAttivita));
  }, [logsAttivita]);

  // Focus automatico sul PIN appena si apre il modale
  useEffect(() => {
    if (pinModalConfig.isOpen) {
      setTimeout(() => {
        if (pinInputRef.current) {
          pinInputRef.current.focus();
        }
      }, 50);
    }
  }, [pinModalConfig.isOpen]);

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

  const aggiungiLog = (descrizioneAzione) => {
    const nuovoLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      operatore: 'Segreteria / Admin',
      azione: descrizioneAzione
    };
    setLogsAttivita(prev => [nuovoLog, ...prev]);
  };

  // Funzione wrapper unificata per richiedere il PIN prima di qualsiasi azione critica
  const richiediAutorizzazionePin = (actionData, descrizione) => {
    setPinInput('');
    setPinError(false);
    setPinModalConfig({
      isOpen: true,
      actionData,
      description
    });
  };

  const eseguiAzioneAutenticata = () => {
    if (pinInput === PIN_SEGRETO) {
      const { actionData, description } = pinModalConfig;
      setPinModalConfig({ isOpen: false, actionData: null, description: '' });
      setPinInput('');

      if (actionData) {
        if (actionData.tipo === 'SPOSTAMENTO') {
          const { lezioneId, payloadAggiornato } = actionData;
          if (onUpdateLezioneCompleta) {
            onUpdateLezioneCompleta(lezioneId, payloadAggiornato);
          }
          aggiungiLog(`Spostamento autorizzato: ${description}`);
        }
      }
    } else {
      setPinError(true);
      if (pinInputRef.current) pinInputRef.current.focus();
    }
  };

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

  // GESTIONE DROP CORRETTA (Sposta per 30 min, cambia colonna docente o gruppo)
  const handleDrop = (e, targetInsegnanteId, targetIsGruppo = false, targetOraStr) => {
    e.preventDefault();
    const dataJson = e.dataTransfer.getData('application/json');
    if (!dataJson) return;

    try {
      const payload = JSON.parse(dataJson);
      const lezioneId = payload.id;
      if (!lezioneId) return;

      const [tH, tM] = targetOraStr.split(':').map(Number);
      const startMinsNew = tH * 60 + tM;

      const [hStart, mStart] = payload.oraInizio.split(':').map(Number);
      const [hEnd, mEnd] = payload.oraFine.split(':').map(Number);
      const durataMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);

      const endTotalMins = startMinsNew + (durataMins > 0 ? durataMins : 60); // Default 60 min se non specificato
      const endH = Math.floor(endTotalMins / 60).toString().padStart(2, '0');
      const endM = (endTotalMins % 60).toString().padStart(2, '0');
      const oraFineNuova = `${endH}:${endM}`;

      const payloadAggiornato = {
        ...payload,
        data: dataSelezionata,
        oraInizio: targetOraStr,
        oraFine: oraFineNuova,
        insegnanteId: targetIsGruppo ? '' : targetInsegnanteId,
        isGruppo: Boolean(targetIsGruppo)
      };

      const insObj = insegnanti.find(i => i.id === targetInsegnanteId);
      const nomeDestinazione = targetIsGruppo ? 'Gruppo Studio' : (insObj ? `${insObj.nome}` : 'Docente');

      richiediAutorizzazionePin(
        { tipo: 'SPOSTAMENTO', lezioneId, payloadAggiornato },
        `Lezione ID ${lezioneId} spostata alle ${targetOraStr} (${nomeDestinazione})`
      );
    } catch (err) {
      console.error("Errore nel parsing del drag and drop", err);
    }
  };

  const sendWhatsAppConfirmation = (lez) => {
    const std = studenti.find(s => (lez.studentiIds || []).includes(s.id));
    const ins = insegnanti.find(i => i.id === lez.insegnanteId);
    const nomeStudente = std ? `${std.nome} ${std.cognome}` : 'Studente';
    const nomeDocente = ins ? `${ins.nome} ${ins.cognome}` : 'un nostro docente';

    const testo = `Buongiorno, le confermo la prenotazione della lezione di ${lez.materia || 'doposcuola'} per ${nomeStudente} in data ${lez.data} dalle ${lez.oraInizio} alle ${lez.oraFine} con il docente ${nomeDocente}. Cordiali saluti - Fuori Classe Reception.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(testo)}`;
    window.open(url, '_blank');
    aggiungiLog(`Inviato promemoria WhatsApp per la lezione di ${nomeStudente}`);
  };

  const logsFiltrati = logsAttivita.filter(l => 
    l.azione.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    l.operatore.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    l.timestamp.toLowerCase().includes(logSearchQuery.toLowerCase())
  );

  const gridTemplateColumns = `60px repeat(${insegnanti.length}, minmax(150px, 1fr)) 160px`;

  return (
    <div className="w-full h-full p-0 flex flex-col space-y-3 select-none">
      {/* Header e comandi superiori */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 mx-4 mt-4 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl">
            <CalendarIcon className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Planning Lezioni & Sicurezza</h2>
            <p className="text-xs text-gray-500">Gestione flussi, docenti e log di controllo</p>
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

        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => setShowRichiesteModal(true)}
            className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              lezioniRichiesteOggi.length > 0 
                ? 'bg-rose-500 text-white border-rose-600 shadow-md animate-pulse' 
                : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
            }`}
          >
            <Bell className="w-4 h-4"/>
            <span>Richieste</span>
            {lezioniRichiesteOggi.length > 0 && (
              <span className="bg-white text-rose-600 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {lezioniRichiesteOggi.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowAnnullateModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-sm"
          >
            <AlertOctagon className="w-4 h-4 text-slate-600"/>
            <span>Annullate ({lezioniAnnullateOggi.length})</span>
          </button>

          {/* Pulsante Registro Log rimosso da qui e spostato in basso a sinistra come richiesto */}
          <button
            onClick={() => {
              onOpenModal();
              aggiungiLog("Apertura modale inserimento nuova lezione");
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4"/>
            <span>+ Nuova</span>
          </button>
        </div>
      </div>

      {/* Contenitore principale con Calendario e Widget LOG in basso a sinistra */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 mx-4 mb-4">
        
        {/* WIDGET LOG IN BASSO A SINISTRA (Come da foto) */}
        <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-3xl p-4 shadow-sm flex flex-col justify-between shrink-0 max-h-[680px]">
          <div className="space-y-3 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center space-x-2 text-indigo-900">
                <History className="w-5 h-5"/>
                <h3 className="font-black text-sm tracking-tight text-slate-900">Registro LOG Sicurezza</h3>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{logsAttivita.length}</span>
            </div>

            {/* Barra di ricerca nei log */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5"/>
              <input
                type="text"
                placeholder="Cerca nei log passati..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Lista dei log scrollabile */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 min-h-[300px]">
              {logsFiltrati.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs font-medium">Nessun log trovato.</div>
              ) : (
                logsFiltrati.map(log => (
                  <div key={log.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span className="font-bold text-indigo-900">{log.operatore}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-slate-800 font-medium leading-snug">{log.azione}</p>
                  </div>
                ))
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100">
              🔒 Storico permanente protetto e non eliminabile
            </p>
          </div>
        </div>

        {/* Griglia Calendario */}
        <div className="flex-1 bg-white border border-gray-200 rounded-3xl overflow-x-auto flex flex-col min-h-[680px] shadow-sm">
          <div 
            className="border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 grid w-full min-w-[750px] rounded-t-3xl"
            style={{ gridTemplateColumns }}
          >
            <div className="p-3 text-center text-[11px] font-extrabold text-gray-400 border-r border-gray-200">ORA</div>

            {insegnanti.map(ins => (
              <div key={ins.id} className="p-3 text-center border-r border-gray-200 flex flex-col items-center justify-center">
                <div style={{ backgroundColor: ins.colore || '#3b82f6' }} className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"/>
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate">{ins.nome}</span>
              </div>
            ))}

            <div
              onClick={() => setGroupModalData({ fascia: 'Intero Giorno', lezioniGroup: lezioniGruppoOggi })}
              className="p-3 text-center bg-amber-100/60 hover:bg-amber-100 flex flex-col items-center justify-center cursor-pointer rounded-tr-3xl"
            >
              <Users className="w-4 h-4 text-amber-800 mb-0.5"/>
              <span className="font-black text-xs text-amber-950 uppercase tracking-wider flex items-center">
                GRUPPO <span className="ml-1 text-[10px] bg-amber-300 text-amber-950 px-1.5 rounded-full">{lezioniGruppoOggi.length}</span>
              </span>
            </div>
          </div>

          <div 
            className="relative flex-1 grid w-full min-w-[750px]"
            style={{ gridTemplateColumns }}
          >
            <div className="border-r border-gray-200 bg-gray-50/40 text-center divide-y divide-gray-100">
              {slots30.map((slot, i) => (
                <div key={i} className="h-8 text-[10px] font-extrabold text-gray-400 pt-1">
                  {slot.oraStr.endsWith(':00') ? slot.oraStr : ''}
                </div>
              ))}
            </div>

            {insegnanti.map(ins => {
              const lezioniDocente = lezioniAttive.filter(l => l.insegnanteId === ins.id && !l.isGruppo);

              return (
                <div key={ins.id} className="border-r border-gray-100 relative divide-y divide-gray-100/60 bg-white">
                  {slots30.map((slot, i) => (
                    <div 
                      key={i} 
                      onDragOver={handleDragOver} 
                      onDrop={(e) => handleDrop(e, ins.id, false, slot.oraStr)} 
                      className="h-8 hover:bg-slate-50/60 transition-colors"
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
                        onClick={() => setSelectedLezioneDetail(lez)}
                        style={{
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                          backgroundColor: (ins.colore || '#3b82f6') + '20',
                          borderColor: ins.colore || '#3b82f6'
                        }}
                        className="absolute left-1 right-1 border-l-4 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all group z-10"
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

            <div className="bg-amber-50/30 relative divide-y divide-amber-100/50">
              {slots30.map((slot, i) => (
                <div 
                  key={i} 
                  onDragOver={handleDragOver} 
                  onDrop={(e) => handleDrop(e, '', true, slot.oraStr)} 
                  className="h-8 hover:bg-amber-100/30 transition-colors"
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

      </div>

      {/* MODALE UNIFICATO RICHIESTA PIN (Con auto-focus e zero click necessari) */}
      {pinModalConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6"/>
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Autorizzazione Sicurezza</h3>
              <p className="text-xs text-gray-500 mt-1">{pinModalConfig.description}</p>
            </div>

            <div className="space-y-2">
              <input
                ref={pinInputRef}
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') eseguiAzioneAutenticata(); }}
                className={`w-full text-center text-2xl tracking-widest font-black py-3 rounded-2xl border bg-gray-50 focus:outline-none ${
                  pinError ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-gray-200 text-slate-900'
                }`}
              />
              {pinError && <p className="text-[11px] font-bold text-rose-600">PIN errato! (Suggerimento: 1234)</p>}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setPinModalConfig({ isOpen: false, actionData: null, description: '' })}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
              >
                Annulla
              </button>
              <button
                onClick={eseguiAzioneAutenticata}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                Conferma PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE RICHIESTE APP */}
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
                            aggiungiLog(`Approvata richiesta app per ID ${req.id}`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm shrink-0"
                        >
                          <Check className="w-3.5 h-3.5"/> Accetta
                        </button>

                        <button
                          onClick={() => {
                            if (onRejectRichiesta) onRejectRichiesta(req.id, 'Orario o docente non disponibile');
                            aggiungiLog(`Rifiutata richiesta app per ID ${req.id}`);
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

      {/* MODALE ANNULLATE */}
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
                  <div key={lez.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
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

                    <button
                      onClick={() => {
                        if (onRestoreLezione) {
                          onRestoreLezione(lez.id);
                          aggiungiLog(`Ripristinata lezione annullata ID ${lez.id}`);
                        }
                      }}
                      className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm shrink-0 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5"/> Ripristina
                    </button>
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
                          aggiungiLog(`Consultata scheda studente: ${std ? std.nome : sId}`);
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
