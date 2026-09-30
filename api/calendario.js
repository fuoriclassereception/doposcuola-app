// File: api/calendario.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// ⚠️ INCOLLA QUI LA TUA VERA CONFIGURAZIONE DI FIREBASE!
const firebaseConfig = {
  apiKey: "LA_TUA_API_KEY",
  authDomain: "IL_TUO_PROJECT_ID.firebaseapp.com",
  projectId: "IL_TUO_PROJECT_ID",
  storageBucket: "IL_TUO_PROJECT_ID.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  const profId = req.query.profId;
  
  if (!profId) {
    return res.status(400).send('Errore: ID Insegnante mancante.');
  }

  try {
    // Scarichiamo lezioni e studenti per costruire il calendario
    const lezioniSnap = await getDocs(collection(db, 'lezioni'));
    const studentiSnap = await getDocs(collection(db, 'studenti'));

    const studenti = {};
    studentiSnap.forEach(doc => { studenti[doc.id] = doc.data(); });

      // Intestazione arricchita per Google Calendar e Apple Calendar
    let icsData = `BEGIN:VCALENDAR\r\n`;
    icsData += `VERSION:2.0\r\n`;
    icsData += `PRODID:-//FuoriClasse//IT\r\n`;
    icsData += `CALSCALE:GREGORIAN\r\n`;
    icsData += `METHOD:PUBLISH\r\n`;
    icsData += `X-WR-CALNAME:FuoriClasse - Lezioni\r\n`; // <-- IL NOME AUTOMATICO!
    icsData += `X-WR-TIMEZONE:Europe/Rome\r\n`;        // <-- IL FUSO ORARIO CORRETTO!
    icsData += `X-WR-CALDESC:Calendario personale docente\r\n`;

    lezioniSnap.forEach(doc => {
      const lez = doc.data();
      
      // Controlliamo se il professore è Titolare o Co-Docente in questa lezione
      const isTitolare = lez.insegnanteId === profId;
      const isCoDocente = (lez.coDocentiIds || []).includes(profId);

      if ((isTitolare || isCoDocente) && lez.stato !== 'annullata') {
        // Puliamo le date per il formato Google (da 2026-09-28 a 20260928)
        const formatString = (str) => (str || '').replace(/-/g, '').replace(/:/g, '');
        const dtStart = `${formatString(lez.data)}T${formatString(lez.oraInizio)}00`;
        const dtEnd = `${formatString(lez.data)}T${formatString(lez.oraFine)}00`;

        const nomiStd = (lez.studentiIds || []).map(id => studenti[id]?.nome || 'Studente').join(', ');
        const titolo = `${lez.materia || 'Lezione'} - ${nomiStd}`;
        const descrizione = `Lezione di ${lez.materia} con ${nomiStd}. ${lez.note ? 'Note: ' + lez.note : ''}`;

        icsData += `BEGIN:VEVENT\r\n`;
        icsData += `UID:${doc.id}@fuoriclasse\r\n`;
        icsData += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
        // Impostiamo forzatamente il fuso orario italiano per evitare sfasamenti solare/legale
        icsData += `DTSTART;TZID=Europe/Rome:${dtStart}\r\n`;
        icsData += `DTEND;TZID=Europe/Rome:${dtEnd}\r\n`;
        icsData += `SUMMARY:${titolo}\r\n`;
        icsData += `DESCRIPTION:${descrizione}\r\n`;
        icsData += `END:VEVENT\r\n`;
      }
    });

    icsData += `END:VCALENDAR\r\n`;

    // Inviamo il file al browser/app
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="calendario_docente.ics"');
    res.status(200).send(icsData);

  } catch (error) {
    console.error("Errore Calendario:", error);
    res.status(500).send('Errore interno del server.');
  }
}
