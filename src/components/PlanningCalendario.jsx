import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, X, User, CheckCircle, FileText, Edit, Info } from 'lucide-react';

export default function PlanningCalendario({
  insegnanti,
  studenti,
  lezioni,
  onDeleteLezione,
  onOpenModal,
  onSelectStudent, // Funzione per aprire la scheda dello studente selezionato
  onUpdateLezioneStatus // Funzione per aggiornare lo stato (es. Confermata / Svolta)
}) {
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Stato per Pop-up Gruppo e Dettaglio Lezione Selezionata
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedLezioneDetail, setSelectedLezioneDetail] = useState(null);

  const orari = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

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

  const startHour = 9;
  const totalHours = 12;
  const isToday = dataSelezionata === new Date().toISOString().split('T')[0];
  const redLineTop = ((currentTimeMinutes - startHour * 60) / (totalHours * 60)) * 100;

  // Filtra lezioni di gruppo del giorno
  const lezioniGruppoOggi = lezioni.filter(l => l.data === dataSelezionata && l.isGruppo);

  const handleStudentClick = (studentId) => {
    setShowGroupModal(false);
    setSelectedLezioneDetail(null);
    if (onSelectStudent) {
      onSelectStudent(studentId);
    }
  };

  return (
    <div className="w-full h-full p-0 flex flex-col space-y-3">
      {/* Intestazione e Controlli Data */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 mx-4 mt-4 rounded-3xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl">
            <CalendarIcon className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Planning Lezioni</h2>
            <p className="text-xs text-gray-500">Vista oraria giornaliera</p>
          </div>
        </div>

        {/* Selettore Data */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-white rounded-xl text-gray-700 transition-all">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <input
            type="date"
            value={dataSelezionata}
            onChange={(e) => setDataSelezionata(e.target.value)}
            className="bg-transparent font-extrabold text-xs text-slate-900 focus:outline-none px-2"
          />
          <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-white rounded-xl text-gray-700 transition-all">
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>

        <button
          onClick={() => onOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4"/>
          <span>+ Nuova Lezione</span>
        </button>
      </div>

      {/* Griglia Calendario (Full Width) */}
      <div className="flex-1 bg-white border-t border-b border-gray-200 overflow-x-auto flex flex-col min-h-[650px] w-full">
        {/* Intestazione Colonne */}
        <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(150px,1fr))] border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 w-full min-w-[800px]">
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

          {/* Colonna GRUPPO */}
          <div
            onClick={() => setShowGroupModal(true)}
            className="p-3 text-center bg-amber-100/60 hover:bg-amber-100 border-l-2 border-amber-300 flex flex-col items-center justify-center cursor-pointer transition-all"
          >
            <Users className="w-4 h-4 text-amber-800 mb-0.5"/>
            <span className="font-black text-xs text-amber-950 uppercase tracking-wider flex items-center">
              GRUPPO <span className="ml-1 text-[10px] bg-amber-300 text-amber-950 px-1.5 py-0.2 rounded-full">{lezioniGruppoOggi.length}</span>
            </span>
          </div>
        </div>

        {/* Corpo della Griglia */}
        <div className="relative flex-1 grid grid-cols-[60px_repeat(auto-fit,minmax(150px,1fr))] w-full min-w-[800px]">
          <div className="border-r border-gray-200 bg-gray-50/40 text-center divide-y divide-gray-100">
            {orari.map(ora => (
              <div key={ora} className="h-16 text-[11px] font-extrabold text-gray-400 pt-2">
                {ora}:00
              </div>
            ))}
          </div>

          {/* Colonne Insegnanti Singoli */}
          {insegnanti.map(ins => {
            const lezioniDocente = lezioni.filter(
              l => l.data === dataSelezionata && l.insegnanteId === ins.id && !l.isGruppo
            );

            return (
              <div key={ins.id} className="border-r border-gray-100 relative divide-y divide-gray-100 bg-white">
                {orari.map(ora => <div key={ora} className="h-16 hover:bg-slate-50/50 transition-all"/>)}

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
                      className="absolute left-1 right-1 border-l-4 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between hover:scale-[1.01] cursor-pointer transition-all group"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 truncate">{nomiStudenti}</div>
                        <div className="text-[10px] font-bold text-gray-600 truncate">{lez.materia || 'Materia non spec.'}</div>
                        <div className="text-[9px] font-extrabold text-gray-500 mt-0.5">{lez.oraInizio} - {lez.oraFine}</div>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        {lez.confermata && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1 rounded">Svolta</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Colonna GRUPPO */}
          <div
            onClick={() => setShowGroupModal(true)}
            className="border-l-2 border-amber-200 bg-amber-50/30 relative divide-y divide-amber-100/50 cursor-pointer"
          >
            {orari.map(ora => <div key={ora} className="h-16 hover:bg-amber-100/30 transition-all"/>)}

            {lezioniGruppoOggi.map(lez => {
              const [hStart, mStart] = lez.oraInizio.split(':').map(Number);
              const [hEnd, mEnd] = lez.oraFine.split(':').map(Number);
              const topPercent = (((hStart - startHour) * 60 + mStart) / (totalHours * 60)) * 100;
              const heightPercent = (((hEnd - hStart) * 60 + (mEnd - mStart)) / (totalHours * 60)) * 100;
              const numStudenti = lez.studentiIds?.length || 0;

              return (
                <div
                  key={lez.id}
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                  className="absolute left-1 right-1 bg-amber-200/90 border-l-4 border-amber-500 rounded-xl p-2 text-xs shadow-sm overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all"
                >
                  <div>
                    <div className="font-black text-amber-950 flex items-center justify-between">
                      <span className="truncate">👥 {lez.materia || 'Gruppo Studio'}</span>
                      <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                        {numStudenti} ragazzi
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-amber-900 mt-0.5">
                      Orario: {lez.oraInizio} - {lez.oraFine}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linea Rossa dell'Ora Attuale */}
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

      {/* MODALE 1: Dettaglio Partecipanti Gruppo (Opzione B) */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <Users className="w-5 h-5"/>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Partecipanti Gruppi del Giorno</h3>
                  <p className="text-xs text-gray-500">Clicca sullo studente per accedere ai compiti e materiali[cite: 8]</p>
                </div>
              </div>
              <button onClick={() => setShowGroupModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {lezioniGruppoOggi.length === 0 ? (
                <p className="text-center text-xs font-bold text-gray-400 py-8">Nessun gruppo programmato per la data selezionata.</p>
              ) : (
                lezioniGruppoOggi.map((lg, idx) => (
                  <div key={idx} className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
                      <span className="font-black text-xs text-amber-950 uppercase tracking-wide">
                        {lg.materia || 'Gruppo Studio'}
                      </span>
                      <span className="bg-amber-200 text-amber-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg">
                        🕒 {lg.oraInizio} - {lg.oraFine}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {(lg.studentiIds || []).map(sId => {
                        const std = studenti.find(s => s.id === sId);
                        return (
                          <button
                            key={sId}
                            onClick={() => handleStudentClick(sId)}
                            className="bg-white hover:bg-amber-100 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 shadow-sm transition-all text-left"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <User className="w-4 h-4 text-amber-600 shrink-0"/>
                              <span className="truncate">{std ? `${std.nome} ${std.cognome}` : 'Studente'}</span>
                            </div>
                            <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 hover:text-amber-700" title="Vedi compiti / materiali"/>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 2: Dettaglio / Gestione Singola Lezione */}
      {selectedLezioneDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-slate-900"/>
                <h3 className="font-extrabold text-lg text-slate-900">Dettaglio Lezione</h3>
              </div>
              <button onClick={() => setSelectedLezioneDetail(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-black text-slate-900 text-sm">{selectedLezioneDetail.materia || 'Lezione'}</div>
                <div className="text-gray-600 font-bold">🕒 Orario: {selectedLezioneDetail.oraInizio} - {selectedLezioneDetail.oraFine}</div>
                <div className="text-gray-600 font-bold">📅 Data: {selectedLezioneDetail.data}</div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                  Studenti Iscritti (Clicca per compiti/scheda)
                </label>
                <div className="space-y-1.5">
                  {(selectedLezioneDetail.studentiIds || []).map(sId => {
                    const std = studenti.find(s => s.id === sId);
                    return (
                      <button
                        key={sId}
                        onClick={() => handleStudentClick(sId)}
                        className="w-full bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl flex items-center justify-between font-extrabold text-slate-900 transition-all text-left"
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-700"/>
                          <span>{std ? `${std.nome} ${std.cognome}` : 'Studente'}</span>
                        </div>
                        <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <FileText className="w-3 h-3"/> Scheda / Materiali
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Azioni sulla Lezione */}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={() => {
                  onDeleteLezione(selectedLezioneDetail.id);
                  setSelectedLezioneDetail(null);
                }}
                className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4"/>
                <span>Elimina</span>
              </button>

              <div className="flex space-x-2">
                {onUpdateLezioneStatus && (
                  <button
                    onClick={() => {
                      onUpdateLezioneStatus(selectedLezioneDetail.id, !selectedLezioneDetail.confermata);
                      setSelectedLezioneDetail(null);
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4"/>
                    <span>{selectedLezioneDetail.confermata ? 'Annulla Presenza' : 'Conferma Presenza'}</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedLezioneDetail(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Chiudi
                </button>
              </div>
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
