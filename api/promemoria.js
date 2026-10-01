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

    // 1. Configurazione del mittente con Gmail
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'fuoriclasse.reception@gmail.com',
        pass: 'ssnbbnnfpwhurwbi'
      }
    });

    // 2. Calcolo Data di oggi (formato YYYY-MM-DD fuso orario Roma)
    const formatterData = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const [{ value: g }, , { value: m }, , { value: a }] = formatterData.formatToParts(new Date());
    const dataOggiDb = `${a}-${m}-${g}`;
    const dataVisiva = `${g}/${m}/${a}`;

    // 3. Recupero lezioni attive della giornata odierna
    const lezioniSnap = await getDocs(
      query(collection(db, 'lezioni'), where('data', '==', dataOggiDb), where('stato', '==', 'attiva'))
    );

    if (lezioniSnap.empty) {
      return res.status(200).json({ success: true, message: `Nessuna lezione in programma per oggi (${dataVisiva}).` });
    }

    // 4. Recupero anagrafica impostazioni genitori e studenti
    const impostazioniSnap = await getDocs(collection(db, 'impostazioni_genitori'));
    if (impostazioniSnap.empty) {
      return res.status(200).json({ success: true, message: 'Nessun genitore configurato nel database.' });
    }

    const studentiSnap = await getDocs(collection(db, 'studenti'));
    const studenti = studentiSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tutteLezioni = lezioniSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let inviiEseguiti = 0;

    for (const genitoreDoc of impostazioniSnap.docs) {
      const genitore = genitoreDoc.data();
      const emailDestinatario = genitore.email?.trim().toLowerCase();
      if (!emailDestinatario) continue;

      // Se la chiamata è da Reception, verifica se il genitore accetta gli aggiornamenti
      if (isChiamataReception && genitore.emailAggiornamentiAbilitata === false) {
        continue;
      }

      // Se la chiamata è automatica del mattino, verifica l'opzione mattutina
      if (!isChiamataReception && genitore.emailMattutinaAbilitata === false) {
        continue;
      }

      // Trova gli allievi di questo genitore
      const figli = studenti.filter(s => (s.genitoreEmail || '').trim().toLowerCase() === emailDestinatario);
      const idsFigli = figli.map(f => f.id);
      if (idsFigli.length === 0) continue;

      // Trova le lezioni di oggi per questi allievi
      const lezioniDelGenitore = tutteLezioni.filter(lez =>
        (lez.studentiIds || []).some(id => idsFigli.includes(id))
      );
      if (lezioniDelGenitore.length === 0) continue;

      // FILTRO ANTI-DUPLICATO:
      // Individua solo le lezioni di oggi per cui questo genitore NON ha ancora ricevuto la mail
      const chiaveInviata = `inviataA_${genitoreDoc.id}`;
      const lezioniDaNotificare = lezioniDelGenitore.filter(lez => !lez[chiaveInviata]);

      // Se ha già ricevuto la mail per tutte le lezioni di oggi, salta senza riscrivere
      if (lezioniDaNotificare.length === 0) {
        continue;
      }

      lezioniDaNotificare.sort((x, y) => (x.oraInizio || '').localeCompare(y.oraInizio || ''));

      let blocchiHtml = '';
      lezioniDaNotificare.forEach(lez => {
        const nomi = (lez.studentiIds || [])
          .filter(id => idsFigli.includes(id))
          .map(id => studenti.find(s => s.id === id)?.nome)
          .filter(Boolean)
          .join(', ') || 'Allievo';

        blocchiHtml += `
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; margin-bottom: 12px; border-radius: 8px;">
            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: bold;">${lez.materia || 'Lezione'}</p>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;">👤 Studente: <b>${nomi}</b></p>
            <p style="margin: 4px 0 0 0; color: #d97706; font-size: 13px; font-weight: bold;">⏰ Dalle ${lez.oraInizio} alle ${lez.oraFine}</p>
          </div>
        `;
      });

      const titoloMessaggio = isChiamataReception 
        ? `📚 Aggiornamento Lezioni FuoriClasse - ${dataVisiva}` 
        : `☀️️ Promemoria Lezioni FuoriClasse - ${dataVisiva}`;

      const testoIntro = isChiamataReception
        ? `La nostra segreteria ti trasmette il riepilogo/aggiornamento per le lezioni fissate per oggi (<b>${dataVisiva}</b>):`
        : `Ecco il riepilogo del mattino con le lezioni in programma per la giornata di oggi (<b>${dataVisiva}</b>):`;

      await transporter.sendMail({
        from: '"FuoriClasse Segreteria" <fuoriclasse.reception@gmail.com>',
        to: emailDestinatario,
        subject: titoloMessaggio,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">📚 FuoriClasse</h1>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Gentile Famiglia, 👋</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                ${testoIntro}
              </p>
              <div style="margin: 20px 0;">
                ${blocchiHtml}
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
                Per qualsiasi necessità o chiarimento la nostra Reception è a tua completa disposizione.<br><br>
                A presto,<br>
                <b>La Reception di FuoriClasse</b>
              </p>
            </div>
          </div>
        `
      });

      // Segna sul database che per queste specifiche lezioni la mail è stata spedita a questo genitore
      for (const lez of lezioniDaNotificare) {
        await updateDoc(doc(db, 'lezioni', lez.id), {
          [chiaveInviata]: true
        });
      }

      inviiEseguiti++;
    }

    if (inviiEseguiti === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nessun nuovo promemoria da inviare: tutti i genitori abilitati sono già stati aggiornati per le lezioni di oggi!'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Inviati con successo ${inviiEseguiti} promemoria per la data di oggi (${dataVisiva}).`
    });

  } catch (error) {
    console.error("Errore invio promemoria:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
