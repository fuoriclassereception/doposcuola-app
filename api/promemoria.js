// File: api/promemoria.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import nodemailer from 'nodemailer';

// ⚠️ INCOLLA QUI LA TUA VERA CONFIGURAZIONE DI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBvdt-SI07jgrKz7ebw8AD0Sqj-stf5cls",
  authDomain: "fuoriclasse-app-4dfb9.firebaseapp.com",
  projectId: "fuoriclasse-app-4dfb9",
  storageBucket: "fuoriclasse-app-4dfb9.firebasestorage.app",
  messagingSenderId: "22858064784",
  appId: "1:22858064784:web:98b33584447c8a0466c915",
  measurementId: "G-EC3NNQ9FG1"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  try {
    // 1. Configura il mittente (La tua Gmail)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'TUA_EMAIL_GMAIL@gmail.com', // ⚠️ INSERISCI LA TUA EMAIL
        pass: 'TUA_PASSWORD_PER_LE_APP'    // ⚠️ INSERISCI LA PASSWORD DI 16 CARATTERI
      }
    });

    // 2. Calcola la data di oggi (Fuso orario italiano)
    const oggi = new Date().toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' }); 
    // Trasforma "30/09/2026" in "2026-09-30" (Formato database)
    const [g, m, a] = oggi.split('/');
    const dataOggiDb = `${a}-${m.padStart(2, '0')}-${g.padStart(2, '0')}`;

    // 3. Scarica i dati dal Database
    const lezioniSnap = await getDocs(query(collection(db, 'lezioni'), where('data', '==', dataOggiDb), where('stato', '==', 'attiva')));
    if (lezioniSnap.empty) {
      return res.status(200).send('Nessuna lezione oggi. Nessuna mail inviata.');
    }

    const utentiSnap = await getDocs(query(collection(db, 'utenti'), where('emailAbilitate', '==', true)));
    const studentiSnap = await getDocs(collection(db, 'studenti'));

    const lezioniOggi = lezioniSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const genitoriAttivi = utentiSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const studenti = studentiSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let emailInviate = 0;

    // 4. Per ogni genitore che vuole le email, controlliamo se i figli hanno lezione
    for (const genitore of genitoriAttivi) {
      // Troviamo i figli di questo genitore
      const figliDelGenitore = studenti.filter(s => s.genitoreEmail === genitore.email);
      const idsFigli = figliDelGenitore.map(f => f.id);

      // Troviamo le lezioni di oggi per questi figli
      const lezioniDelGenitore = lezioniOggi.filter(lez => 
        (lez.studentiIds || []).some(id => idsFigli.includes(id))
      );

      // SE il genitore ha lezioni oggi, costruiamo e inviamo la mail!
      if (lezioniDelGenitore.length > 0) {
        
        // Ordiniamo le lezioni per orario
        lezioniDelGenitore.sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));

        // Costruiamo i "blocchetti" HTML per ogni lezione
        let lezioniHtml = '';
        lezioniDelGenitore.forEach(lez => {
           const nomiAllievi = (lez.studentiIds || []).filter(id => idsFigli.includes(id)).map(id => studenti.find(s => s.id === id)?.nome).join(', ');
           lezioniHtml += `
             <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: bold;">${lez.materia}</p>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">👤 Allievo: <b>${nomiAllievi}</b></p>
                <p style="margin: 5px 0 0 0; color: #d97706; font-size: 14px; font-weight: bold;">⏰ Dalle ${lez.oraInizio} alle ${lez.oraFine}</p>
             </div>
           `;
        });

        // La vera e propria Email formattata benissimo
        const mailOptions = {
          from: '"FuoriClasse" <tua_email_gmail@gmail.com>', // ⚠️ INSERISCI LA TUA EMAIL
          to: genitore.email,
          subject: `📚 Promemoria Lezioni FuoriClasse - ${oggi}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="background-color: #2563eb; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📚 FuoriClasse</h1>
              </div>
              <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #1e293b; margin-top: 0;">Ciao! 👋</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                  Questo è un promemoria automatico per ricordarti le lezioni in programma per la giornata di oggi:
                </p>
                
                <div style="margin: 25px 0;">
                  ${lezioniHtml}
                </div>
                
                <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                  Per qualsiasi variazione urgente, ti preghiamo di contattare la Reception.<br>
                  Ti aspettiamo!
                </p>
              </div>
              <div style="background-color: #f1f5f9; padding: 15px; text-align: center;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                  Ricevi questa mail perché hai attivato i promemoria sull'App Genitori.<br>
                  Puoi disattivarli in qualsiasi momento dalle impostazioni (⚙️).
                </p>
              </div>
            </div>
          `
        };

        // Invia la mail
        await transporter.sendMail(mailOptions);
        emailInviate++;
      }
    }

    res.status(200).send(`Successo! Controllate lezioni di oggi. Inviate ${emailInviate} email.`);
  } catch (error) {
    console.error("Errore invio email:", error);
    res.status(500).send("Errore del server durante l'invio.");
  }
}
