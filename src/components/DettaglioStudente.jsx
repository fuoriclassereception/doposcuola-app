import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, CreditCard, Clock, FileText, CheckCircle, AlertCircle, Edit2, X, PlusCircle, History, Printer } from 'lucide-react';

export default function DettaglioStudente({ 
  studente, 
  lezioni = [], 
  onClose, 
  onUpdateLezioneCompleta, 
  onUpdateLezioneStatus,
  onRicaricaPacchetto,
  aggiungiLog
}) {
  if (!studente) return null;

  const [editingLezioneId, setEditingLezioneId] = useState(null);
  const [editFormData, setEditFormData] = useState({ oraInizio: '', oraFine: '', data: '' });

  const [showRicarica, setShowRicarica] = useState(false);
  const [ricaricaData, setRicaricaData] = useState({
    costoDaAggiungere: '',
    pagatoDaAggiungere: '',
    metodoPagamento: 'Contanti',
    tariffaApplicata: studente.haTariffaRiservata ? studente.tariffaRiservataValore : (studente.categoriaTariffaria === 'elementari' ? 18 : studente.categoriaTariffaria === 'superiori' ? 26 : 22),
    note: ''
  });

  const lezioniStudente = lezioni.filter(l => l && (l.studentiIds || []).includes(studente.id));
  const lezioniFuture = lezioniStudente.filter(l => l.stato === 'attiva' || l.stato === 'richiesta');
  
  lezioniFuture.sort((a, b) => a.data.localeCompare(b.data) || (a.oraInizio || '').localeCompare(b.oraInizio || ''));

  const handleStartEdit = (lez) => {
    setEditingLezioneId(lez.id);
    setEditFormData({ oraInizio: lez.oraInizio, oraFine: lez.oraFine, data: lez.data });
  };

  const handleSaveEdit = async () => {
    if (onUpdateLezioneCompleta) {
      await onUpdateLezioneCompleta({
        lezioneId: editingLezioneId,
        oraInizio: editFormData.oraInizio,
        oraFine: editFormData.oraFine,
        data: editFormData.data
      });
      if (aggiungiLog) aggiungiLog(`Modificata lezione studente ${studente.nome}: Spostata al ${editFormData.data} ore ${editFormData.oraInizio}`);
    }
    setEditingLezioneId(null);
  };

  const handleRicaricaSubmit = async (e) => {
    e.preventDefault();
    if (onRicaricaPacchetto) {
      await onRicaricaPacchetto(studente.id, ricaricaData);
    }
    setShowRicarica(false);
    setRicaricaData({
      costoDaAggiungere: '', pagatoDaAggiungere: '', metodoPagamento: 'Contanti',
      tariffaApplicata: ricaricaData.tariffaApplicata, note: ''
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start pt-10 pb-10 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col border border-slate-200">
        
        {/* Header Anagrafica */}
        <div className="bg-slate-900 text-white p-6 rounded-t-3xl flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-400 text-slate-900 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
              {studente.nome?.charAt(0)}{studente.cognome?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3">
                {studente.nome} {studente.cognome}
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${studente.attivo !== false ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {studente.attivo !== false ? 'Attivo' : 'Inattivo'}
                </span>
              </h2>
              <div className="flex gap-4 mt-2 text-slate-400 text-xs font-medium">
                <span>{studente.categoriaTariffaria || 'medie'}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                  Tariffa Base: {studente.haTariffaRiservata ? studente.tariffaRiservataValore : (studente.categoriaTariffaria === 'elementari' ? 18 : studente.categoriaTariffaria === 'superiori' ? 26 : 22)}.00 €/h
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors"><X className="w-6 h-6"/></button>
        </div>

        {/* Corpo Scrollabile */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Sezione Lezioni Programmate */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500"/>
              Lezioni Programmate ({lezioniFuture.length})
            </h3>
            
            <div className="space-y-3">
              {lezioniFuture.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nessuna lezione futura in programma.</p>
              ) : (
                lezioniFuture.map(lez => (
                  <div key={lez.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-slate-800">{lez.materia || 'Lezione'}</span>
                        <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">{lez.stato}</span>
                      </div>
                      
                      {editingLezioneId === lez.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="date" 
                            className="text-xs font-bold bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-amber-400"
                            value={editFormData.data}
                            onChange={(e) => setEditFormData({...editFormData, data: e.target.value})}
                          />
                          <input 
                            type="time" 
                            className="text-xs font-bold bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-amber-400"
                            value={editFormData.oraInizio}
                            onChange={(e) => setEditFormData({...editFormData, oraInizio: e.target.value})}
                          />
                          <span className="text-slate-400">-</span>
                          <input 
                            type="time" 
                            className="text-xs font-bold bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-amber-400"
                            value={editFormData.oraFine}
                            onChange={(e) => setEditFormData({...editFormData, oraFine: e.target.value})}
                          />
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400"/> {lez.data}
                          <Clock className="w-3.5 h-3.5 text-slate-400 ml-2"/> {lez.oraInizio} - {lez.oraFine}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {editingLezioneId === lez.id ? (
                        <>
                          <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"><CheckCircle className="w-3.5 h-3.5"/> Salva</button>
                          <button onClick={() => setEditingLezioneId(null)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50">Annulla</button>
                        </>
                      ) : (
                        <button onClick={() => handleStartEdit(lez)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors">
                          <Edit2 className="w-3.5 h-3.5"/> Modifica Orario/Data
                        </button>
                        /* RIMOSSO IL TASTO "ANNULLA" RAPIDO. L'ANNULLAMENTO SI FA DAL CALENDARIO PRINCIPALE */
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dati Contatto & Genitore */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Recapiti Allievo</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-bold flex items-center gap-2"><Phone className="w-4 h-4"/> Telefono:</span>
                  <span className="font-black text-slate-800">{studente.telefono || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-bold flex items-center gap-2"><Mail className="w-4 h-4"/> Email:</span>
                  <span className="font-black text-slate-800">{studente.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Data di Nascita:</span>
                  <span className="font-black text-slate-800">{studente.dataNascita || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4"/> Intestatario Pagamento (Genitore)
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-bold">Nome:</span>
                  <span className="font-black text-slate-800">{studente.genitoreNome || 'Non specificato'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-bold">Email App:</span>
                  <span className="font-black text-blue-600">{studente.genitoreEmail || 'Non specificato'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-2"><Phone className="w-4 h-4"/> Telefono:</span>
                  <span className="font-black text-slate-800">{studente.genitoreTelefono || 'Non specificato'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PLAFOND E CASSA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500"/> Plafond Didattico & Credito
                </h3>
              </div>
              <button onClick={() => setShowRicarica(!showRicarica)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-colors flex items-center gap-2">
                <PlusCircle className="w-4 h-4"/> + Ricarica Plafond
              </button>
            </div>

            {showRicarica && (
              <form onSubmit={handleRicaricaSubmit} className="mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-800 uppercase mb-4">Nuova Ricarica</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Costo Totale (€)</label>
                    <input type="number" step="0.01" required className="w-full p-2 text-sm font-bold border border-slate-300 rounded-lg" value={ricaricaData.costoDaAggiungere} onChange={e => setRicaricaData({...ricaricaData, costoDaAggiungere: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Importo Pagato (€)</label>
                    <input type="number" step="0.01" required className="w-full p-2 text-sm font-bold border border-slate-300 rounded-lg" value={ricaricaData.pagatoDaAggiungere} onChange={e => setRicaricaData({...ricaricaData, pagatoDaAggiungere: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Metodo</label>
                    <select className="w-full p-2 text-sm font-bold border border-slate-300 rounded-lg" value={ricaricaData.metodoPagamento} onChange={e => setRicaricaData({...ricaricaData, metodoPagamento: e.target.value})}>
                      <option>Contanti</option><option>Bonifico</option><option>POS</option><option>Assegno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tariffa Applicata (€/h)</label>
                    <input type="number" step="0.5" required className="w-full p-2 text-sm font-bold border border-slate-300 rounded-lg" value={ricaricaData.tariffaApplicata} onChange={e => setRicaricaData({...ricaricaData, tariffaApplicata: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <input type="text" className="flex-1 p-2 text-sm border border-slate-300 rounded-lg" placeholder="Note (opzionale)" value={ricaricaData.note} onChange={e => setRicaricaData({...ricaricaData, note: e.target.value})}/>
                  <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800">Conferma Ricarica</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border ${((studente.totaleVersato || 0) - (studente.totaleConsumato || 0)) < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Credito Residuo</p>
                <p className={`text-3xl font-black ${((studente.totaleVersato || 0) - (studente.totaleConsumato || 0)) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {((studente.totaleVersato || 0) - (studente.totaleConsumato || 0)).toFixed(2)} €
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Totale Versato</p>
                <p className="text-xl font-black text-slate-800">{(studente.totaleVersato || 0).toFixed(2)} €</p>
              </div>
              <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Totale Consumato</p>
                <p className="text-xl font-black text-slate-800">{(studente.totaleConsumato || 0).toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-white rounded-b-3xl flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-colors shadow-lg">Chiudi Scheda</button>
        </div>
      </div>
    </div>
  );
}
