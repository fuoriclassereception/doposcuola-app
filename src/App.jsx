import React, { useState, useEffect } from 'react';
import { db } from './services/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore';

import Sidebar from './components/Sidebar';
import GestioneInsegnanti from './components/GestioneInsegnanti';
import ModaleInsegnante from './components/ModaleInsegnante';
import GestioneStudenti from './components/GestioneStudenti';
import ModaleStudente from './components/ModaleStudente';
import PlanningCalendario from './components/PlanningCalendario';
import ModaleLezione from './components/ModaleLezione';
import DettaglioStudente from './components/DettaglioStudente';
import CassaPresenze from './components/CassaPresenze';

export default function App() {
  const [activeTab, setActiveTab] = useState('planning');
  const [searchQuery, setSearchQuery] = useState('');

  // ---------- STATI FIREBASE ----------
  const [insegnanti, setInsegnanti] = useState([]);
  const [studenti, setStudenti] = useState([]);
  const [lezioni, setLezioni] = useState([]);
  const [logsAttivita, setLogsAttivita] = useState([]);

  // Modali Insegnanti / Studenti
  const [showInsegnanteModal, setShowInsegnanteModal] = useState(false);
  const [editingInsegnante, setEditingInsegnante] = useState(null);
  const [insegnanteForm, setInsegnanteForm] = useState({ 
    nome: '', 
    cognome: '', 
    telefono: '', 
    email: '', 
    materia: '', 
    colore: '#3b82f6' 
  });

  const [showStudenteModal, setShowStudenteModal] = useState(false);
  const [editingStudente, setEditingStudente] = useState(null);
  const [studenteForm, setStudenteForm] = useState({ 
    nome: '', 
    cognome: '', 
    dataNascita: '', 
    scuola: '', 
    telefono: '', 
    email: '', 
    isMinorenne: true, 
    categoriaTariffaria: 'medie',
    haTariffaRiservata: false,
    tariffaRiservataValore: '',
    tariffaRiservataMotivo: '',
    genitoreNome: '', 
    genitoreTelefono: '', 
    genitoreEmail: '', 
    genitoreCodiceFiscale: '', 
    note: '' 
  });
  const [studenteSelezionatoDettaglio, setStudenteSelezionatoDettaglio] = useState(null);

  // Modale Lezione & Rischedulazione
  const [showLezioneModal, setShowLezioneModal] = useState(false);
  const [initialLezioneData, setInitialLezioneData] = useState(null);

  // ---------- ASCOLTO REALTIME DA FIREBASE ----------
  useEffect(() => {
    const unsubInsegnanti = onSnapshot(collection(db, 'insegnanti'), (snapshot) => {
      setInsegnanti(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubStudenti = onSnapshot(collection(db, 'studenti'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudenti(docs);
      
      setStudenteSelezionatoDettaglio(prev => {
        if (!prev) return null;
        return docs.find(s => s.id === prev.id) || null;
      });
    });

    const unsubLezioni = onSnapshot(collection(db, 'lezioni'), (snapshot) => {
      setLezioni(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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
  }, []);

  const aggiungiLog = async (azione, operatore = 'Admin FuoriClasse') => {
    try {
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toLocaleString(),
        createdAt: Date.now(),
        operatore,
        azione
      });
    } catch (e) {
      console.error("Errore salvataggio log:", e);
    }
  };

  // ---------- GESTIONE INSEGNANTI ----------
  const handleOpenInsegnanteModal = (ins = null) => {
    if (ins) {
      setEditingInsegnante(ins.id);
      setInsegnanteForm({ ...ins });
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
    const ins = insegnanti.find(i => i.id === id);
    if (!ins) return;
    const nuovoStato = ins.attivo === false ? true : false;
    try {
      await updateDoc(doc(db, 'insegnanti', id), { attivo: nuovoStato });
      aggiungiLog(`Docente ${ins.nome} ${ins.cognome} impostato su: ${nuovoStato ? 'Attivo' : 'Inattivo'}`);
    } catch (err) {
      console.error("Errore toggle stato insegnante:", err);
    }
  };

  const handleDeleteInsegnante = async (id) => {
    const ins = insegnanti.find(i => i.id === id);
    try {
      await deleteDoc(doc(db, 'insegnanti', id));
      aggiungiLog(`Eliminato docente: ${ins ? `${ins.nome}${ins.cognome}` : id}`);
    } catch (err) {
      console.error("Errore eliminazione docente:", err);
    }
  };

  // ---------- GESTIONE STUDENTI ----------
  const handleOpenStudenteModal = (std = null) => {
    if (std) {
      setEditingStudente(std.id);
      setStudenteForm({ 
        categoriaTariffaria: 'medie',
        haTariffaRiservata: false,
        tariffaRiservataValore: '',
        tariffaRiservataMotivo: '',
        ...std 
      });
    } else {
      setEditingStudente(null);
      setStudenteForm({ 
        nome: '', 
        cognome: '', 
        dataNascita: '', 
        scuola: '', 
        telefono: '', 
        email: '', 
        isMinorenne: true, 
        categoriaTariffaria: 'medie',
        haTariffaRiservata: false,
        tariffaRiservataValore: '',
        tariffaRiservataMotivo: '',
        genitoreNome: '', 
        genitoreTelefono: '', 
        genitoreEmail: '', 
        genitoreCodiceFiscale: '', 
        note: '' 
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
          attivo: true,
          totaleVersato: 0,
          totaleConsumato: 0,
          totalePattuito: 0,
          storicoRicariche: []
        });
        aggiungiLog(`Iscritto nuovo studente: ${studenteForm.nome} ${studenteForm.cognome}`);
      }
      setShowStudenteModal(false);
    } catch (err) {
      console.error("Errore salvataggio studente:", err);
    }
  };

  const handleToggleStatoStudente = async (id) => {
    const std = studenti.find(s => s.id === id);
    if (!std) return;
    const nuovoStato = std.attivo === false ? true : false;
    try {
      await updateDoc(doc(db, 'studenti', id), { attivo: nuovoStato });
      aggiungiLog(`Studente ${std.nome} ${std.cognome} impostato su: ${nuovoStato ? 'Attivo' : 'Inattivo'}`);
    } catch (err) {
      console.error("Errore toggle studente:", err);
    }
  };

  const handleDeleteStudente = async (id) => {
    const std = studenti.find(s => s.id === id);
    try {
      await deleteDoc(doc(db, 'studenti', id));
      aggiungiLog(`Eliminato studente: ${std ? `${std.nome}${std.cognome}` : id}`);
    } catch (err) {
      console.error("Errore eliminazione studente:", err);
    }
  };

  // ---------- RICARICA PLAFOND / CREDITO DIDATTICO ----------
  const handleRicaricaPacchetto = async (studenteId, datiRicarica) => {
    const std = studenti.find(s => s.id === studenteId);
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
      metodo: datiRicarica.metodoPagamento,
      note: datiRicarica.note || '',
      tariffaApplicata: datiRicarica.tariffaApplicata || 22.00
    };

    const storicoEsistente = std.storicoRicariche || [];

    try {
      await updateDoc(doc(db, 'studenti', studenteId), {
        totaleVersato: nuovoTotaleVersato,
        totalePagato: nuovoTotaleVersato,
        totalePattuito: nuovoTotalePattuito,
        totaleDovuto: nuovoTotalePattuito,
        storicoRicariche: [nuovaRicaricaEntry, ...storicoEsistente]
      });

      aggiungiLog(`Ricarica Plafond FuoriClasse: ${std.nome} ${std.cognome} (+${pagatoNuovo}€ via ${datiRicarica.metodoPagamento})`);
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
      await setDoc(newRef, {
        stato: 'attiva',
        ...datiLezione
      });

      if (oldLezioneId) {
        await deleteDoc(doc(db, 'lezioni', oldLezioneId));
        aggiungiLog(`Rischedulata lezione: rimossa vecchia lezione ID ${oldLezioneId} e ricollocata al ${datiLezione.data} (${datiLezione.oraInizio}-${datiLezione.oraFine})`);
      } else {
        aggiungiLog(`Nuova lezione creata: ${datiLezione.materia || 'Lezione'} (${datiLezione.oraInizio}-${datiLezione.oraFine})`);
      }

      setShowLezioneModal(false);
      setInitialLezioneData(null);
      return true;
    } catch (err) {
      console.error("Errore creazione/rischedulazione lezione:", err);
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
      const datiDaAggiornare = {
        oraInizio: moveData.oraInizio,
        oraFine: moveData.oraFine,
        isGruppo: Boolean(moveData.isGruppo)
      };
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
        stato: nuovoStato,
        motivoAnnullamento: motivo,
        tipoAnnullamento: tipo
      });
      aggiungiLog(`Stato lezione ${id} cambiato in: ${nuovoStato} (${tipo})`);
    } catch (err) {
      console.error("Errore cambio stato lezione:", err);
    }
  };

  // ---------- CASSA: CONFERMA PRESENZA CON CONSUMO PLAFOND ----------
  const handleConfermaPresenzaConScalo = async (lezione, durataOre, stato = 'svolta', motivo = '', tipo = 'gratuito') => {
    try {
      await updateDoc(doc(db, 'lezioni', lezione.id), {
        stato,
        motivoAnnullamento: motivo,
        tipoAnnullamento: tipo,
        oreScalate: durataOre
      });

      if (durataOre > 0 && (stato === 'svolta' || tipo === 'addebito')) {
        for (const sId of (lezione.studentiIds || [])) {
          const std = studenti.find(s => s.id === sId);
          if (std) {
            // Importo tariffa per studente
            let tariffaStudente = 22.00;
            if (lezione.isGruppo) {
              tariffaStudente = 12.00;
            } else if (std.haTariffaRiservata && Number(std.tariffaRiservataValore) > 0) {
              tariffaStudente = Number(std.tariffaRiservataValore);
            } else if (std.categoriaTariffaria === 'elementari') {
              tariffaStudente = 18.00;
            } else if (std.categoriaTariffaria === 'superiori') {
              tariffaStudente = 26.00;
            }

            const costoLezione = Number((durataOre * tariffaStudente).toFixed(2));
            const nuovoConsumato = Number(((std.totaleConsumato || 0) + costoLezione).toFixed(2));

            await updateDoc(doc(db, 'studenti', sId), {
              totaleConsumato: nuovoConsumato
            });
          }
        }
      }

      aggiungiLog(`Cassa FuoriClasse: Registrata presenza (ID ${lezione.id}) - Consumato plafond per ${durataOre}h`);
    } catch (err) {
      console.error("Errore conferma presenza:", err);
    }
  };

  // ---------- CASSA: STORNO PRESENZA E RIPRISTINO PLAFOND ----------
  const handleStornoPresenzaConRipristino = async (lezione, durataOre) => {
    try {
      const oreDaRestituire = lezione.oreScalate !== undefined ? Number(lezione.oreScalate) : durataOre;

      await updateDoc(doc(db, 'lezioni', lezione.id), {
        stato: 'attiva',
        motivoAnnullamento: '',
        tipoAnnullamento: '',
        oreScalate: 0
      });

      if (oreDaRestituire > 0) {
        for (const sId of (lezione.studentiIds || [])) {
          const std = studenti.find(s => s.id === sId);
          if (std) {
            let tariffaStudente = 22.00;
            if (lezione.isGruppo) {
              tariffaStudente = 12.00;
            } else if (std.haTariffaRiservata && Number(std.tariffaRiservataValore) > 0) {
              tariffaStudente = Number(std.tariffaRiservataValore);
            } else if (std.categoriaTariffaria === 'elementari') {
              tariffaStudente = 18.00;
            } else if (std.categoriaTariffaria === 'superiori') {
              tariffaStudente = 26.00;
            }

            const costoDaStornare = Number((oreDaRestituire * tariffaStudente).toFixed(2));
            const nuovoConsumato = Math.max(0, Number(((std.totaleConsumato || 0) - costoDaStornare).toFixed(2)));

            await updateDoc(doc(db, 'studenti', sId), {
              totaleConsumato: nuovoConsumato
            });
          }
        }
      }

      aggiungiLog(`Storno FuoriClasse: Ripristinata lezione ${lezione.id} e stornato costo didattico`);
    } catch (err) {
      console.error("Errore storno presenza:", err);
    }
  };

  const handleRestoreLezione = async (id) => {
    try {
      await updateDoc(doc(db, 'lezioni', id), {
        stato: 'attiva',
        motivoAnnullamento: '',
        tipoAnnullamento: ''
      });
      aggiungiLog(`Ripristinata lezione ID: ${id}`);
    } catch (err) {
      console.error("Errore ripristino lezione:", err);
    }
  };

  const handleAcceptRichiesta = async (lezioneId, nuovoDocenteId) => {
    try {
      await updateDoc(doc(db, 'lezioni', lezioneId), {
        stato: 'attiva',
        insegnanteId: nuovoDocenteId
      });
      aggiungiLog(`Approvata richiesta App FuoriClasse (ID: ${lezioneId})`);
    } catch (err) {
      console.error("Errore accettazione richiesta:", err);
    }
  };

  const handleRejectRichiesta = async (lezioneId, motivo) => {
    try {
      await updateDoc(doc(db, 'lezioni', lezioneId), {
        stato: 'annullata',
        motivoAnnullamento: motivo,
        tipoAnnullamento: 'gratuito'
      });
      aggiungiLog(`Rifiutata richiesta App FuoriClasse (ID: ${lezioneId}) - ${motivo}`);
    } catch (err) {
      console.error("Errore rifiuto richiesta:", err);
    }
  };

  const handleEstraiStudenteDaGruppo = async (lezioneGruppoId, studenteId, nuovoInsegnanteId, oraInizio, oraFine, data) => {
    try {
      const lezGruppo = lezioni.find(l => l.id === lezioneGruppoId);
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
        insegnanteId: nuovoInsegnanteId,
        isGruppo: false,
        studentiIds: [studenteId],
        materia: 'Lezione Individuale',
        oraInizio,
        oraFine,
        stato: 'attiva'
      });
      aggiungiLog(`Studente estratto dal gruppo studio e assegnato a docente`);
    } catch (err) {
      console.error("Errore estrazione studente gruppo:", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        logs={logsAttivita}
      />

      <main className="flex-1 overflow-auto bg-gray-50/50">
        {activeTab === 'planning' && (
          <PlanningCalendario
            insegnanti={insegnanti}
            studenti={studenti}
            lezioni={lezioni}
            aggiungiLog={aggiungiLog}
            onDeleteLezione={handleDeleteLezione}
            onOpenModal={handleOpenLezioneModal}
            onSelectStudent={(stdId) => {
              const std = studenti.find(s => s.id === stdId);
              setStudenteSelezionatoDettaglio(std);
            }}
            onUpdateLezioneStatus={handleUpdateLezioneStatus}
            onRestoreLezione={handleRestoreLezione}
            onUpdateLezioneCompleta={handleUpdateLezioneCompleta}
            onEstraiStudenteDaGruppo={handleEstraiStudenteDaGruppo}
            onAcceptRichiesta={handleAcceptRichiesta}
            onRejectRichiesta={handleRejectRichiesta}
          />
        )}
        
        {activeTab === 'insegnanti' && (
          <GestioneInsegnanti 
            insegnanti={insegnanti} 
            searchQuery={searchQuery} 
            onOpenModal={handleOpenInsegnanteModal} 
            onToggleStato={handleToggleStatoInsegnante} 
            onDelete={handleDeleteInsegnante} 
          />
        )}

        {activeTab === 'studenti' && (
          <GestioneStudenti 
            studenti={studenti} 
            searchQuery={searchQuery} 
            onOpenModal={handleOpenStudenteModal} 
            onToggleStato={handleToggleStatoStudente} 
            onDelete={handleDeleteStudente} 
          />
        )}

        {activeTab === 'cassa' && (
          <CassaPresenze
            lezioni={lezioni}
            studenti={studenti}
            insegnanti={insegnanti}
            onConfermaPresenzaConScalo={handleConfermaPresenzaConScalo}
            onStornoPresenzaConRipristino={handleStornoPresenzaConRipristino}
            aggiungiLog={aggiungiLog}
          />
        )}
      </main>

      <ModaleInsegnante 
        isOpen={showInsegnanteModal} 
        onClose={() => setShowInsegnanteModal(false)} 
        onSave={handleSaveInsegnante} 
        formData={insegnanteForm} 
        setFormData={setInsegnanteForm} 
        isEditing={Boolean(editingInsegnante)} 
      />

      <ModaleStudente 
        isOpen={showStudenteModal} 
        onClose={() => setShowStudenteModal(false)} 
        onSave={handleSaveStudente} 
        formData={studenteForm} 
        setFormData={setStudenteForm} 
        isEditing={Boolean(editingStudente)} 
      />

      <ModaleLezione 
        isOpen={showLezioneModal} 
        onClose={() => {
          setShowLezioneModal(false);
          setInitialLezioneData(null);
        }} 
        onSave={handleSaveLezione} 
        insegnanti={insegnanti} 
        studenti={studenti} 
        lezioni={lezioni} 
        initialData={initialLezioneData}
      />

      {studenteSelezionatoDettaglio && (
        <DettaglioStudente
          studente={studenteSelezionatoDettaglio}
          lezioni={lezioni}
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
