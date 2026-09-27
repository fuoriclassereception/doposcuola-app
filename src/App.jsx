import React, { useState, useEffect } from 'react';
import { db, auth } from './services/firebase'; // Aggiunto auth
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  getDoc // Aggiunto getDoc per leggere il ruolo
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Funzioni di login/logout

// Import dei tuoi componenti standard
import Sidebar from './components/Sidebar';
import GestioneInsegnanti from './components/GestioneInsegnanti';
import ModaleInsegnante from './components/ModaleInsegnante';
import GestioneStudenti from './components/GestioneStudenti';
import ModaleStudente from './components/ModaleStudente';
import PlanningCalendario from './components/PlanningCalendario';
import ModaleLezione from './components/ModaleLezione';
import DettaglioStudente from './components/DettaglioStudente';
import CassaPresenze from './components/CassaPresenze';

// Import delle nuove schermate create
import Login from './components/Login';
import AppGenitore from './components/AppGenitore';

export default function App() {
  // ---------- STATI DI AUTENTICAZIONE ----------
  const [user, setUser] = useState(null);
  const [ruolo, setRuolo] = useState(null); // 'admin' o 'genitore'
  const [authLoading, setAuthLoading] = useState(true);

  // ---------- STATI DEL GESTIONALE ----------
  const [activeTab, setActiveTab] = useState('planning');
  const [searchQuery, setSearchQuery] = useState('');

  const [insegnanti, setInsegnanti] = useState([]);
  const [studenti, setStudenti] = useState([]);
  const [lezioni, setLezioni] = useState([]);
  const [logsAttivita, setLogsAttivita] = useState([]);

  // Modali
  const [showInsegnanteModal, setShowInsegnanteModal] = useState(false);
  const [editingInsegnante, setEditingInsegnante] = useState(null);
  const [insegnanteForm, setInsegnanteForm] = useState({ 
    nome: '', cognome: '', telefono: '', email: '', materia: '', colore: '#3b82f6' 
  });

  const [showStudenteModal, setShowStudenteModal] = useState(false);
  const [editingStudente, setEditingStudente] = useState(null);
  const [studenteForm, setStudenteForm] = useState({ 
    nome: '', cognome: '', dataNascita: '', scuola: '', telefono: '', email: '', 
    isMinorenne: true, categoriaTariffaria: 'medie', haTariffaRiservata: false,
    tariffaRiservataValore: '', tariffaRiservataMotivo: '', genitoreNome: '', 
    genitoreTelefono: '', genitoreEmail: '', genitoreCodiceFiscale: '', note: '' 
  });
  const [studenteSelezionatoDettaglio, setStudenteSelezionatoDettaglio] = useState(null);

  const [showLezioneModal, setShowLezioneModal] = useState(false);
  const [initialLezioneData, setInitialLezioneData] = useState(null);

  // ---------- LISTENER AUTENTICAZIONE ----------
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Cerca il documento dell'utente nel database per capire chi è
          const userDoc = await getDoc(doc(db, 'utenti', currentUser.uid));
          if (userDoc.exists()) {
            setRuolo(userDoc.data().ruolo);
          } else {
            setRuolo('genitore'); // Fallback di sicurezza
          }
        } catch (error) {
          console.error("Errore recupero ruolo:", error);
          setRuolo('genitore');
        }
      } else {
        setUser(null);
        setRuolo(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // ---------- LISTENER DATABASE GESTIONALE ----------
  useEffect(() => {
    // Non carichiamo i dati pesanti se non c'è un utente loggato
    if (!user) return;

    const unsubInsegnanti = onSnapshot(collection(db, 'insegnanti'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInsegnanti(docs);
    });

    const unsubStudenti = onSnapshot(collection(db, 'studenti'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudenti(docs);
      setStudenteSelezionatoDettaglio(prev => {
        if (!prev) return null;
        return docs.find(s => s?.id === prev.id) || null;
      });
    });

    const unsubLezioni = onSnapshot(collection(db, 'lezioni'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLezioni(docs);
    });

    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setLogsAttivita(docs);
    });

    return () => {
      unsubInsegnanti();
      unsubStudenti();
      unsubLezioni();
      unsubLogs();
    };
  }, [user]);

  const aggiungiLog = async (azione, operatore = 'Admin FuoriClasse') => {
    try {
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleString('it-IT'),
        createdAt: Date.now(),
        operatore: user?.email || operatore, // Aggiungiamo l'email di chi fa l'azione
        azione: azione || 'Azione registrata'
      });
    } catch (e) {
      console.error("Errore salvataggio log:", e);
    }
  };

  // ---------- GESTIONE INSEGNANTI ----------
  const handleOpenInsegnanteModal = (ins = null) => {
    if (ins) {
      setEditingInsegnante(ins.id);
      setInsegnanteForm({ 
        nome: ins.nome || '', cognome: ins.cognome || '', telefono: ins.telefono || '', 
        email: ins.email || '', materia: ins.materia || '', colore: ins.colore || '#3b82f6' 
      });
    } else {
      setEditingInsegnante(null);
      setInsegnanteForm({ nome: '', cognome: '', telefono: '', email: '', materia: '', colore: '#3b82f6' });
    }
    setShowInsegnanteModal(true);
  };

  const handleSaveInsegnante = async (e) => {
    e.preventDefault();
    if (!insegnanteForm.nome || !insegnanteForm.cognome) return;
    try {
      if (editingInsegnante) {
        await updateDoc(doc(db, 'insegnanti', editingInsegnante), { ...insegnanteForm });
        aggiungiLog(`Modificati dati insegnante: ${insegnanteForm.nome} ${insegnanteForm.cognome}`);
      } else {
        const newRef = doc(collection(db, 'insegnanti'));
        await setDoc(newRef, { ...insegnanteForm, attivo: true });
        aggiungiLog(`Creato nuovo insegnante: ${insegnanteForm.nome} ${insegnanteForm.cognome}`);
      }
      setShowInsegnanteModal(false);
    } catch (err) {
      console.error("Errore salvataggio insegnante:", err);
    }
  };

  const handleToggleStatoInsegnante = async (id) => {
    const ins = insegnanti.find(i => i?.id === id);
    if (!ins) return;
    const nuovoStato = ins.attivo === false ? true : false;
    try {
      await updateDoc(doc(db, 'insegnanti', id), { attivo: nuovoStato });
      aggiungiLog(`Docente ${ins.nome || ''} ${ins.cognome || ''} impostato su: ${nuovoStato ? 'Attivo' : 'Inattivo'}`);
    } catch (err) {
      console.error("Errore toggle stato insegnante:", err);
    }
  };

  const handleDeleteInsegnante = async (id) => {
    const ins = insegnanti.find(i => i?.id === id);
    try {
      await deleteDoc(doc(db, 'insegnanti', id));
      aggiungiLog(`Eliminato docente: ${ins?.nome ? `${ins.nome}${ins.cognome || ''}` : id}`);
    } catch (err) {
      console.error("Errore eliminazione docente:", err);
    }
  };

  // ---------- GESTIONE STUDENTI ----------
  const handleOpenStudenteModal = (std = null) => {
    if (std) {
      setEditingStudente(std.id);
      setStudenteForm({ 
        nome: std.nome || '', cognome: std.cognome || '', dataNascita: std.dataNascita || '', 
        scuola: std.scuola || '', telefono: std.telefono || '', email: std.email || '', 
        isMinorenne: std.isMinorenne !== undefined ? std.isMinorenne : true, 
        categoriaTariffaria: std.categoriaTariffaria || 'medie',
        haTariffaRiservata: Boolean(std.haTariffaRiservata),
        tariffaRiservataValore: std.tariffaRiservataValore || '',
        tariffaRiservataMotivo: std.tariffaRiservataMotivo || '',
        genitoreNome: std.genitoreNome || '', genitoreTelefono: std.genitoreTelefono || '', 
        genitoreEmail: std.genitoreEmail || '', genitoreCodiceFiscale: std.genitoreCodiceFiscale || '', 
        note: std.note || '' 
      });
    } else {
      setEditingStudente(null);
      setStudenteForm({ 
        nome: '', cognome: '', dataNascita: '', scuola: '', telefono: '', email: '', 
        isMinorenne: true, categoriaTariffaria: 'medie', haTariffaRiservata: false,
        tariffaRiservataValore: '', tariffaRiservataMotivo: '', genitoreNome: '', 
        genitoreTelefono: '', genitoreEmail: '', genitoreCodiceFiscale: '', note: '' 
      });
    }
    setShowStudenteModal(true);
  };

  const handleSaveStudente = async (e) => {
    e.preventDefault();
    if (!studenteForm.nome || !studenteForm.cognome) return;
    try {
      if (editingStudente) {
        await updateDoc(doc(db, 'studenti', editingStudente), { ...studenteForm });
        aggiungiLog(`Modificati dati studente: ${studenteForm.nome} ${studenteForm.cognome}`);
      } else {
        const newRef = doc(collection(db, 'studenti'));
        await setDoc(newRef, { 
          ...studenteForm, 
          attivo: true, totaleVersato: 0, totaleConsumato: 0, totalePattuito: 0, storicoRicariche: []
        });
        aggiungiLog(`Iscritto nuovo studente: ${studenteForm.nome} ${studenteForm.cognome}`);
      }
      setShowStudenteModal(false);
    } catch (err) {
      console.error("Errore salvataggio studente:", err);
    }
  };

  const handleToggleStatoStudente = async (id) => {
    const std = studenti.find(s => s?.id === id);
    if (!std) return;
    const nuovoStato = std.attivo === false ? true : false;
    try {
      await updateDoc(doc(db, 'studenti', id), { attivo: nuovoStato });
      aggiungiLog(`Studente ${std.nome || ''} ${std.cognome || ''} impostato su: ${nuovoStato ? 'Attivo' : 'Inattivo'}`);
    } catch (err) {
      console.error("Errore toggle studente:", err);
    }
  };

  const handleDeleteStudente = async (id) => {
    const std = studenti.find(s => s?.id === id);
    try {
      await deleteDoc(doc(db, 'studenti', id));
      aggiungiLog(`Eliminato studente: ${std?.nome ? `${std.nome}${std.cognome || ''}` : id}`);
    } catch (err) {
      console.error("Errore eliminazione studente:", err);
    }
  };

  // ---------- RICARICA PLAFOND DIDATTICO ----------
  const handleRicaricaPacchetto = async (studenteId, datiRicarica) => {
    const std = studenti.find(s => s?.id === studenteId);
    if (!std) return;

    const costoNuovo = Number(datiRicarica.costoDaAggiungere || 0);
    const pagatoNuovo = Number(datiRicarica.pagatoDaAggiungere || 0);

    const nuovoTotaleVersato = Number(((std.totaleVersato || std.totalePagato || 0) + pagatoNuovo).toFixed(2));
    const nuovoTotalePattuito = Number(((std.totalePattuito || std.totaleDovuto || 0) + costoNuovo).toFixed(2));

    const nuovaRicaricaEntry = {
      numero: `${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      data: datiRicarica.data || new Date().toLocaleDateString('it-IT'),
      costoTotale: costoNuovo,
      pagato: pagatoNuovo,
      metodo: datiRicarica.metodoPagamento || 'Contanti',
      note: datiRicarica.note || '',
      tariffaApplicata: datiRicarica.tariffaApplicata || 22.00
    };

    const storicoEsistente = std.storicoRicariche || [];

    try {
      await updateDoc(doc(db, 'studenti', studenteId), {
        totaleVersato: nuovoTotaleVersato, totalePagato: nuovoTotaleVersato,
        totalePattuito: nuovoTotalePattuito, totaleDovuto: nuovoTotalePattuito,
        storicoRicariche: [nuovaRicaricaEntry, ...storicoEsistente]
      });

      aggiungiLog(`Ricarica Plafond: ${std.nome || ''} ${std.cognome || ''} (+${pagatoNuovo}€ via ${datiRicarica.metodoPagamento || 'Contanti'})`);
    } catch (err) {
      console.error("Errore ricarica plafond didattico:", err);
    }
  };

  // ---------- GESTIONE LEZIONI E RISCHEDULAZIONE ----------
  const handleOpenLezioneModal = (presetData = null) => {
    setInitialLezioneData(presetData);
    setShowLezioneModal(true);
  };

  const handleSaveLezione = async (formData) => {
    try {
      const { oldLezioneId, ...datiLezione } = formData;
      const newRef = doc(collection(db, 'lezioni'));
      await setDoc(newRef, { stato: 'attiva', ...datiLezione });

      if (oldLezioneId) {
        await deleteDoc(doc(db, 'lezioni', oldLezioneId));
        aggiungiLog(`Rischedulata lezione: rimossa vecchia ID ${oldLezioneId} e ricollocata al ${datiLezione.data} (${datiLezione.oraInizio}-${datiLezione.oraFine})`);
      } else {
        aggiungiLog(`Nuova lezione: ${datiLezione.materia || 'Lezione'} (${datiLezione.oraInizio}-${datiLezione.oraFine})`);
      }

      setShowLezioneModal(false);
      setInitialLezioneData(null);
      return true;
    } catch (err) {
      console.error("Errore salvataggio lezione:", err);
      return false;
    }
  };

  const handleDeleteLezione = async (id) => {
    try {
      await deleteDoc(doc(db, 'lezioni', id));
      aggiungiLog(`Eliminata definitivamente lezione ID: ${id}`);
    } catch (err) {
      console.error("Errore eliminazione lezione:", err);
    }
  };

  const handleUpdateLezioneCompleta = async (moveData) => {
    if (!moveData.lezioneId) return;
    try {
      const datiDaAggiornare = { oraInizio: moveData.oraInizio, oraFine: moveData.oraFine, isGruppo: Boolean(moveData.isGruppo) };
      if (moveData.data) datiDaAggiornare.data = moveData.data;
      if (moveData.isGruppo) {
        datiDaAggiornare.insegnanteId = '';
      } else if (moveData.insegnanteId) {
        datiDaAggiornare.insegnanteId = moveData.insegnanteId;
      }
      await updateDoc(doc(db, 'lezioni', moveData.lezioneId), datiDaAggiornare);
    } catch (err) {
      console.error("Errore aggiornamento lezione:", err);
    }
  };

  const handleUpdateLezioneStatus = async (id, nuovoStato, motivo = '', tipo = 'gratuito') => {
    try {
      await updateDoc(doc(db, 'lezioni', id), {
        stato: nuovoStato, motivoAnnullamento: motivo, tipoAnnullamento: tipo
      });
      aggiungiLog(`Stato lezione ${id} cambiato in: ${nuovoStato} (${tipo})`);
    } catch (err) {
      console.error("Errore cambio stato lezione:", err);
    }
  };

  // ---------- CASSA: CONFERMA E STORNO ----------
  const handleConfermaPresenzaConScalo = async (lezione, durataOre, stato = 'svolta', motivo = '', tipo = 'gratuito') => {
    try {
      await updateDoc(doc(db, 'lezioni', lezione.id), {
        stato, motivoAnnullamento: motivo, tipoAnnullamento: tipo, oreScalate: durataOre
      });

      if (durataOre > 0 && (stato === 'svolta' || tipo === 'addebito')) {
        for (const sId of (lezione.studentiIds || [])) {
          const std = studenti.find(s => s?.id === sId);
          if (std) {
            let tariffaDaApplicare = lezione.tariffaOrariaApplicata !== undefined ? Number(lezione.tariffaOrariaApplicata) : null;

            if (tariffaDaApplicare === null) {
              if (lezione.isGruppo) tariffaDaApplicare = 12.00;
              else if (std.haTariffaRiservata && Number(std.tariffaRiservataValore) > 0) tariffaDaApplicare = Number(std.tariffaRiservataValore);
              else if (std.categoriaTariffaria === 'elementari') tariffaDaApplicare = 18.00;
              else if (std.categoriaTariffaria === 'superiori') tariffaDaApplicare = 26.00;
              else tariffaDaApplicare = 22.00;
            }

            const costoLezione = Number((durataOre * tariffaDaApplicare).toFixed(2));
            const nuovoConsumato = Number(((std.totaleConsumato || 0) + costoLezione).toFixed(2));

            await updateDoc(doc(db, 'studenti', sId), { totaleConsumato: nuovoConsumato });
          }
        }
      }
      aggiungiLog(`Cassa: Presenza confermata per lezione ${lezione.id} (${durataOre}h)`);
    } catch (err) {
      console.error("Errore conferma presenza:", err);
    }
  };

  const handleStornoPresenzaConRipristino = async (lezione, durataOre) => {
    try {
      const oreDaRestituire = lezione.oreScalate !== undefined ? Number(lezione.oreScalate) : durataOre;

      await updateDoc(doc(db, 'lezioni', lezione.id), {
        stato: 'attiva', motivoAnnullamento: '', tipoAnnullamento: '', oreScalate: 0
      });

      if (oreDaRestituire > 0) {
        for (const sId of (lezione.studentiIds || [])) {
          const std = studenti.find(s => s?.id === sId);
          if (std) {
            let tariffaStudente = 22.00;
            if (lezione.isGruppo) tariffaStudente = 12.00;
            else if (std.haTariffaRiservata && Number(std.tariffaRiservataValore) > 0) tariffaStudente = Number(std.tariffaRiservataValore);
            else if (std.categoriaTariffaria === 'elementari') tariffaStudente = 18.00;
            else if (std.categoriaTariffaria === 'superiori') tariffaStudente = 26.00;

            const costoDaStornare = Number((oreDaRestituire * tariffaStudente).toFixed(2));
            const nuovoConsumato = Math.max(0, Number(((std.totaleConsumato || 0) - costoDaStornare).toFixed(2)));

            await updateDoc(doc(db, 'studenti', sId), { totaleConsumato: nuovoConsumato });
          }
        }
      }
      aggiungiLog(`Storno: Ripristinata lezione ${lezione.id} e stornato costo didattico`);
    } catch (err) {
      console.error("Errore storno presenza:", err);
    }
  };

  const handleRestoreLezione = async (id) => {
    try {
      await updateDoc(doc(db, 'lezioni', id), { stato: 'attiva', motivoAnnullamento: '', tipoAnnullamento: '' });
      aggiungiLog(`Ripristinata lezione ID: ${id}`);
    } catch (err) {
      console.error("Errore ripristino lezione:", err);
    }
  };

  const handleAcceptRichiesta = async (lezioneId, nuovoDocenteId) => {
    try {
      await updateDoc(doc(db, 'lezioni', lezioneId), { stato: 'attiva', insegnanteId: nuovoDocenteId });
      aggiungiLog(`Approvata richiesta App FuoriClasse (ID: ${lezioneId})`);
    } catch (err) {
      console.error("Errore accettazione richiesta:", err);
    }
  };

  const handleRejectRichiesta = async (lezioneId, motivo) => {
    try {
      await updateDoc(doc(db, 'lezioni', lezioneId), { stato: 'annullata', motivoAnnullamento: motivo, tipoAnnullamento: 'gratuito' });
      aggiungiLog(`Rifiutata richiesta App FuoriClasse (ID: ${lezioneId}) - ${motivo}`);
    } catch (err) {
      console.error("Errore rifiuto richiesta:", err);
    }
  };

  const handleEstraiStudenteDaGruppo = async (lezioneGruppoId, studenteId, nuovoInsegnanteId, oraInizio, oraFine, data) => {
    try {
      const lezGruppo = lezioni.find(l => l?.id === lezioneGruppoId);
      if (lezGruppo) {
        const rimasti = (lezGruppo.studentiIds || []).filter(sId => sId !== studenteId);
        if (rimasti.length === 0) {
          await deleteDoc(doc(db, 'lezioni', lezioneGruppoId));
        } else {
          await updateDoc(doc(db, 'lezioni', lezioneGruppoId), { studentiIds: rimasti });
        }
      }

      const newRef = doc(collection(db, 'lezioni'));
      await setDoc(newRef, {
        data: data || new Date().toISOString().split('T')[0],
        insegnanteId: nuovoInsegnanteId, isGruppo: false, studentiIds: [studenteId],
        materia: 'Lezione Individuale', oraInizio, oraFine, stato: 'attiva'
      });
      aggiungiLog(`Studente estratto dal gruppo studio e assegnato a docente`);
    } catch (err) {
      console.error("Errore estrazione studente gruppo:", err);
    }
  };

  const insegnantiSicuri = (insegnanti || []).filter(Boolean);
  const studentiSicuri = (studenti || []).filter(Boolean);
  const lezioniSicure = (lezioni || []).filter(Boolean);


  // =======================================================================
  // IL CERVELLO DELL'APP: CHI VEDE COSA?
  // =======================================================================

  // 1. Schermata di caricamento finché non capiamo chi è l'utente
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl font-bold text-blue-600 animate-pulse">Caricamento FuoriClasse...</div>
      </div>
    );
  }

  // 2. Se l'utente non è loggato, mostra la schermata di Login
  if (!user) {
    return <Login />;
  }

  // 3. Se l'utente è un genitore, mostra la sua App
  if (ruolo === 'genitore') {
    return <AppGenitore utente={user} onLogout={() => signOut(auth)} />;
  }

 // 4. Se l'utente è ADMIN, mostra il gestionale completo
  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden relative">
      
      {/* Bottone Logout temporaneo per il Desk */}
      <button 
        onClick={() => signOut(auth)}
        className="absolute top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-red-700 transition"
      >
        Esci (Admin)
      </button>

      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
        logs={logsAttivita}
      />
}
