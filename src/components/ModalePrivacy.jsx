import React, { useState } from 'react';
import { ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function ModalePrivacy({ isOpen, utente, studenteId, onAccettato }) {
  const [consensoServizio, setConsensoServizio] = useState(false);
  const [consensoNotificheEmail, setConsensoNotificheEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfermaFirma = async (e) => {
    e.preventDefault();
    if (!consensoServizio) {
      alert("È necessario prendere visione e accettare il trattamento dei dati contrattuali per utilizzare l'applicazione.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadConsenso = {
        gdprConfermato: true,
        gdprDataFirma: serverTimestamp(),
        gdprEmailFirmatario: utente?.email || '',
        gdprVersione: 'v1.0_2026',
        gdprConsensoNotifiche: Boolean(consensoNotificheEmail)
      };

      // Se firmiamo per un singolo studente
      if (studenteId) {
        await updateDoc(doc(db, 'studenti', studenteId), payloadConsenso);
      }

      // Salviamo anche nelle impostazioni generali dell'account
      if (utente?.uid) {
        await updateDoc(doc(db, 'impostazioni_genitori', utente.uid), {
          ...payloadConsenso,
          emailMattutinaAbilitata: Boolean(consensoNotificheEmail),
          emailAggiornamentiAbilitata: Boolean(consensoNotificheEmail)
        });
      }

      alert("✅ Consenso GDPR registrato con successo a norma di legge.");
      if (onAccettato) onAccettato();
    } catch (err) {
      console.error("Errore salvataggio consenso GDPR:", err);
      alert("Errore durante la registrazione del consenso. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Intestazione */}
        <div className="bg-slate-900 text-white p-5 flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Informativa & Consenso Privacy</h2>
            <p className="text-[11px] text-slate-400">Regolamento Generale UE 2016/679 (GDPR)</p>
          </div>
        </div>

        {/* Testo Informativa con Scroll */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-600 space-y-4 border-b border-slate-100 bg-slate-50/50 leading-relaxed select-text">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 font-medium">
            Gentile Utente, prima di accedere alle funzionalità dell'App FuoriClasse ti invitiamo a leggere e sottoscrivere la presente informativa per la tutela dei tuoi dati e di quelli degli allievi.
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">1. Titolare del Trattamento</h4>
            <p>FuoriClasse - Centro Didattico & Doposcuola. Email di contatto: <b>fuoriclasse.reception@gmail.com</b>.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">2. Dati Trattati e Finalità</h4>
            <p>I dati raccolti (anagrafici, recapiti telefonici ed email, materie di studio, orari delle lezioni e saldo economico del plafond) sono trattati per finalità strettamente connesse all'erogazione del servizio educativo, pianificazione delle lezioni e gestione contabile.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">3. Comunicazioni via Email e Promemoria</h4>
            <p>Previo tuo specifico consenso facoltativo, l'indirizzo email fornito potrà essere utilizzato per trasmettere il riepilogo orario del mattino e i promemoria delle lezioni da parte della segreteria.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">4. Diritti dell'Interessato</h4>
            <p>In qualunque momento potrai richiedere l'accesso, la rettifica, la cancellazione dei dati o la revoca dei consensi scrivendo alla Reception.</p>
          </div>
        </div>

        {/* Box di Consenso Granulare */}
        <form onSubmit={handleConfermaFirma} className="p-5 bg-white space-y-3 shrink-0">
          
          {/* Consenso 1: Obbligatorio Servizio */}
          <label className="flex items-start space-x-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition">
            <input 
              type="checkbox" 
              required
              className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
              checked={consensoServizio} 
              onChange={e => setConsensoServizio(e.target.checked)} 
            />
            <span className="text-xs text-slate-700 font-bold leading-snug">
              Dichiaro di aver letto l'informativa e acconsento al trattamento dei dati per la gestione didattica e contabile delle lezioni. <b className="text-blue-600">(Obbligatorio)</b>
            </span>
          </label>

          {/* Consenso 2: Facoltativo Notifiche Email */}
          <label className="flex items-start space-x-3 cursor-pointer p-3 bg-sky-50/60 rounded-xl border border-sky-200 hover:bg-sky-100/60 transition">
            <input 
              type="checkbox" 
              className="w-4 h-4 mt-0.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500" 
              checked={consensoNotificheEmail} 
              onChange={e => setConsensoNotificheEmail(e.target.checked)} 
            />
            <span className="text-xs text-slate-700 font-bold leading-snug">
              Acconsento all'invio di promemoria e aggiornamenti delle lezioni via Email (Mattinale ore 08:00 e aggiornamenti Reception). <span className="text-slate-400 font-normal">(Facoltativo)</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={!consensoServizio || isSubmitting}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4 text-amber-400"/>
            <span>{isSubmitting ? 'Registrazione in corso...' : 'Sottoscrivi e Accedi all\'App'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}
