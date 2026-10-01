// File: api/promemoria.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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

    // 2. Data di oggi in formato YYYY-MM-DD (fuso orario italiano)
    const formatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [{ value: g }, , { value: m }, , { value: a }] = formatter.formatToParts(new Date());
    const dataOggiDb = `${a}-${m}-${g}`;
    const dataVisiva = `${g}/${m}/${a}`;

    // 3. Recupero lezioni attive della giornata
    const lezioniSnap = await getDocs(
      query(collection(db, 'lezioni'), where('data', '==', dataOggiDb), where('stato', '==', 'attiva'))
    );

    if (lezioniSnap.empty) {
      return res.status(200).json({ success: true, message: `Nessuna lezione attiva trovata per oggi (${dataVisiva}).` });
    }

    // 4. Recupero preferenze genitori e anagrafica allievi
    const impostazioniSnap = await getDocs(
      query(collection(db, 'impostazioni_genitori'), where('emailAbilitate', '==', true))
    );

    if (impostazioniSnap.empty) {
      return res.status(200).json({ success: true, message: 'Nessun genitore ha attivato la spunta email.' });
    }

    const studentiSnap = await getDocs(collection(db, 'studenti'));

    const lezioniOggi = lezioniSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const genitoriAbilitati = impostazioniSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const studenti = studentiSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let emailInviate = 0;

    // 5. Ciclo sui genitori con notifiche abilitate
    for (const genitore of genitoriAbilitati) {
      const emailDestinatario = genitore.email?.trim().toLowerCase();
      if (!emailDestinatario) continue;

      // Trova gli studenti collegati alla mail di questo genitore
      const figli = studenti.filter(s => (s.genitoreEmail || '').trim().toLowerCase() === emailDestinatario);
      const idsFigli = figli.map(f => f.id);

      // Trova le lezioni di oggi in cui è presente almeno un figlio
      const lezioniDelGenitore = lezioniOggi.filter(lez =>
        (lez.studentiIds || []).some(id => idsFigli.includes(id))
      );

      if (lezioniDelGenitore.length > 0) {
        lezioniDelGenitore.sort((a, b) => (a.oraInizio || '').localeCompare(b.oraInizio || ''));

        let lezioniHtml = '';
        lezioniDelGenitore.forEach(lez => {
          const nomiAllievi = (lez.studentiIds || [])
            .filter(id => idsFigli.includes(id))
            .map(id => studenti.find(s => s.id === id)?.nome)
            .filter(Boolean)
            .join(', ') || 'Allievo';

          lezioniHtml += `
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; margin-bottom: 12px; border-radius: 8px;">
              <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: bold;">${lez.materia || 'Lezione'}</p>
              <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;">👤 Studente: <b>${nomiAllievi}</b></p>
              <p style="margin: 4px 0 0 0; color: #d97706; font-size: 13px; font-weight: bold;">⏰ Dalle ${lez.oraInizio} alle ${lez.oraFine}</p>
            </div>
          `;
        });

        const mailOptions = {
          from: '"FuoriClasse Promemoria" <fuoriclasse.reception@gmail.com>',
          to: emailDestinatario,
          subject: `📚 Promemoria Lezioni FuoriClasse - ${dataVisiva}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #2563eb; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px;">📚 FuoriClasse</h1>
              </div>
              <div style="padding: 24px; background-color: #ffffff;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Buongiorno! 👋</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                  Ecco il riepilogo delle lezioni previste per oggi (<b>${dataVisiva}</b>):
                </p>
                <div style="margin: 20px 0;">
                  ${lezioniHtml}
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                  Per variazioni o comunicazioni urgenti contatta pure la Reception.
                </p>
              </div>
              <div style="background-color: #f1f5f9; padding: 12px; text-align: center;">
                <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                  Ricevi questa notifica in quanto abilitata nelle impostazioni dell'App Genitore.
                </p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        emailInviate++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Elaborazione completata. Inviate ${emailInviate} email per la data odierna (${dataVisiva}).`
    });

  } catch (error) {
    console.error("Errore esecuzione promemoria:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
