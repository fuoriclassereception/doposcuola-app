// File: src/components/ModalePrivacy.jsx
import React, { useState } from 'react';
import { ShieldCheck, Check, Loader2 } from 'lucide-react';
import { db, storage } from '../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import jsPDF from 'jspdf';

export default function ModalePrivacy({ isOpen, utente, figli = [], onAccettato }) {
  const [consensoServizio, setConsensoServizio] = useState(false);
  const [consensoNotificheEmail, setConsensoNotificheEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const generaEArchiviaPdf = async () => {
    const docPdf = new jsPDF();
    const dataOggi = new Date().toLocaleDateString('it-IT');
    const oraOggi = new Date().toLocaleTimeString('it-IT');

    // Header scuro
    docPdf.setFillColor(15, 23, 42); // slate-900
    docPdf.rect(0, 0, 210, 30, 'F');
    docPdf.setTextColor(251, 191, 36); // amber-400
    docPdf.setFontSize(18);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('FuoriClasse - Centro Didattico', 15, 18);
    docPdf.setFontSize(9);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text('Informativa Privacy & Modulo di Consenso (Reg. UE 2016/679 - GDPR)', 15, 25);

    // Sezione 1: Firmatario e Allievi
    docPdf.setTextColor(30, 41, 59);
    docPdf.setFontSize(12);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('1. SOGGETTI INTERESSATI & TITOLARE', 15, 42);

    docPdf.setFontSize(10);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`Esercente responsabilita genitoriale / Firmatario: ${utente?.email || 'Genitore'}`, 15, 50);
    
    const elencoFigliStr = figli.length > 0 
      ? figli.map(f => `${f.nome} ${f.cognome || ''}`).join(', ')
      : 'Allievi del nucleo familiare';
    docPdf.text(`Allievi associati: ${elencoFigliStr}`, 15, 56);
    docPdf.text(`Data e Ora registrazione: ${dataOggi} ore ${oraOggi}`, 15, 62);

    // Sezione 2: Dichiarazioni
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('2. DICHIARAZIONI DI CONSENSO E PRESA VISIONE', 15, 75);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.text(
      'Il sottoscritto dichiara di aver preso visione dell\'informativa ex artt. 13 e 14 del Regolamento UE 2016/679,\n' +
      'consultabile integralmente all\'interno della piattaforma FuoriClasse.',
      15, 82
    );

    // Consenso 1 (Obbligatorio)
    docPdf.setFillColor(241, 245, 249);
    docPdf.rect(15, 95, 180, 22, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('[ X ] TRATTAMENTO DATI CONTRATTUALI E DIDATTICI (OBBLIGATORIO)', 20, 103);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text('Sottoscritto per l\'erogazione delle lezioni, calcolo presenze e gestione del plafond.', 20, 110);

    // Consenso 2 (Promemoria email)
    docPdf.setFillColor(240, 249, 255);
    docPdf.rect(15, 122, 180, 22, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(
      consensoNotificheEmail 
        ? '[ X ] NOTIFICHE DI SERVIZIO E PROMEMORIA LEZIONI VIA EMAIL (ACCONSENTITO)' 
        : '[   ] NOTIFICHE DI SERVIZIO E PROMEMORIA LEZIONI VIA EMAIL (NON ACCONSENTITO)', 
      20, 130
    );
    docPdf.setFont('helvetica', 'normal');
    docPdf.text('Consenso alla ricezione del riepilogo orari mattutino (08:00) e promemoria della Reception.', 20, 137);

    // Sezione 3: Firma Elettronica
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('3. MARCATURA TEMPORALE ELETTRONICA', 15, 158);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`Account autenticato: ${utente?.email || ''}`, 15, 166);
    docPdf.text(`UID univoco: ${utente?.uid || ''}`, 15, 172);
    docPdf.text(`Firma: Convalidata elettronicamente tramite credenziali sicure`, 15, 178);

    docPdf.setFontSize(8);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text('Documento probatorio archiviato nei registri digitali di FuoriClasse.', 15, 275);

    const pdfBase64 = docPdf.output('datauristring');
    const nomeFile = `GDPR_${(utente?.email || 'utente').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

    return { pdfBase64, nomeFile };
  };

  const handleConfermaFirma = async (e) => {
    e.preventDefault();
    if (!consensoServizio) {
      alert("Devi spuntare l'accettazione del trattamento dati per proseguire.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Genera PDF probatorio
      const { pdfBase64, nomeFile } = await generaEArchiviaPdf();

      // 2. Archivia su Firebase Storage
      let downloadUrl = '';
      try {
        const storageRef = ref(storage, `consensi_gdpr/${nomeFile}`);
        await uploadString(storageRef, pdfBase64, 'data_url');
        downloadUrl = await getDownloadURL(storageRef);
      } catch (errStorage) {
        console.warn("Archiviazione storage:", errStorage);
      }

      // 3. Spedisci richiesta di copia su Google Drive
      try {
        await fetch('/api/salva-gdpr-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64,
            nomeFile,
            emailGenitore: utente?.email
          })
        });
      } catch (errDrive) {
        console.warn("Archiviazione drive webhook:", errDrive);
      }

      const datiConsenso = {
        gdprConfermato: true,
        gdprDataFirma: serverTimestamp(),
        gdprEmailFirmatario: utente?.email || '',
        gdprConsensoNotifiche: Boolean(consensoNotificheEmail),
        gdprPdfUrl: downloadUrl,
        emailMattutinaAbilitata: Boolean(consensoNotificheEmail),
        emailAggiornamentiAbilitata: Boolean(consensoNotificheEmail)
      };

      // 4. Salva su impostazioni_genitori
      if (utente?.uid) {
        await updateDoc(doc(db, 'impostazioni_genitori', utente.uid), datiConsenso);
      }

      // 5. Aggiorna in parallelo tutti i figli associati a questa email su Firestore
      for (const f of figli) {
        try {
          await updateDoc(doc(db, 'studenti', f.id), {
            gdprConfermato: true,
            gdprDataFirma: serverTimestamp(),
            gdprEmailFirmatario: utente?.email || '',
            gdprPdfUrl: downloadUrl
          });
        } catch (errFiglio) {
          console.error("Errore aggiornamento studente:", f.nome, errFiglio);
        }
      }

      alert("✅ Consenso Privacy registrato con successo! Benvenuto in FuoriClasse.");
      if (onAccettato) onAccettato();

    } catch (err) {
      console.error("Errore firma GDPR:", err);
      alert("Errore durante la registrazione. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Intestazione */}
        <div className="bg-slate-900 text-white p-5 flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Consenso Privacy & GDPR</h2>
            <p className="text-[11px] text-slate-400">Account Genitore: {utente?.email}</p>
          </div>
        </div>

        {/* Testo Normativo Scorrevole */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-600 space-y-4 border-b border-slate-100 bg-slate-50/50 leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 font-medium">
            Gentile Genitore, prima di accedere alla piattaforma FuoriClasse ti chiediamo di prendere visione dell'informativa ex artt. 13 e 14 del Regolamento UE 2016/679.
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">1. Titolare del Trattamento</h4>
            <p>FuoriClasse - Centro Didattico & Doposcuola. Email di riferimento: <b>fuoriclasse.reception@gmail.com</b>.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">2. Dati Trattati e Finalità</h4>
            <p>I dati forniti (anagrafica allievi, recapiti, orari delle lezioni, presenze e gestione contabile del plafond) sono trattati esclusivamente per l'erogazione dei servizi didattici e amministrativi.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">3. Promemoria e Notifiche Lezioni</h4>
            <p>Previo tuo consenso facoltativo, l'indirizzo email riceverà il riepilogo orario del mattino (ore 08:00) e i promemoria operativi inviati dalla Reception.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">4. Archiviazione & Diritti</h4>
            <p>Alla conferma verrà generato e archiviato a norma di legge un modulo probatorio PDF. Puoi richiedere modifica o cancellazione dei dati in qualunque momento scrivendo alla reception.</p>
          </div>
        </div>

        {/* Checkbox di Firma */}
        <form onSubmit={handleConfermaFirma} className="p-5 bg-white space-y-3 shrink-0">
          
          <label className="flex items-start space-x-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
            <input 
              type="checkbox" 
              required
              className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
              checked={consensoServizio} 
              onChange={e => setConsensoServizio(e.target.checked)} 
            />
            <span className="text-xs text-slate-700 font-bold leading-snug">
              Dichiaro di aver letto l'informativa e acconsento al trattamento dei dati per la gestione didattica e contabile. <b className="text-blue-600">(Obbligatorio)</b>
            </span>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer p-3 bg-sky-50/70 rounded-xl border border-sky-200 hover:bg-sky-100 transition">
            <input 
              type="checkbox" 
              className="w-4 h-4 mt-0.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500" 
              checked={consensoNotificheEmail} 
              onChange={e => setConsensoNotificheEmail(e.target.checked)} 
            />
            <span className="text-xs text-slate-700 font-bold leading-snug">
              Desidero ricevere i promemoria delle lezioni via Email (Riepilogo mattutino ore 08:00 e aggiornamenti Reception). <span className="text-slate-400 font-normal">(Consigliato)</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={!consensoServizio || isSubmitting}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400"/>
                <span>Generazione PDF e Firma in corso...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-amber-400"/>
                <span>Sottoscrivi e Accedi all'App</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
