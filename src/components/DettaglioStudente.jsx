import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Edit3,
  Check,
  Plus, 
  Wallet, 
  CheckCircle2, 
  Banknote,
  FileText,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { getTariffaEffettiva, getStatoBorsellino, TARIFFE_STANDARD } from '../utils/tariffeConfig';
import ModaleQuietanza from './ModaleQuietanza';

export default function DettaglioStudente({
  studente,
  lezioni = [],
  onClose,
  onUpdateLezioneCompleta,
  onUpdateLezioneStatus,
  onRicaricaPacchetto,
  aggiungiLog
}) {
  const [showRicaricaModal, setShowRicaricaModal] = useState(false);
  const [editingLezioneId, setEditingLezioneId] = useState(null);
  const [editTimes, setEditTimes] = useState({ oraInizio: '', oraFine: '' });

  // Stato per apertura Quietanza Stampa
  const [selectedQuietanza, setSelectedQuietanza] = useState(null);

  const [ricaricaForm, setRicaricaForm] = useState({
    costoTotale: 220,
    importoPagato: 220,
    metodoPagamento: 'Contanti',
    note: ''
  });

  if (!studente) return null;

  // Calcolo tariffe e stato borsellino tramite il modulo centrale
  const tariffaOraria = getTariffaEffettiva(studente);
  const { totaleVersato, totaleConsumato, creditoResiduo, daSaldare, totalePattuito } = getStatoBorsellino(studente);

  // Stima ore disponibili con il credito residuo
  const oreDisponibiliStimate = tariffaOraria > 0 ? Number((creditoResiduo / tariffaOraria).toFixed(1)) : 0;

  const storicoRicariche = studente.storicoRicariche || [];

  const lezioniStudente = lezioni.filter(l => 
    (l.studentiIds || []).includes(studente.id)
  ).sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  const handleStartEditLezione = (lez) => {
    setEditingLezioneId(lez.id);
    setEditTimes({ oraInizio: lez.oraInizio, oraFine: lez.oraFine });
  };

  const handleSaveEditLezione = (lez) => {
    if (!editTimes.oraInizio || !editTimes.oraFine) return;
    if (onUpdateLezioneCompleta) {
      onUpdateLezioneCompleta({
        lezioneId: lez.id,
        data: lez.data,
        oraInizio: editTimes.oraInizio,
        oraFine: editTimes.oraFine,
        insegnanteId: lez.insegnanteId,
        isGruppo: Boolean(lez.isGruppo)
      });
      if (aggiungiLog) aggiungiLog(`Modificato orario lezione per ${studente.nome}: ${editTimes.oraInizio} - ${editTimes.oraFine}`);
    }
    setEditingLezioneId(null);
  };

  const handleSalvaRicarica = (e) => {
    e.preventDefault();
    const costo = parseFloat(ricaricaForm.costoTotale) || 0;
    const pagato = parseFloat(ricaricaForm.importoPagato) || 0;

    if (costo <= 0 && pagato <= 0) {
      alert("Inserisci un importo valido.");
      return;
    }

    if (onRicaricaPacchetto) {
      onRicaricaPacchetto(studente.id, {
        costoDaAggiungere: costo,
        pagatoDaAggiungere: pagato,
        metodoPagamento: ricaricaForm.metodoPagamento,
        note: ricaricaForm.note,
        tariffaApplicata: tariffaOraria,
        data: new Date().toLocaleDateString('it-IT')
      });
    }

    setShowRicaricaModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Intestazione Scheda */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-amber-400 text-slate-950 font-black text-xl rounded-2xl flex items-center justify-center shadow-md">
              {studente.nome?.[0]}{studente.cognome?.[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-black">{studente.nome} {studente.cognome}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${studente.attivo !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {studente.attivo !== false ? 'Attivo' : 'Inattivo'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-300 flex-wrap">
                <span>{studente.scuola || 'Scuola non indicata'}</span>
                <span>•</span>
                {/* Badge Tariffa */}
                {studente.haTariffaRiservata ? (
                  <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md font-black text-[10px]">
                    ⭐ Tariffa Riservata ({tariffaOraria.toFixed(2)} €/h)
                  </span>
                ) : (
                  <span className="bg-slate-800 text-amber-300 border border-amber-300/40 px-2 py-0.5 rounded-md font-bold text-[10px]">
                    Tariffa {studente.categoriaTariffaria || 'medie'} ({tariffaOraria.toFixed(2)} €/h)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6"/>
          </button>
        </div>

        {/* Corpo scrollabile */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* 1. GESTIONE LEZIONI (ORARI & DURATA) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500"/>
                  <span>Gestione Lezioni Programmate ({lezioniStudente.length})</span>
                </h3>
                <p className="text-xs text-gray-500">Modifica orari, durata o annulla lezioni</p>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto border border-gray-200 rounded-2xl p-2 bg-gray-50/50">
              {lezioniStudente.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs font-bold">Nessuna lezione trovata per questo studente.</div>
              ) : (
                lezioniStudente.map(lez => {
                  const isEditing = editingLezioneId === lez.id;
                  const statoLower = (lez.stato || '').toLowerCase();

                  return (
                    <div key={lez.id} className="p-3 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">{lez.materia || 'Doposcuola'}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                            statoLower === 'svolta' ? 'bg-emerald-100 text-emerald-800' :
                            statoLower === 'annullata' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {lez.stato || 'attiva'}
                          </span>
                        </div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-2 font-medium">
                          <span>📅 {lez.data}</span>
                          {!isEditing ? (
                            <span>🕒 {lez.oraInizio} - {lez.oraFine}</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input 
                                type="time" 
                                value={editTimes.oraInizio} 
                                onChange={(e) => setEditTimes(prev => ({ ...prev, oraInizio: e.target.value }))}
                                className="p-1 border border-amber-300 rounded font-bold text-xs"
                              />
                              <span>-</span>
                              <input 
                                type="time" 
                                value={editTimes.oraFine} 
                                onChange={(e) => setEditTimes(prev => ({ ...prev, oraFine: e.target.value }))}
                                className="p-1 border border-amber-300 rounded font-bold text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Azioni */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => handleStartEditLezione(lez)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-800 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5"/> Modifica Orario
                            </button>
                            {statoLower === 'attiva' && (
                              <button
                                onClick={() => {
                                  if (confirm("Vuoi annullare questa lezione?")) {
                                    if (onUpdateLezioneStatus) onUpdateLezioneStatus(lez.id, 'annullata', 'Annullata da scheda studente', 'gratuito');
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px]"
                              >
                                Annulla
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSaveEditLezione(lez)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5"/> Salva
                            </button>
                            <button
                              onClick={() => setEditingLezioneId(null)}
                              className="px-2.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg text-[11px]"
                            >
                              Annulla
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. RECAPITI & GENITORE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-gray-400">Recapiti Studente</h4>
              <p><strong>Telefono:</strong> {studente.telefono || 'Non specificato'}</p>
              <p><strong>Email:</strong> {studente.email || 'Non specificata'}</p>
              <p><strong>Data di Nascita:</strong> {studente.dataNascita || 'Non specificata'}</p>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600"/>
                <span>Referente Genitore (Intestatario Fiscale)</span>
              </h4>
              <p><strong>Nome:</strong> {studente.genitoreNome || 'Non specificato'}</p>
              <p><strong>Codice Fiscale:</strong> {studente.genitoreCodiceFiscale || 'Non specificato'}</p>
              <p><strong>Telefono:</strong> {studente.genitoreTelefono || 'Non specificato'}</p>
            </div>
          </div>

          {/* 3. PLAFOND DIDATTICO & STATO CASSA */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-500"/>
                  <span>Plafond Didattico & Credito</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Tariffa oraria applicata: <strong>{tariffaOraria.toFixed(2)} €/h</strong>
                  {studente.haTariffaRiservata && studente.tariffaRiservataMotivo ? ` (${studente.tariffaRiservataMotivo})` : ''}
                </p>
              </div>

              <button
                onClick={() => setShowRicaricaModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5"/>
                <span>+ Ricarica Plafond</span>
              </button>
            </div>

            {/* Indicatori Economici del Borsellino */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                creditoResiduo > 50 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 
                creditoResiduo > 0 ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <span className="text-[10px] font-bold uppercase text-gray-500">Credito Residuo Disponibile</span>
                <div className="text-2xl font-black mt-1">{creditoResiduo.toFixed(2)} €</div>
                <span className="text-[10px] font-extrabold mt-1">
                  {creditoResiduo > 0 ? `~ ${oreDisponibiliStimate} ore coperte` : '⚠️ Credito esaurito (da ricaricare)'}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-gray-400">Totale Versato</span>
                <div className="text-xl font-black text-slate-900 mt-1">{totaleVersato.toFixed(2)} €</div>
                <span className="text-[10px] font-bold text-gray-500 mt-1">Storico ricariche incassate</span>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-gray-400">Totale Didattica Erogata</span>
                <div className="text-xl font-black text-slate-900 mt-1">{totaleConsumato.toFixed(2)} €</div>
                <span className="text-[10px] font-bold text-gray-500 mt-1">Valore lezioni svolte</span>
              </div>
            </div>

            {/* Stato Sospesi */}
            {daSaldare > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center text-xs">
                <span className="font-extrabold text-rose-950">Attenzione: Quota pattuita ancora da saldare</span>
                <span className="font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">
                  {daSaldare.toFixed(2)} €
                </span>
              </div>
            )}

            {/* Storico Ricariche con Tasto Stampa Quietanza */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-gray-500">
                Ricevute & Ricariche Registrate ({storicoRicariche.length})
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5">
                {storicoRicariche.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-xs font-bold">Nessuna ricarica registrata finora.</div>
                ) : (
                  storicoRicariche.map((r, i) => (
                    <div key={i} className="p-2.5 bg-white rounded-xl border border-gray-200 text-xs flex justify-between items-center gap-2">
                      <div>
                        <div className="font-black text-slate-900">
                          +{Number(r.pagato || 0).toFixed(2)} € <span className="font-medium text-gray-500">via {r.metodo} • {r.data}</span>
                        </div>
                        {r.note && <div className="text-[10px] text-amber-900 font-bold mt-0.5">Nota: {r.note}</div>}
                      </div>

                      <button
                        onClick={() => setSelectedQuietanza(r)}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-sm transition-all"
                      >
                        <FileText className="w-3 h-3 text-amber-400"/>
                        <span>Stampa Quietanza</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Chiusura */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm">
            Chiudi Scheda
          </button>
        </div>

      </div>

      {/* MINI-MODALE RICARICA PLAFOND */}
      {showRicaricaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-600"/>
                <h3 className="font-extrabold text-base text-slate-900">Ricarica Plafond Didattico</h3>
              </div>
              <button onClick={() => setShowRicaricaModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSalvaRicarica} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Quota Pattuita (€)</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    required
                    value={ricaricaForm.costoTotale}
                    onChange={(e) => setRicaricaForm(prev => ({ ...prev, costoTotale: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Versato Ora al Desk (€)</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    required
                    value={ricaricaForm.importoPagato}
                    onChange={(e) => setRicaricaForm(prev => ({ ...prev, importoPagato: e.target.value }))}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-950 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Metodo di Pagamento</label>
                <select
                  value={ricaricaForm.metodoPagamento}
                  onChange={(e) => setRicaricaForm(prev => ({ ...prev, metodoPagamento: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                >
                  <option value="Contanti">Contanti</option>
                  <option value="POS / Carta">POS / Carta</option>
                  <option value="Bonifico">Bonifico</option>
                  <option value="Non Pagato (Sospeso)">Non Pagato (Sospeso)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Note Quietanza (opzionale)</label>
                <input
                  type="text"
                  placeholder="es. Acconto pacchetto esami, quietanza genitore..."
                  value={ricaricaForm.note}
                  onChange={(e) => setRicaricaForm(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRicaricaModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Conferma Ricarica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE QUIETANZA STAMPABILE */}
      {selectedQuietanza && (
        <ModaleQuietanza
          isOpen={Boolean(selectedQuietanza)}
          onClose={() => setSelectedQuietanza(null)}
          studente={studente}
          quietanzaData={selectedQuietanza}
        />
      )}

    </div>
  );
}
