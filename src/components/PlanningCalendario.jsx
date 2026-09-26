{/* MODALE ANNULLATE & RISCHEDULAZIONE */}
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
                      {lez.note && <p className="text-[10px] text-gray-500 italic">Note: {lez.note}</p>}
                    </div>

                    <button
                      onClick={() => {
                        setShowAnnullateModal(false);
                        // Apre il modale impostando la rischedulazione con i dati ereditati
                        if (onOpenModal) {
                          onOpenModal({
                            data: dataSelezionata,
                            oraInizio: lez.oraInizio,
                            oraFine: lez.oraFine,
                            materia: lez.materia,
                            note: lez.note || '',
                            studentiIds: lez.studentiIds || [],
                            insegnanteId: lez.insegnanteId || '',
                            isGruppo: Boolean(lez.isGruppo),
                            isRischedulazione: true
                          });
                        }
                        if (aggiungiLog) aggiungiLog(`Avviata rischedulazione lezione annullata ID: ${lez.id}`);
                      }}
                      className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shrink-0 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5"/>
                      <span>Rischedula</span>
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
