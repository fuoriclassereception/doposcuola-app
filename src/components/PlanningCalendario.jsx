import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, X, User, CheckCircle, FileText, Info, AlertOctagon, RotateCcw, Clock, Lock, Bell, Check, MessageSquare, ArrowRightLeft } from 'lucide-react';
import ModalePin from './ModalePin';

export default function PlanningCalendario({
  insegnanti = [],
  studenti = [],
  lezioni = [],
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

  // Filtro insegnanti attivi: se disattivati non occupano colonne
  const insegnantiAttivi = insegnanti.filter(i => i.attivo !== false);

  const [groupModalData, setGroupModalData] = useState(null);
  const [selectedLezioneDetail, setSelectedLezioneDetail] = useState(null);
  
  const [showRichiesteModal, setShowRichiesteModal] = useState(false);
  const [showAnnullateModal, setShowAnnullateModal] = useState(false);
  
  // Gestione PIN unificata
  const [pinConfig, setPinConfig] = useState({ isOpen: false, actionCallback: null, description: '' });

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

  // Raggruppamento per fascia oraria per la colonna gruppo
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

    try {
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

      const payloadAggiornato = {
        lezioneId: lezioneId,
        data: dataSelezionata,
        oraInizio: targetOraStr,
        oraFine: oraFineNuova,
        insegnanteId: targetIsGruppo ? '' : targetInsegnanteId,
        isGruppo: Boolean(targetIsGruppo)
      };

      const docDest = targetIsGruppo ? 'Gruppo Studio' : (insegnanti.find(i => i.id === targetInsegnanteId)?.nome || 'Docente');

      setPinConfig({
        isOpen: true,
        description: `Spostamento lezione alle ore ${targetOraStr} su ${docDest}`,
        actionCallback: () => {
          if (onUpdateLezioneCompleta) {
            onUpdateLezioneCompleta(payloadAggiornato);
            if (aggiungiLog) aggiungiLog(`Spostata lezione ID: ${lezioneId} alle ore ${targetOraStr} (${docDest})`);
          }
        }
      });
    } catch (err) {
      console.error("Errore drag and drop", err);
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
    if (aggiungiLog) aggiungiLog(`Inviato promemoria WhatsApp a ${nomeStudente}`);
  };

  // Dinamica colonne basata ESCLUSIVAMENTE sugli insegnanti attivi
  const gridTemplateColumns = `60px repeat(${insegnantiAttivi.length}, minmax(150px, 1fr)) 160px`;

  return (
    <div className="w-full h-full p-0 flex flex-col space-y-3 select-none">
      
      {/* HEADER CALENDARIO */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 mx-4 mt-4 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl"><CalendarIcon className="w-5 h-5"/></div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Planning Lezioni</h2>
            <p className="text-xs text-gray-500">Clicca per visualizzare o trascina per spostare</p>
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
          
          <button onClick={() => { onOpenModal(); if (aggiungiLog) aggiungiLog("Apertura finestra nuova lezione"); }} className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm">
            <Plus className="w-4 h-4"/><span>+ Nuova</span>
          </button>
        </div>
      </div>

      {/* GRIGLIA CALENDARIO */}
      <div className="flex-1 bg-white border border-gray-200 rounded-3xl mx-4 mb-4 overflow-x-auto flex flex-col min-h-[650px] shadow-sm">
        
        {/* Intestazione Docenti Attivi + Gruppo */}
        <div className="border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 grid w-full min-w-[750px] rounded-t-3xl" style={{ gridTemplateColumns }}>
          <div className="p-3 text-center text-[11px] font-extrabold text-gray-400 border-r border-gray-200">ORA</div>
          
          {insegnantiAttivi.map(ins => (
            <div key={ins.id} className="p-3 text-center border-r border-gray-200 flex flex-col items-center justify-center">
              <div style={{ backgroundColor: ins.colore || '#3b82f6' }} className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm"/>
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider truncate">{ins.nome}</span>
            </div>
          ))}

          <div 
            onClick={() => setGroupModalData({ fascia: 'Tutto il giorno', lezioniGroup: lezioniGruppoOggi })}
            className="p-3 text-center bg-amber-100/60 hover:bg-amber-100 flex flex-col items-center justify-center cursor-pointer rounded-tr-3xl transition-colors"
          >
            <Users className="w-4 h-4 text-amber-800 mb-0.5"/>
            <span className="font-black text-xs text-amber-950 uppercase tracking-wider flex items-center">
              GRUPPO <span className="ml-1 text-[10px] bg-amber-300 text-amber-950 px-1.5 rounded-full">{lezioniGruppoOggi.length}</span>
            </span>
          </div>
        </div>

        {/* Corpo Calendario */}
        <div className="relative flex-1 grid w-full min-w-[750px]" style={{ gridTemplateColumns }}>
          <div className="border-r border-gray-200 bg-gray-50/40 text-center divide-y divide-gray-100">
            {slots30.map((slot, i) => (
              <div key={i} className="h-8 text-[10px] font-extrabold text-gray-400 pt-1">{slot.oraStr.endsWith(':00') ? slot.oraStr : ''}</div>
            ))}
          </div>

          {/* Colonne Docenti Attivi */}
          {insegnantiAttivi.map(ins => {
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
                    <div 
                      key={lez.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, lez)} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLezioneDetail(lez);
                      }}
                      style={{ 
                        top: `${topPercent}%`, 
                        height: `${heightPercent}%`, 
                        backgroundColor: (ins.colore || '#3b82f6') + '20', 
                        borderColor: ins.colore || '#3b82f6' 
                      }}
                      className="absolute left-1 right-1 border-l-4 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all z-10"
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

          {/* Colonna Gruppo Studio */}
          <div className="bg-amber-50/30 relative divide-y divide-amber-100/50">
            {slots30.map((slot, i) => (
              <div key={i} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, '', true, slot.oraStr)} className="h-8 hover:bg-amber-100/30 transition-colors"/>
            ))}

            {gruppiFusiList.map((gf, idx) => {
              const [hStart, mStart] = gf.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = gf.oraFine.split(':').map(Number);
              const topPercent = ((hStart * 60 + mStart - startHourMins) / totalHoursMins) * 100;
              const heightPercent = (((hEnd * 60 + mEnd) - (hStart * 60 + mStart)) / totalHoursMins) * 100;
              const tuttiStudentiIds = gf.lezioni.flatMap(l => l.studentiIds || []);

              return (
                <div 
                  key={idx} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, gf.lezioni[0])} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupModalData({ fascia: `${gf.oraInizio} - ${gf.oraFine}`, lezioniGroup: gf.lezioni });
                  }}
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                  className="absolute left-1 right-1 bg-amber-300 border-l-4 border-amber-600 rounded-xl p-2.5 text-xs shadow-md flex flex-col justify-between cursor-pointer hover:bg-amber-400 transition-all z-10"
                >
                  <div>
                    <div className="font-black text-amber-950 flex justify-between">
                      <span className="truncate">👥 Gruppo Studio</span>
                      <span className="bg-amber-950 text-amber-300 font-black text-[10px] px-2 rounded-full shrink-0">
                        {tuttiStudentiIds.length} rag.
                      </span>
                    </div>
                    <div className="text-[10px] font-extrabold text-amber-900 mt-1">🕒 {gf.oraInizio} - {gf.oraFine}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linea oraria corrente */}
          {isToday && redLineTop >= 0 && redLineTop <= 100 && (
            <div style={{ top: `${redLineTop}%` }} className="absolute left-0 right-0 border-b-2 border-rose-500 z-30 pointer-events-none flex items-center">
              <span className="bg-rose-500 text-white text-[9px] font-black px-1 rounded-r">ORA</span>
            </div>
          )}
        </div>
      </div>

      {/* MODALE DETTAGLIO LEZIONE (Apre la scheda dello studente al click) */}
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
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Studenti Iscritti (Clicca per aprire la scheda)</label>
                <div className="space-y-1.5">
                  {(selectedLezioneDetail.studentiIds || []).map(sId => {
                    const std = studenti.find(s => s.id === sId);
                    return (
                      <button
                        key={sId}
                        onClick={() => {
                          setSelectedLezioneDetail(null);
                          if (onSelectStudent) onSelectStudent(sId);
                        }}
                        className="w-full bg-slate-100 hover:bg-amber-100/70 p-2.5 rounded-xl flex items-center justify-between font-extrabold text-slate-900 text-left text-xs transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-700"/>
                          <span>{std ? `${std.nome} ${std.cognome}` : 'Studente'}</span>
                        </div>
                        <span className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-lg font-bold">Apri Scheda Studente ➔</span>
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

      {/* MODALE DETTAGLIO GRUPPO: PERMETTE DI SPOSTARE/ESTRARRE DAL GRUPPO A UN DOCENTE */}
      {groupModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-amber-900">
                <Users className="w-5 h-5 text-amber-600"/>
                <h3 className="font-extrabold text-base text-slate-900">Gestione Gruppo Studio ({groupModalData.fascia})</h3>
              </div>
              <button onClick={() => setGroupModalData(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-gray-500 font-medium">Puoi aprire la scheda o riassegnare direttamente la lezione a un docente singolo:</p>
              
              {groupModalData.lezioniGroup.map(lez => (
                <div key={lez.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900">{stdsNames(lez.studentiIds, studenti)}</span>
                      <div className="text-[11px] text-gray-600">🕒 {lez.oraInizio} - {lez.oraFine} • {lez.materia || 'Doposcuola'}</div>
                    </div>
                    <button 
                      onClick={() => {
                        setGroupModalData(null);
                        if (onSelectStudent && lez.studentiIds?.[0]) onSelectStudent(lez.studentiIds[0]);
                      }}
                      className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded-lg text-[10px]"
                    >
                      Scheda
                    </button>
                  </div>

                  {/* Selezione e spostamento a docente singolo */}
                  <div className="pt-2 border-t border-amber-200/80 flex items-center gap-2">
                    <select id={`doc_dest_${lez.id}`} className="p-1 bg-white border border-amber-300 rounded-lg text-xs font-bold flex-1 text-slate-900">
                      <option value="">Riassegna a un docente...</option>
                      {insegnantiAttivi.map(i => (
                        <option key={i.id} value={i.id}>{i.nome} {i.cognome}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const selDoc = document.getElementById(`doc_dest_${lez.id}`).value;
                        if (!selDoc) {
                          alert("Seleziona prima un docente a cui riassegnare la lezione.");
                          return;
                        }
                        const nomeDoc = insegnanti.find(i => i.id === selDoc)?.nome || 'Docente';
                        setPinConfig({
                          isOpen: true,
                          description: `Spostamento lezione dal gruppo al docente ${nomeDoc}`,
                          actionCallback: () => {
                            if (onUpdateLezioneCompleta) {
                              onUpdateLezioneCompleta({
                                lezioneId: lez.id,
                                data: lez.data,
                                oraInizio: lez.oraInizio,
                                oraFine: lez.oraFine,
                                insegnanteId: selDoc,
                                isGruppo: false
                              });
                              if (aggiungiLog) aggiungiLog(`Estratta lezione dal gruppo e assegnata a ${nomeDoc}`);
                            }
                            setGroupModalData(null);
                          }
                        });
                      }}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5"/> Sposta
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button onClick={() => setGroupModalData(null)} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">Chiudi</button>
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
                            Docente: <strong className="text-amber-800">{insRichiesto ? `${insRichiesto.nome} ${insRichiesto.cognome}` : 'Nessuno'}</strong>
                          </p>
                        </div>
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Da Approvare</span>
                      </div>

                      <div className="pt-2 border-t border-sky-200 flex items-center justify-between gap-2">
                        <select defaultValue={req.insegnanteId || insegnantiAttivi[0]?.id} id={`sel_doc_${req.id}`} className="p-1.5 bg-white border border-sky-300 rounded-xl font-bold text-slate-900 text-xs flex-1">
                          {insegnantiAttivi.map(ins => (
                            <option key={ins.id} value={ins.id}>{ins.nome} {ins.cognome} ({ins.materia})</option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            const selectedDocId = document.getElementById(`sel_doc_${req.id}`).value;
                            if (onAcceptRichiesta) onAcceptRichiesta(req.id, selectedDocId);
                            if (aggiungiLog) aggiungiLog(`Approvata richiesta app per ID ${req.id}`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm shrink-0"
                        >
                          <Check className="w-3.5 h-3.5"/> Accetta
                        </button>

                        <button
                          onClick={() => {
                            if (onRejectRichiesta) onRejectRichiesta(req.id, 'Orario o docente non disponibile');
                            if (aggiungiLog) aggiungiLog(`Rifiutata richiesta app per ID ${req.id}`);
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
                    </div>

                    <button
                      onClick={() => {
                        setPinConfig({
                          isOpen: true,
                          description: `Ripristino lezione di ${stdsNames(lez.studentiIds, studenti)}`,
                          actionCallback: () => {
                            if (onRestoreLezione) onRestoreLezione(lez.id);
                            if (aggiungiLog) aggiungiLog(`Ripristinata lezione ID: ${lez.id}`);
                          }
                        });
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

      {/* COMPONENTE MODALE PIN ISOLATO */}
      <ModalePin
        isOpen={pinConfig.isOpen}
        descrizione={pinConfig.description}
        onClose={() => setPinConfig({ isOpen: false, actionCallback: null, description: '' })}
        onSuccess={() => {
          if (pinConfig.actionCallback) pinConfig.actionCallback();
          setPinConfig({ isOpen: false, actionCallback: null, description: '' });
        }}
      />
    </div>
  );
}

function stdsNames(studentiIds = [], studenti = []) {
  if (!studentiIds || studentiIds.length === 0) return 'Nessuno studente';
  return studentiIds.map(id => { 
    const s = studenti.find(std => std.id === id); 
    return s ? `${s.nome} ${s.cognome[0]}.` : ''; 
  }).filter(Boolean).join(', ');
}
