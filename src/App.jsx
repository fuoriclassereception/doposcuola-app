import React, { useState, useEffect } from 'react';
import { db, auth } from './services/firebase'; 
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Sidebar from './components/Sidebar';
import GestioneInsegnanti from './components/GestioneInsegnanti';
import ModaleInsegnante from './components/ModaleInsegnante';
import GestioneStudenti from './components/GestioneStudenti';
import ModaleStudente from './components/ModaleStudente';
import PlanningCalendario from './components/PlanningCalendario';
import ModaleLezione from './components/ModaleLezione';
import DettaglioStudente from './components/DettaglioStudente';
import CassaPresenze from './components/CassaPresenze';

import Login from './components/Login';
import AppGenitore from './components/AppGenitore';
import AppInsegnante from './components/AppInsegnante';

export default function App() {
  const [user, setUser] = useState(null);
  const [ruolo, setRuolo] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('planning');
  const [searchQuery, setSearchQuery] = useState('');

  const [insegnanti, setInsegnanti] = useState([]);
  const [studenti, setStudenti] = useState([]);
  const [lezioni, setLezioni] = useState([]);
  const [logsAttivita, setLogsAttivita] = useState([]);

  const [showInsegnanteModal, setShowInsegnanteModal] = useState(false);
  const [editingInsegnante, setEditingInsegnante] = useState(null);
  const [insegnanteForm, setInsegnanteForm] = useState({ 
    nome: '', cognome: '', telefono: '', email: '', materia: '', colore: '#3b82f6', isCoordinatore: false 
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'utenti', currentUser.uid));
          if (userDoc.exists()) {
            setRuolo(userDoc.data().ruolo);
          } else {
            const qIns = query(collection(db, 'insegnanti'), where('email', '==', currentUser.email));
            const snapIns = await getDocs(qIns);
            if (!snapIns.empty) {
              setRuolo('insegnante');
              await setDoc(doc(db, 'utenti', currentUser.uid), { ruolo: 'insegnante', email: currentUser.email });
            } else {
              setRuolo('genitore'); 
            }
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

  useEffect(() => {
    if (!user) return;

    const unsubInsegnanti = onSnapshot(collection(db, 'insegnanti'), (snapshot) => {
      setInsegnanti(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubStudenti = onSnapshot(collection(db, 'studenti'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudenti(docs);
      setStudenteSelezionatoDettaglio(prev => prev ? docs.find(s => s?.id === prev.id) || null : null);
    });

    const unsubLezioni = onSnapshot(collection(db, 'lezioni'), (snapshot) => {
      setLezioni(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogsAttivita(docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });

    return () => { unsubInsegnanti(); unsubStudenti(); unsubLezioni(); unsubLogs(); };
  }, [user]);

  const aggiungiLog = async (azione, operatore = 'Admin FuoriClasse') => {
    try {
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleString('it-IT'),
        createdAt: Date.now(),
        operatore: user?.email || operatore, 
        azione: azione || 'Azione registrata'
      });
    } catch (e) { console.error("Errore log:", e); }
  };

  const handleOpenInsegnanteModal = (ins = null) => {
    if (ins) {
      setEditingInsegnante(ins.id);
      setInsegnanteForm({ 
        nome: ins.nome || '', cognome: ins.cognome || '', telefono: ins.telefono || '', 
        email: ins.email || '', materia: ins.materia || '', colore: ins.colore || '#3b82f6', isCoordinatore: Boolean(ins.isCoordinatore) 
      });
    } else {
      setEditingInsegnante(null);
      setInsegnanteForm({ nome: '', cognome: '', telefono: '', email: '', materia: '', colore: '#3b82f6', isCoordinatore: false });
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
        await setDoc(doc(collection(db, 'insegnanti')), { ...insegnanteForm, attivo: true });
        aggiungiLog(`Creato nuovo insegnante: ${insegnanteForm.nome} ${insegnanteForm.cognome}`);
      }
      setShowInsegnanteModal(false);
    } catch (err) { console.error("Errore salvataggio insegnante:", err); }
  };

  const handleToggleStatoInsegnante = async (id) => {
    const ins = insegnanti.find(i => i?.id === id);
    if (!ins) return;
    try {
      await updateDoc(doc(db, 'insegnanti', id), { attivo: !ins.attivo });
      aggiungiLog(`Docente ${ins.nome || ''} impostato su: ${!ins.attivo ? 'Attivo' : 'Inattivo'}`);
    } catch (err) { console.error("Errore toggle:", err); }
  };

  const handleDeleteInsegnante = async (id) => {
    const ins = insegnanti.find(i => i?.id === id);
    try {
      await deleteDoc(doc(db, 'insegnanti', id));
      aggiungiLog(`Eliminato docente: ${ins?.nome || id}`);
    } catch (err) { console.error("Errore eliminazione:", err); }
  };

  const handleOpenStudenteModal = (std = null) => {
    if (std) {
      setEditingStudente(std.id);
      setStudenteForm({ 
        nome: std.nome || '', cognome: std.cognome || '', dataNascita: std.dataNascita || '', 
        scuola: std.scuola || '', telefono: std.telefono || '', email: std.email || '', 
        isMinorenne: std.isMinorenne !== undefined ? std.isMinorenne : true, 
        categoriaTariffaria: std.categoriaTariffaria || 'medie', haTariffaRiservata: Boolean(std.haTariffaRiservata),
        tariffaRiservataValore: std.tariffaRiservataValore || '', tariffaRiservataMotivo: std.tariffaRiservataMotivo || '',
        genitoreNome: std.genitoreNome || '', genitoreTelefono: std.genitoreTelefono || '', 
        genitoreEmail: std.genitoreEmail || '', genitoreCodiceFiscale: std.genitoreCodiceFiscale || '', note: std.note || '' 
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
        aggiungiLog(`Modificati dati studente: ${studenteForm.nome}`);
      } else {
        await setDoc(doc(collection(db, 'studenti')), { 
          ...studenteForm, attivo: true, totaleVersato: 0, totaleConsumato: 0, totalePattuito: 0, storicoRicariche: []
        });
        aggiungiLog(`Iscritto nuovo studente: ${studenteForm.nome}`);
      }
      setShowStudenteModal(false);
    } catch (err) { console.error("Errore studente:", err); }
  };

  const handleToggleStatoStudente = async (id) => {
    const std = studenti.find(s => s?.id === id);
    if (!std) return;
    try {
      await updateDoc(doc(db, 'studenti', id), { attivo: !std.attivo });
      aggiungiLog(`Studente ${std.nome || ''} impostato su: ${!std.attivo ? 'Attivo' : 'Inattivo'}`);
    } catch (err) { console.error("Errore toggle studente:", err); }
  };

  const handleDeleteStudente = async (id) => {
    const std = studenti.find(s => s?.id === id);
    try {
      await deleteDoc(doc(db, 'studenti', id));
      aggiungiLog(`Eliminato studente: ${std?.nome || id}`);
    } catch (err) { console.error("Errore eliminazione studente:", err); }
  };

  const handleRicaricaPacchetto = async (studenteId, datiRicarica) => {
    const std = studenti.find(s => s?.id === studenteId);
    if (!std) return;

    const costoNuovo = Number(datiRicarica.costoDaAggiungere || 0);
    const pagatoNuovo = Number(datiRicarica.pagatoDaAggiungere || 0);
    const nuovoTotaleVersato = Number(((std.totaleVersato || 0) + pagatoNuovo).toFixed(2));
    const nuovoTotalePattuito = Number(((std.totalePattuito || 0) + costoNuovo).toFixed(2));

    const nuovaRicaricaEntry = {
      numero: `${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      data: datiRicarica.data || new Date().toLocaleDateString('it-IT'),
      costoTotale: costoNuovo, pagato: pagatoNuovo,
      metodo: datiRicarica.metodoPagamento || 'Contanti', note: datiRicarica.note || '',
      tariffaApplicata: datiRicarica.tariffaApplicata || 22.00
    };

    try {
      await updateDoc(doc(db, 'studenti', studenteId), {
        totaleVersato: nuovoTotaleVersato, totalePagato: nuovoTotaleVersato,
        totalePattuito: nuovoTotalePattuito, totaleDovuto: nuovoTotalePattuito,
        storicoRicariche: [nuovaRicaricaEntry, ...(std.storicoRicariche || [])]
      });
      aggiungiLog(`Ricarica: ${std.nome} (+${pagatoNuovo}€ via ${datiRicarica.metodoPagamento})`);
    } catch (err) { console.error("Errore ricarica:", err); }
  };

  const handleOpenLezioneModal = (presetData = null) => {
    setInitialLezioneData(presetData);
    setShowLezioneModal(true);
  };

  const handleSaveLezione = async (formData) => {
    try {
      const { oldLezioneId, ...datiLezione } = formData;
      if (oldLezioneId) {
        await deleteDoc(doc(db, 'lezioni', oldLezioneId));
      }
      await setDoc(doc(collection(db, 'lezioni')), { stato: 'attiva', ...datiLezione });
      aggiungiLog(oldLezioneId ? `Rischedulata lezione ID ${oldLezioneId}` : `Nuova lezione: ${datiLezione.materia}`);
      setShowLezioneModal(false);
      setInitialLezioneData(null);
      return true;
    } catch (err) { console.error("Errore lezione:", err); return false; }
  };

  const handleDeleteLezione = async (id) => {
    try {
      await deleteDoc(doc(db, 'lezioni', id));
      aggiungiLog(`Eliminata lezione ID: ${id}`);
    } catch (err) { console.error("Errore eliminazione lezione:", err); }
  };

  const handleUpdateLezioneCompleta = async (moveData) => {
    if (!moveData.lezioneId) return;
    try {
      const datiDaAggiornare = { oraInizio: moveData.oraInizio, oraFine: moveData.oraFine, isGruppo: Boolean(moveData.isGruppo) };
      if (moveData.data) datiDaAggiornare.data = moveData.data;
      if (moveData.isGruppo) datiDaAggiornare.insegnanteId = '';
      else if (moveData.insegnanteId) datiDaAggiornare.insegnanteId = moveData.insegnanteId;
      await updateDoc(doc(db, 'lezioni', moveData.lezioneId), datiDaAggiornare);
    } catch (err) { console.error("Errore aggiornamento:", err); }
  };

  const handleUpdateLezioneStatus = async (id, nuovoStato, motivo = '', tipo = 'gratuito') => {
    try {
      await updateDoc(doc(db, 'lezioni', id), { stato: nuovoStato, motivoAnnullamento: motivo, tipoAnnullamento: tipo });
      aggiungiLog(`Stato lezione ${id} cambiato in: ${nuovoStato}`);
    } catch (err) { console.error("Errore stato lezione:", err); }
  };

  const handleConfermaPresenzaConScalo = async (lezione, durataOre, stato = 'svolta', motivo = '', tipo = 'gratuito') => {
    try {
      await updateDoc(doc(db, 'lezioni', lezione.id), { stato, motivoAnnullamento: motivo, tipoAnnullamento: tipo, oreScalate: durataOre });
      aggiungiLog(`Cassa: Presenza confermata per lezione ${lezione.id}`);
    } catch (err) { console.error("Errore cassa:", err); }
  };

  const handleStornoPresenzaConRipristino = async (lezione) => {
    try {
      await updateDoc(doc(db, 'lezioni', lezione.id), { stato: 'attiva', motivoAnnullamento: '', tipoAnnullamento: '', oreScalate: 0 });
      aggiungiLog(`Storno: Ripristinata lezione ${lezione.id}`);
    } catch (err) { console.error("Errore storno:", err); }
  };

  const handleRestoreLezione = async (id) => {
    try {
      await updateDoc(doc(db, 'lezioni', id), { stato: 'attiva', motivoAnnullamento: '', tipoAnnullamento: '' });
      aggiungiLog(`Ripristinata lezione ID: ${id}`);
    } catch (err) { console.error("Errore ripristino:", err); }
  };

  const handleAcceptRichiesta = async (lezioneId, nuovoDocenteId) => {
    try {
      await updateDoc(doc(db, 'lezioni', lezioneId), { stato: 'attiva', insegnanteId: nuovoDocenteId });
      aggiungiLog(`Approvata richiesta App (ID: ${lezioneId})`);
    } catch (err) { console.error("Errore accetta:", err); }
  };

  const handleRejectRichiesta = async (lezioneId, motivo) => {
    try {
      await updateDoc(doc(db, 'lezioni', lezioneId), { stato: 'annullata', motivoAnnullamento: motivo, tipoAnnullamento: 'gratuito' });
      aggiungiLog(`Rifiutata richiesta App (ID: ${lezioneId})`);
    } catch (err) { console.error("Errore rifiuto:", err); }
  };

  const handleEstraiStudenteDaGruppo = async (lezioneGruppoId, studenteId, nuovoInsegnanteId, oraInizio, oraFine, data) => {
    try {
      const lezGruppo = lezioni.find(l => l?.id === lezioneGruppoId);
      if (lezGruppo) {
        const rimasti = (lezGruppo.studentiIds || []).filter(sId => sId !== studenteId);
        if (rimasti.length === 0) await deleteDoc(doc(db, 'lezioni', lezioneGruppoId));
        else await updateDoc(doc(db, 'lezioni', lezioneGruppoId), { studentiIds: rimasti });
      }
      await setDoc(doc(collection(db, 'lezioni')), { 
        data: data || new Date().toISOString().split('T')[0], insegnanteId: nuovoInsegnanteId, 
        isGruppo: false, studentiIds: [studenteId], materia: 'Lezione Individuale', oraInizio, oraFine, stato: 'attiva'
      });
      aggiungiLog(`Studente estratto dal gruppo`);
    } catch (err) { console.error("Errore estrazione:", err); }
  };

  const handleSelectStudentForDetail = (stdId) => {
    const std = studenti.find(s => s?.id === stdId);
    if (std) setStudenteSelezionatoDettaglio(std);
  };

  const insegnantiSicuri = (insegnanti || []).filter(Boolean);
  const studentiSicuri = (studenti || []).filter(Boolean);
  const lezioniSicure = (lezioni || []).filter(Boolean);

  if (authLoading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-2xl font-bold text-blue-600 animate-pulse">Caricamento FuoriClasse...</div></div>;
  if (!user) return <Login />;
  
  if (ruolo === 'insegnante') return <AppInsegnante utente={user} onLogout={() => signOut(auth)} />;
  if (ruolo === 'genitore' || ruolo === 'studente') return <AppGenitore utente={user} onLogout={() => signOut(auth)} />;

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
        logs={logsAttivita}
        onLogout={() => signOut(auth)} 
      />

      <main className="flex-1 overflow-auto bg-gray-50/50">
        {activeTab === 'planning' && (
          <PlanningCalendario
            insegnanti={insegnantiSicuri} studenti={studentiSicuri} lezioni={lezioniSicure}
            aggiungiLog={aggiungiLog} onDeleteLezione={handleDeleteLezione} onOpenModal={handleOpenLezioneModal}
            onSelectStudent={handleSelectStudentForDetail}
            onUpdateLezioneStatus={handleUpdateLezioneStatus} onRestoreLezione={handleRestoreLezione}
            onUpdateLezioneCompleta={handleUpdateLezioneCompleta} onEstraiStudenteDaGruppo={handleEstraiStudenteDaGruppo}
            onAcceptRichiesta={handleAcceptRichiesta} onRejectRichiesta={handleRejectRichiesta}
          />
        )}
        
        {activeTab === 'insegnanti' && (
          <GestioneInsegnanti 
            insegnanti={insegnantiSicuri} searchQuery={searchQuery} onOpenModal={handleOpenInsegnanteModal} 
            onToggleStato={handleToggleStatoInsegnante} onDelete={handleDeleteInsegnante} 
          />
        )}

        {activeTab === 'studenti' && (
          <GestioneStudenti 
            studenti={studentiSicuri} 
            lezioni={lezioniSicure}
            searchQuery={searchQuery} 
            onOpenModal={handleOpenStudenteModal} 
            onSelectStudent={handleSelectStudentForDetail} 
            onToggleStato={handleToggleStatoStudente} 
            onDelete={handleDeleteStudente} 
          />
        )}

        {activeTab === 'cassa' && (
          <CassaPresenze
            lezioni={lezioniSicure} studenti={studentiSicuri} insegnanti={insegnantiSicuri}
            onConfermaPresenzaConScalo={handleConfermaPresenzaConScalo}
            onStornoPresenzaConRipristino={handleStornoPresenzaConRipristino} aggiungiLog={aggiungiLog}
          />
        )}
      </main>

      <ModaleInsegnante isOpen={showInsegnanteModal} onClose={() => setShowInsegnanteModal(false)} onSave={handleSaveInsegnante} formData={insegnanteForm} setFormData={setInsegnanteForm} isEditing={Boolean(editingInsegnante)} />
      <ModaleStudente isOpen={showStudenteModal} onClose={() => setShowStudenteModal(false)} onSave={handleSaveStudente} formData={studenteForm} setFormData={setStudenteForm} isEditing={Boolean(editingStudente)} />
      
      <ModaleLezione 
        isOpen={showLezioneModal} 
        onClose={() => { setShowLezioneModal(false); setInitialLezioneData(null); }} 
        onSave={handleSaveLezione} 
        insegnanti={insegnantiSicuri} 
        studenti={studentiSicuri} 
        lezioni={lezioniSicure} 
        initialData={initialLezioneData} 
      />
      
      {studenteSelezionatoDettaglio && (
        <DettaglioStudente
          studente={studenteSelezionatoDettaglio} 
          lezioni={lezioniSicure} 
          insegnanti={insegnantiSicuri}
          onClose={() => setStudenteSelezionatoDettaglio(null)}
          onUpdateLezioneCompleta={handleUpdateLezioneCompleta} 
          onUpdateLezioneStatus={handleUpdateLezioneStatus}
          onRicaricaPacchetto={handleRicaricaPacchetto} 
          aggiungiLog={aggiungiLog}
        />
      )}
    </div>
  );
}
