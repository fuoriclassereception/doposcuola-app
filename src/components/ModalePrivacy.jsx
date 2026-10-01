// File: src/components/ModalePrivacy.jsx
import React, { useState } from 'react';
import { ShieldCheck, Check, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { db, storage } from '../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import jsPDF from 'jspdf';

export default function ModalePrivacy({ isOpen, utente, studente, onAccettato }) {
  const [consensoServizio, setConsensoServizio] = useState(false);
  const [consensoNotificheEmail, setConsensoNotificheEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !studente) return null;

  const generaEArchiviaPdf = async () => {
    const docPdf = new jsPDF();
    const dataOggi = new Date().toLocaleDateString('it-IT');
    const oraOggi = new Date().toLocaleTimeString('it-IT');

    // Intestazione
    docPdf.setFillColor(15, 23, 42); // slate-900
    docPdf.rect(0, 0, 210, 30, 'F');
    docPdf.setTextColor(251, 191, 36); // amber-400
    docPdf.setFontSize(18);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('FuoriClasse - Gestione Didattica', 15, 18);
    docPdf.setFontSize(9);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text('Informativa Privacy & Modulo di Consenso (Reg. UE 2016/679 - GDPR)', 15, 25);

    // Dati Partecipanti
    docPdf.setTextColor(30, 41, 59);
    docPdf.setFontSize(12);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('1. SOGGETTI INTERESSATI', 15, 42);

    docPdf.setFontSize(10);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`Studente: ${studente.nome} ${studente.cognome || ''}`, 15, 50);
    docPdf.text(`Scuola: ${studente.scuola || 'Non specificata'}`, 15, 56);
    docPdf.text(`Esercente potestà genitoriale / Firmatario: ${studente.genitoreNome || utente?.email || 'Genitore'}`, 15, 62);
    docPdf.text(`Email Registrata: ${utente?.email || studente.genitoreEmail || ''}`, 15, 68);

    // Sintesi Trattamento
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('2. DICHIARAZIONI DI CONSENSO E PRESA VISIONE', 15, 80);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.text(
      'Il sottoscritto dichiara di aver preso visione dell\'informativa sul trattamento dei dati personali fornita da FuoriClasse\n' +
      'ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679 (GDPR), consultabile integralmente all\'interno della Web App.',
      15, 87
    );

    // Box Consenso 1
    docPdf.setFillColor(241, 245, 249);
    docPdf.rect(15, 102, 180, 22, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('[ X ] TRATTAMENTO DATI CONTRATTUALI E DIDATTICI (OBBLIGATORIO)', 20, 110);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text('Accettato e sottoscritto per la corretta erogazione delle lezioni, calcolo presenze e gestione economica.', 20, 117);

    // Box Consenso 2
    docPdf.setFillColor(240, 249, 255);
    docPdf.rect(15, 130, 180, 22, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(
      consensoNotificheEmail 
        ? '[ X ] NOTIFICHE DI SERVIZIO E PROMEMORIA LEZIONI VIA EMAIL (FACOLTATIVO)' 
        : '[   ] NOTIFICHE DI SERVIZIO E PROMEMORIA LEZIONI VIA EMAIL (NON ACCONSENTITO)', 
      20, 138
    );
    docPdf.setFont('helvetica', 'normal');
    docPdf.text('Consenso alla ricezione del riepilogo orari mattutino (08:00) e dei promemoria della segreteria.', 20, 145);

    // Firma Digitale e Timestamp
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('3. FIRMA E MARCATURA TEMPORALE ELETTRONICA', 15, 165);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`Data e Ora di sottoscrizione: ${dataOggi} ore ${oraOggi}`, 15, 173);
    docPdf.text(`Identificativo Account: ${utente?.uid || 'N/A'}`, 15, 179);
    docPdf.text(`Firma Digitale: Sottoscritto elettronicamente da ${utente?.email || 'Utente'}`, 15, 185);

    // Footer
    docPdf.setFontSize(8);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text('Documento archiviato a norma di legge nel fascicolo digitale di FuoriClasse Centro Didattico.', 15, 280);

    const pdfBase64 = docPdf.output('datauristring');
    const nomeFile = `GDPR_${studente.cognome || 'Studente'}_${studente.nome}_${Date.now()}.pdf`;

    return { pdfBase64, nomeFile };
  };

  const handleConfermaFirma = async (e) => {
    e.preventDefault();
    if (!consensoServizio) {
      alert("È necessario accettare il trattamento dei dati contrattuali per poter utilizzare il servizio didattico.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Genera il PDF
      const { pdfBase64, nomeFile } = await generaEArchiviaPdf();

      // 2. Salva una copia immediata su Firebase Storage (garanzia di sicurezza 100%)
      const storageRef = ref(storage, `consensi_gdpr/${nomeFile}`);
      await uploadString(storageRef, pdfBase64, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      // 3. Invia la richiesta per depositare il file su Google Drive nella cartella 02_Consensi_GDPR
      try {
        await fetch('/api/salva-gdpr-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64,
            nomeFile,
            studenteNome: studente.nome,
            studenteCognome: studente.cognome
          })
        });
      } catch (errDrive) {
        console.warn("Drive webhook non configurato, file salvato su Storage:", errDrive);
      }

      // 4. Aggiorna Firestore
      const datiFirma = {
        gdprConfermato: true,
        gdprDataFirma: serverTimestamp(),
        gdprEmailFirmatario: utente?.email || '',
        gdprConsensoNotifiche: Boolean(consensoNotificheEmail),
        gdprPdfUrl: downloadUrl,
        gdprPdfNome: nomeFile
      };

      await updateDoc(doc(db, 'studenti', studente.id), datiFirma);

      if (utente?.uid) {
        await updateDoc(doc(db, 'impostazioni_genitori', utente.uid), {
          gdprConfermato: true,
          emailMattutinaAbilitata: Boolean(consensoNotificheEmail),
          emailAggiornamentiAbilitata: Boolean(consensoNotificheEmail)
        });
      }

      alert(`✅ Consenso GDPR firmato con successo per ${studente.nome}!`);
      if (onAccettato) onAccettato();

    } catch (err) {
      console.error("Errore durante la firma del GDPR:", err);
      alert("Si è verificato un errore durante la registrazione. Riprova.");
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
            <p className="text-[11px] text-slate-400">Modulo per {studente.nome} {studente.cognome || ''}</p>
          </div>
        </div>

        {/* Testo Normativo Scorrevole */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-600 space-y-4 border-b border-slate-100 bg-slate-50/50 leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 font-medium">
            Prima di accedere alla piattaforma didattica per <b>{studente.nome}</b>, ti preghiamo di sottoscrivere la presente informativa ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679.
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">1. Titolare del Trattamento</h4>
            <p>FuoriClasse - Centro Didattico. Email: <b>fuoriclasse.reception@gmail.com</b>.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">2. Finalità e Trattamento</h4>
            <p>I dati forniti (anagrafica, scuola, orari lezioni, plafond ore e note didattiche) sono trattati unicamente per la corretta erogazione delle lezioni e la gestione amministrativa.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">3. Promemoria e Aggiornamenti via Email</h4>
            <p>Previo tuo consenso facoltativo, l'indirizzo email registrato riceverà il riepilogo giornaliero delle lezioni (ore 08:00) e i promemoria operativi inviati dalla segreteria prima dell'inizio delle attività.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1">4. Archiviazione Documentale</h4>
            <p>Al termine della procedura verrà generato un documento PDF probatorio con marcatura temporale, conservato negli archivi protetti di FuoriClasse a tua disposizione.</p>
          </div>
        </div>

        {/* Selezione Consensi Granulari */}
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
              Dichiaro di aver preso visione dell'informativa e acconsento al trattamento dei dati per la gestione didattica. <b className="text-blue-600">(Obbligatorio)</b>
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
                <span>Generazione PDF e Archiviazione...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-amber-400"/>
                <span>Sottoscrivi e Genera Modulo PDF</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
