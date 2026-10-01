// File: api/promemoria.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import nodemailer from 'nodemailer';

const firebaseConfig = {
  apiKey: "AIzaSyBvdt-SI07jgrKz7ebw8AD0Sqj-stf5cls",
  authDomain: "fuoriclasse-app-4dfb9.firebaseapp.com",
  projectId: "fuoriclasse-app-4dfb9",
  storageBucket: "fuoriclasse-app-4dfb9.firebasestorage.app",
  messagingSenderId: "22858064784",
  appId: "1:22858064784:web:98b33584447c8a0466c915",
  measurementId: "G-EC3NNQ9FG1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  try {
    const isChiamataReception = req.method === 'POST' && req.body?.tipo === 'manuale_reception';

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'fuoriclasse.reception@gmail.com',
        pass: 'ssnbbnnfpwhurwbi'
      }
    });

    // Calcolo Data di oggi fuso orario Roma
    const formatterData = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const [{ value: g }, , { value: m }, , { value: a }] = formatterData.formatToParts(new Date());
    const dataOggiDb = `${a}-${m}-${g}`;
    const dataVisiva = `${g}/${m}/${a}`;

    // Lezioni di oggi
    const lezioniSnap = await getDocs(
      query(collection(db, 'lezioni'), where('data', '==', dataOggiDb), where('stato', '==', 'attiva'))
    );

    if (lezioniSnap.empty) {
      return res.status(200).json({ success: true, message: `Nessuna lezione in programma per oggi (${dataVisiva}).` });
    }

    const impostazioniSnap = await getDocs(collection(db, 'impostazioni_genitori'));
    const studentiSnap = await getDocs(collection(db, 'studenti'));

    const studenti = studentiSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tutteLezioni = lezioniSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let inviiEseguiti = 0;

    // --- 1. GESTIONE INVIO A GENITORI ---
    for (const genitoreDoc of impostazioniSnap.docs) {
      const genitore = genitoreDoc.data();
      const emailGenitore = genitore.email?.trim().toLowerCase();
      if (!emailGenitore) continue;

      if (isChiamataReception && genitore.emailAggiornamentiAbilitata === false) continue;
      if (!isChiamataReception && genitore.emailMattutinaAbilitata === false) continue;

      // Trova figli associati
      const figli = studenti.filter(s => (s.genitoreEmail || '').trim().toLowerCase() === emailGenitore);
      
      // VINCOLO GDPR: Includi solo i figli che hanno firmato il GDPR
      const figliConGdpr = figli.filter(s => Boolean(s.gdprConfermato));
      const idsFigliConGdpr = figliConGdpr.map(f => f.id);
      if (idsFigliConGdpr.length === 0) continue;

      const lezioniDelGenitore = tutteLezioni.filter(lez =>
        (lez.studentiIds || []).some(id => idsFigliConGdpr.includes(id))
      );
      if (lezioniDelGenitore.length === 0) continue;

      // Anti-duplicato
      const chiaveInviata = `inviataA_${genitoreDoc.id}`;
      const lezioniDaNotificare = lezioniDelGenitore.filter(lez => !lez[chiaveInviata]);
      if (lezioniDaNotificare.length === 0) continue;

      lezioniDaNotificare.sort((x, y) => (x.oraInizio || '').localeCompare(y.oraInizio || ''));

      let blocchiHtml = '';
      lezioniDaNotificare.forEach(lez => {
        const nomi = (lez.studentiIds || [])
          .filter(id => idsFigliConGdpr.includes(id))
          .map(id => studenti.find(s => s.id === id)?.nome)
          .filter(Boolean)
          .join(', ') || 'Allievo';

        const materiaDefinita = (lez.materia || '').trim() || 'Ripasso';

        blocchiHtml += `
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; margin-bottom: 12px; border-radius: 8px;">
            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: bold;">${materiaDefinita}</p>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;">👤 Studente: <b>${nomi}</b></p>
            <p style="margin: 4px 0 0 0; color: #d97706; font-size: 13px; font-weight: bold;">⏰ Dalle ${lez.oraInizio} alle ${lez.oraFine}</p>
          </div>
        `;
      });

      const titolo = isChiamataReception 
        ? `📚 Aggiornamento Lezioni FuoriClasse - ${dataVisiva}` 
        : `☀️ Promemoria Lezioni FuoriClasse - ${dataVisiva}`;

      await transporter.sendMail({
        from: '"FuoriClasse Segreteria" <fuoriclasse.reception@gmail.com>',
        to: emailGenitore,
        subject: titolo,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">📚 FuoriClasse</h1>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Gentile Famiglia, 👋</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                Ecco il riepilogo delle lezioni previste per oggi (<b>${dataVisiva}</b>):
              </p>
              <div style="margin: 20px 0;">${blocchiHtml}</div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
                A presto,<br><b>La Segreteria di FuoriClasse</b>
              </p>
            </div>
          </div>
        `
      });

      for (const lez of lezioniDaNotificare) {
        await updateDoc(doc(db, 'lezioni', lez.id), { [chiaveInviata]: true });
      }
      inviiEseguiti++;
    }

    // --- 2. GESTIONE INVIO DIRETTO AGLI STUDENTI CON PROPRIA EMAIL ---
    for (const std of studenti) {
      const emailStudente = std.email?.trim().toLowerCase();
      // Solo se lo studente ha una mail personale distinta da quella del genitore ed ha il GDPR firmato
      if (!emailStudente || emailStudente === std.genitoreEmail?.trim().toLowerCase() || !std.gdprConfermato) {
        continue;
      }

      // Se lo studente ha espressamente disattivato le email, salta
      if (std.emailAbilitate === false) continue;

      const lezioniDelloStudente = tutteLezioni.filter(lez =>
        (lez.studentiIds || []).includes(std.id)
      );
      if (lezioniDelloStudente.length === 0) continue;

      const chiaveInviataStd = `inviataA_std_${std.id}`;
      const lezioniDaNotificareStd = lezioniDelloStudente.filter(lez => !lez[chiaveInviataStd]);
      if (lezioniDaNotificareStd.length === 0) continue;

      lezioniDaNotificareStd.sort((x, y) => (x.oraInizio || '').localeCompare(y.oraInizio || ''));

      let blocchiHtml = '';
      lezioniDaNotificareStd.forEach(lez => {
        const materiaDefinita = (lez.materia || '').trim() || 'Ripasso';
        blocchiHtml += `
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; margin-bottom: 12px; border-radius: 8px;">
            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: bold;">${materiaDefinita}</p>
            <p style="margin: 4px 0 0 0; color: #d97706; font-size: 13px; font-weight: bold;">⏰ Dalle ${lez.oraInizio} alle ${lez.oraFine}</p>
          </div>
        `;
      });

      await transporter.sendMail({
        from: '"FuoriClasse Didattica" <fuoriclasse.reception@gmail.com>',
        to: emailStudente,
        subject: `📚 Le tue lezioni di oggi a FuoriClasse - ${dataVisiva}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center;">
              <h1 style="color: #fbbf24; margin: 0; font-size: 22px;">📚 FuoriClasse</h1>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Ciao ${std.nome}! 👋</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                Ecco il promemoria con il tuo orario di oggi (<b>${dataVisiva}</b>):
              </p>
              <div style="margin: 20px 0;">${blocchiHtml}</div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
                Ti aspettiamo a lezione!
              </p>
            </div>
          </div>
        `
      });

      for (const lez of lezioniDaNotificareStd) {
        await updateDoc(doc(db, 'lezioni', lez.id), { [chiaveInviataStd]: true });
      }
      inviiEseguiti++;
    }

    return res.status(200).json({
      success: true,
      message: inviiEseguiti > 0 
        ? `Inviate con successo ${inviiEseguiti} email di riepilogo (Genitori + Studenti con GDPR firmato).`
        : 'Tutti i destinatari abilitati (con GDPR firmato) hanno già ricevuto gli aggiornamenti di oggi.'
    });

  } catch (error) {
    console.error("Errore invio promemoria:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
