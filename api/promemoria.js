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
    // 1. Configurazione del mittente con Gmail e credenziali fornite
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'fuoriclasse.reception@gmail.com',
        pass: 'ssnbbnnfpwhurwbi'
      }
    });

    // 2. Calcolo Data e Ora Italiana
    const formatterData = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const [{ value: g }, , { value: m }, , { value: a }] = formatterData.formatToParts(new Date());
    const dataOggiDb = `${a}-${m}-${g}`;
    const dataVisiva = `${g}/${m}/${a}`;

    const formatterOra = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const oraAttualeStr = formatterOra.format(new Date());
    const [hNow, mNow] = oraAttualeStr.split(':').map(Number);
    const minutiAttuali = hNow * 60 + mNow;

    // 3. Recupero lezioni attive del giorno
    const lezioniSnap = await getDocs(
      query(collection(db, 'lezioni'), where('data', '==', dataOggiDb), where('stato', '==', 'attiva'))
    );

    if (lezioniSnap.empty) {
      return res.status(200).json({ success: true, message: `Nessuna lezione in programma per oggi (${dataVisiva}).` });
    }

    // 4. Recupero impostazioni genitori
    const impostazioniSnap = await getDocs(collection(db, 'impostazioni_genitori'));
    if (impostazioniSnap.empty) {
      return res.status(200).json({ success: true, message: 'Nessun genitore presente nel database impostazioni.' });
    }

    const studentiSnap = await getDocs(collection(db, 'studenti'));
    const studenti = studentiSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tutteLezioni = lezioniSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let inviiMattutini = 0;
    let inviiRecall = 0;

    // Consideriamo finestra mattutina tra le 07:30 e le 09:15
    const isOrarioMattino = (minutiAttuali >= 450 && minutiAttuali <= 555);

    for (const genitoreDoc of impostazioniSnap.docs) {
      const genitore = genitoreDoc.data();
      const emailDestinatario = genitore.email?.trim().toLowerCase();
      if (!emailDestinatario) continue;

      const figli = studenti.filter(s => (s.genitoreEmail || '').trim().toLowerCase() === emailDestinatario);
      const idsFigli = figli.map(f => f.id);
      if (idsFigli.length === 0) continue;

      const lezioniDelGenitore = tutteLezioni.filter(lez =>
        (lez.studentiIds || []).some(id => idsFigli.includes(id))
      );
      if (lezioniDelGenitore.length === 0) continue;

      // ==========================================
      // A) RIEPILOGO DEL MATTINO (Se abilitato e in orario mattutino o forzato)
      // ==========================================
      const mattutinaAbilitata = genitore.emailMattutinaAbilitata !== false;
      const chiaveMattinaGiaInviata = `mattinaInviata_${dataOggiDb}`;

      if (mattutinaAbilitata && isOrarioMattino && !genitore[chiaveMattinaGiaInviata]) {
        lezioniDelGenitore.sort((x, y) => (x.oraInizio || '').localeCompare(y.oraInizio || ''));

        let blocchiHtml = '';
        lezioniDelGenitore.forEach(lez => {
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

        await transporter.sendMail({
          from: '"FuoriClasse Promemoria" <fuoriclasse.reception@gmail.com>',
          to: emailDestinatario,
          subject: `☀️ Promemoria Lezioni FuoriClasse - ${dataVisiva}`,
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
                  ${blocchiHtml}
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
                  Per variazioni o comunicazioni urgenti puoi contattare la Reception.<br>Buona giornata!
                </p>
              </div>
            </div>
          `
        });

        await updateDoc(doc(db, 'impostazioni_genitori', genitoreDoc.id), {
          [chiaveMattinaGiaInviata]: true
        });

        inviiMattutini++;
      }

      // ==========================================
      // B) RECALL AD ORARIO PRECEDENTE (30, 60, 120 min prima)
      // ==========================================
      const recallAbilitato = Boolean(genitore.emailRecallAbilitata);
      const preavvisoMinuti = Number(genitore.preavvisoMinuti) || 60;

      if (recallAbilitato) {
        for (const lez of lezioniDelGenitore) {
          const chiaveRecallGiaInviata = `recallInviato_${genitoreDoc.id}`;
          if (lez[chiaveRecallGiaInviata]) continue;

          const [hInizio, mInizio] = (lez.oraInizio || '00:00').split(':').map(Number);
          const minutiInizio = hInizio * 60 + mInizio;
          const delta = minutiInizio - minutiAttuali;

          // Se la lezione è imminente nella finestra di preavviso
          if (delta > 0 && delta <= preavvisoMinuti) {
            const nomi = (lez.studentiIds || [])
              .filter(id => idsFigli.includes(id))
              .map(id => studenti.find(s => s.id === id)?.nome)
              .filter(Boolean)
              .join(', ') || 'Allievo';

            await transporter.sendMail({
              from: '"FuoriClasse Promemoria" <fuoriclasse.reception@gmail.com>',
              to: emailDestinatario,
              subject: `🔔 Promemoria: Lezione di ${lez.materia} tra poco (${lez.oraInizio})`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                  <div style="background-color: #2563eb; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px;">📚 FuoriClasse</h1>
                  </div>
                  <div style="padding: 24px; background-color: #ffffff;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Promemoria Lezione Imminente ⏰</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                      Ti ricordiamo che <b>${nomi}</b> ha lezione tra circa <b>${delta} minuti</b>:
                    </p>
                    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 18px 0; border-radius: 10px;">
                      <p style="margin: 0; font-size: 18px; font-weight: 800; color: #1e293b;">${lez.materia}</p>
                      <p style="margin: 6px 0 0 0; font-size: 14px; color: #d97706; font-weight: bold;">
                        ⏰ Orario: ${lez.oraInizio} - ${lez.oraFine}
                      </p>
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
                      A presto!<br>La Segreteria di FuoriClasse
                    </p>
                  </div>
                </div>
              `
            });

            await updateDoc(doc(db, 'lezioni', lez.id), {
              [chiaveRecallGiaInviata]: true
            });

            inviiRecall++;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      orarioEsecuzione: oraAttualeStr,
      data: dataVisiva,
      inviiMattutini,
      inviiRecall
    });

  } catch (error) {
    console.error("Errore elaborazione promemoria:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
