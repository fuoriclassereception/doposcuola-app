import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';

export default function ModaleQuietanza({ isOpen, onClose, studente, quietanzaData }) {
  if (!isOpen || !studente || !quietanzaData) return null;

  const handlePrint = () => {
    window.print();
  };

  const dataRicevuta = quietanzaData.data || new Date().toLocaleDateString('it-IT');
  const numeroQuietanza = quietanzaData.numero || `${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Barra superiore comandi (nascosta in stampa) */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm">Quietanza di Pagamento / Proforma</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / Salva PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-full text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FOGLIO QUIETANZA (Stampabile in A4) */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white" id="quietanza-print-area">
          
          {/* Intestazione Centro */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-5">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">FuoriClasse</h1>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">Centro Studi & Doposcuola Specialistico</p>
              <p className="text-[11px] text-gray-400 mt-1">Servizi Didattici ed Educativi Personalizzati</p>
            </div>
            <div className="text-right text-xs space-y-0.5 text-gray-600">
              <div className="font-black text-slate-900 text-sm">PROFORMA / QUIETANZA</div>
              <div>N. Documento: <strong className="text-slate-900">{numeroQuietanza}</strong></div>
              <div>Data: <strong className="text-slate-900">{dataRicevuta}</strong></div>
            </div>
          </div>

          {/* Dati Intestazione Fiscale Genitore & Allievo */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Intestatario Pagamento (Genitore/Tutore)</span>
              <div className="font-black text-slate-900 text-sm">{studente.genitoreNome || 'Genitore / Tutore Legale'}</div>
              <div className="text-gray-600 mt-0.5">C.F.: <strong className="text-slate-900">{studente.genitoreCodiceFiscale || 'Non specificato'}</strong></div>
              {studente.genitoreTelefono && <div className="text-gray-500">Tel: {studente.genitoreTelefono}</div>}
              {studente.genitoreEmail && <div className="text-gray-500">Email: {studente.genitoreEmail}</div>}
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Allievo Beneficiario del Servizio</span>
              <div className="font-black text-slate-900 text-sm">{studente.nome} {studente.cognome}</div>
              <div className="text-gray-600 mt-0.5">Scuola: {studente.scuola || 'Non indicata'}</div>
              <div className="text-gray-600">
                Inquadramento: <strong className="text-slate-800">{studente.haTariffaRiservata ? 'Tariffa Riservata' : (studente.categoriaTariffaria || 'Standard')}</strong>
              </div>
            </div>
          </div>

          {/* Tabella Dettaglio Economico */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-black">
                <tr>
                  <th className="p-3">Descrizione Prestazione Didattica</th>
                  <th className="p-3 text-center">Tariffa Oraria</th>
                  <th className="p-3 text-right">Importo Versato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
                <tr>
                  <td className="p-3">
                    <div className="font-black text-slate-900">Ricarica Plafond / Credito Didattico</div>
                    <div className="text-[11px] text-gray-500">
                      Fondo ore utilizzabile per lezioni individuali o in gruppo studio
                      {quietanzaData.note ? ` • Note: ${quietanzaData.note}` : ''}
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold">
                    {quietanzaData.tariffaApplicata ? `${Number(quietanzaData.tariffaApplicata).toFixed(2)} €/h` : 'Listino Base'}
                  </td>
                  <td className="p-3 text-right font-black text-sm text-slate-900">
                    {Number(quietanzaData.pagato || 0).toFixed(2)} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Riepilogo Saldo & Modalità di Pagamento */}
          <div className="flex justify-between items-start pt-2 text-xs">
            <div className="space-y-1">
              <div>Modalità di Pagamento: <strong className="text-slate-900">{quietanzaData.metodo || 'Contanti'}</strong></div>
              <div>Operatore Desk: <strong className="text-slate-900">Reception FuoriClasse</strong></div>
              {quietanzaData.costoTotale && (
                <div className="text-gray-500 text-[11px]">
                  Totale concordato pacchetto: {Number(quietanzaData.costoTotale).toFixed(2)} €
                </div>
              )}
            </div>

            <div className="text-right space-y-1">
              <div className="text-gray-500">Totale Ricevuto a Saldo:</div>
              <div className="text-2xl font-black text-emerald-600">
                {Number(quietanzaData.pagato || 0).toFixed(2)} €
              </div>
            </div>
          </div>

          {/* Dicitura Normativa P.IVA */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-[10px] text-gray-500 leading-relaxed">
            <p className="font-bold text-gray-700">Nota Fiscale & Informativa:</p>
            <p>
              Il presente documento costituisce quietanza contabile interna a comprova del pagamento ricevuto per i servizi didattici sopra indicati. 
              Seguirà l'emissione del documento commerciale / fattura elettronica nei termini previsti dalla legislazione fiscale vigente.
            </p>
          </div>

          {/* Firme per quietanza */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200 text-center text-xs">
            <div>
              <div className="text-[11px] text-gray-500 mb-8">Firma Genitore / Versante</div>
              <div className="border-b border-gray-300 mx-4" />
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-8">Per Ricevuta (FuoriClasse Reception)</div>
              <div className="border-b border-gray-300 mx-4" />
            </div>
          </div>

        </div>

        {/* Footer modale */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end print:hidden">
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
