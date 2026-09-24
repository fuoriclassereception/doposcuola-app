import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import GestioneInsegnanti from './components/GestioneInsegnanti';
import ModaleInsegnante from './components/ModaleInsegnante';
import GestioneStudenti from './components/GestioneStudenti';
import ModaleStudente from './components/ModaleStudente';
import PlanningCalendario from './components/PlanningCalendario';
import ModaleLezione from './components/ModaleLezione';
import DettaglioStudente from './components/DettaglioStudente';

export default function App() {
  const [activeTab, setActiveTab] = useState('planning');
  const [searchQuery, setSearchQuery] = useState('');

  // ---------- STATO INSEGNANTI ----------
  const [insegnanti, setInsegnanti] = useState([
    { id: 'ins_1', nome: 'Helena', cognome: 'Capocasa', telefono: '3405762809', email: 'capocasa.helena@gmail.com', materia: 'Tedesco/Italiano', colore: '#3b82f6', attivo: true },
    { id: 'ins_2', nome: 'Maria', cognome: 'Piemontese', telefono: '', email: '', materia: 'Lingue', colore: '#10b981', attivo: true }
  ]);
  const [showInsegnanteModal, setShowInsegnanteModal] = useState(false);
  const [editingInsegnante, setEditingInsegnante] = useState(null);
  const [insegnanteForm, setInsegnanteForm] = useState({ nome: '', cognome: '', telefono: '', email: '', materia: '', colore: '#3b82f6' });

  const handleOpenInsegnanteModal = (ins = null) => {
    if (ins) { setEditingInsegnante(ins.id); setInsegnanteForm({ ...ins }); }
    else { setEditingInsegnante(null); setInsegnanteForm({ nome: '', cognome: '', telefono: '', email: '', materia: '', colore: '#3b82f6' }); }
    setShowInsegnanteModal(true);
  };

  const handleSaveInsegnante = (e) => {
    e.preventDefault();
    if (!insegnanteForm.nome || !insegnanteForm.cognome) return;
    if (editingInsegnante) {
      setInsegnanti(insegnanti.map(ins => ins.id === editingInsegnante ? { ...ins, ...insegnanteForm } : ins));
    } else {
      setInsegnanti([...insegnanti, { id: `ins_${Date.now()}`, ...insegnanteForm, attivo: true }]);
    }
    setShowInsegnanteModal(false);
  };

  // ---------- STATO STUDENTI ----------
  const [studenti, setStudenti] = useState([
    { id: 'std_1', nome: 'Marco', cognome: 'Rossi', dataNascita: '12/05/2010', scuola: 'Liceo', isMinorenne: true, genitoreNome: 'Giuseppe Rossi', genitoreEmail: 'giuseppe@gmail.com', attivo: true },
    { id: 'std_2', nome: 'Sofia', cognome: 'Bianchi', dataNascita: '22/11/2012', scuola: 'Media', isMinorenne: true, genitoreNome: 'Laura Bianchi', genitoreEmail: 'laura@gmail.com', attivo: true }
  ]);
  const [showStudenteModal, setShowStudenteModal] = useState(false);
  const [editingStudente, setEditingStudente] = useState(null);
  const [studenteForm, setStudenteForm] = useState({ nome: '', cognome: '', dataNascita: '', scuola: '', telefono: '', email: '', isMinorenne: true, genitoreNome: '', genitoreTelefono: '', genitoreEmail: '', genitoreCodiceFiscale: '', note: '' });
  const [studenteSelezionatoDettaglio, setStudenteSelezionatoDettaglio] = useState(null);

  const handleOpenStudenteModal = (std = null) => {
    if (std) { setEditingStudente(std.id); setStudenteForm({ ...std }); }
    else { setEditingStudente(null); setStudenteForm({ nome: '', cognome: '', dataNascita: '', scuola: '', telefono: '', email: '', isMinorenne: true, genitoreNome: '', genitoreTelefono: '', genitoreEmail: '', genitoreCodiceFiscale: '', note: '' }); }
    setShowStudenteModal(true);
  };

  const handleSaveStudente = (e) => {
    e.preventDefault();
    if (!studenteForm.nome || !studenteForm.cognome) return;
    if (editingStudente) {
      setStudenti(studenti.map(s => s.id === editingStudente ? { ...s, ...studenteForm } : s));
    } else {
      setStudenti([...studenti, { id: `std_${Date.now()}`, ...studenteForm, attivo: true }]);
    }
    setShowStudenteModal(false);
  };

  // ---------- STATO LEZIONI / PLANNING CON RICHIESTA DI TEST ----------
  const [lezioni, setLezioni] = useState([
    { id: 'lez_1', data: new Date().toISOString().split('T')[0], insegnanteId: 'ins_1', isGruppo: false, studentiIds: ['std_1'], materia: 'Tedesco', oraInizio: '15:00', oraFine: '16:00', stato: 'attiva' },
    // Richiesta fittizia generata per testare subito la funzionalità sulla colonna di Maria (ins_2)
    { id: 'req_test', data: new Date().toISOString().split('T')[0], insegnanteId: 'ins_2', isGruppo: false, studentiIds: ['std_2'], materia: 'Inglese / Conversazione', oraInizio: '16:00', oraFine: '17:00', stato: 'richiesta' }
  ]);
  const [showLezioneModal, setShowLezioneModal] = useState(false);

  const handleSaveLezione = (formData, isPinAuthorized = false) => {
    const dataOggi = new Date().toISOString().split('T')[0];

    if (!formData.isGruppo && !isPinAuthorized) {
      const sovrapposizione = lezioni.some(l => 
        l.data === dataOggi &&
        l.insegnanteId === formData.insegnanteId &&
        !l.isGruppo &&
        l.stato !== 'annullata' &&
        ((formData.oraInizio >= l.oraInizio && formData.oraInizio < l.oraFine) ||
         (formData.oraFine > l.oraInizio && formData.oraFine <= l.oraFine))
      );

      if (sovrapposizione) return false;
    }

    const nuovaLezione = {
      id: `lez_${Date.now()}`,
      data: dataOggi,
      stato: 'attiva',
      ...formData
    };

    setLezioni([...lezioni, nuovaLezione]);
    setShowLezioneModal(false);
    return true;
  };

  const handleDeleteLezione = (id) => {
    if (window.confirm('Vuoi davvero cancellare questa lezione dal planning?')) {
      setLezioni(lezioni.filter(l => l.id !== id));
    }
  };

  const handleUpdateLezioneCompleta = (moveData) => {
    setLezioni(prev => prev.map(l => {
      if (l.id === moveData.lezioneId) {
        return {
          ...l,
          data: moveData.data || l.data,
          oraInizio: moveData.oraInizio,
          oraFine: moveData.oraFine,
          insegnanteId: moveData.isGruppo ? '' : (moveData.insegnanteId || l.insegnanteId),
          isGruppo: Boolean(moveData.isGruppo)
        };
      }
      return l;
    }));
  };

  // Funzioni per gestire le richieste app con controllo conflitti integrato
  const handleAcceptRichiesta = (lezioneId, nuovoDocenteId) => {
    const richiestaDaAccettare = lezioni.find(l => l.id === lezioneId);
    if (!richiestaDaAccettare) return;

    const dataLezione = richiestaDaAccettare.data;

    // Verifichiamo se l'insegnante scelto ha già una lezione attiva in quella fascia oraria
    const conflitto = lezioni.some(l => 
      l.id !== lezioneId &&
      l.data === dataLezione &&
      l.insegnanteId === nuovoDocenteId &&
      l.stato === 'attiva' &&
      !l.isGruppo &&
      ((richiestaDaAccettare.oraInizio >= l.oraInizio && richiestaDaAccettare.oraInizio < l.oraFine) ||
       (richiestaDaAccettare.oraFine > l.oraInizio && richiestaDaAccettare.oraFine <= l.oraFine))
    );

    if (conflitto) {
      alert(`⚠️ Attenzione: La fascia oraria ${richiestaDaAccettare.oraInizio} - ${richiestaDaAccettare.oraFine} per questo insegnante è già occupata!\n\nLa richiesta rimane in sospeso nella colonna laterale con tutti i suoi dettagli: seleziona un altro insegnante competente per confermarla.`);
      
      setLezioni(prev => prev.map(l => {
        if (l.id === lezioneId) {
          return { ...l, haConflitto: true, ultimoTentativoDocente: nuovoDocenteId };
        }
        return l;
      }));
      return;
    }

    // Se la fascia è libera, la richiesta diventa ufficialmente una lezione attiva
    setLezioni(prev => prev.map(l => {
      if (l.id === lezioneId) {
        return { ...l, stato: 'attiva', insegnanteId: nuovoDocenteId, haConflitto: false };
      }
      return l;
    }));
  };

  const handleRejectRichiesta = (lezioneId, motivo) => {
    setLezioni(prev => prev.map(l => {
      if (l.id === lezioneId) {
        return { ...l, stato: 'annullata', motivoAnnullamento: motivo, tipoAnnullamento: 'gratuito' };
      }
      return l;
    }));
  };

  const handleEstraiStudenteDaGruppo = (lezioneGruppoId, studenteId, nuovoInsegnanteId, oraInizio, oraFine, data) => {
    setLezioni(prev => {
      const aggiornate = prev.map(l => {
        if (l.id === lezioneGruppoId) {
          return {
            ...l,
            studentiIds: (l.studentiIds || []).filter(sId => sId !== studenteId)
          };
        }
        return l;
      }).filter(l => !(l.isGruppo && (l.studentiIds || []).length === 0));

      const lezioneSingola = {
        id: `lez_${Date.now()}`,
        data: data || new Date().toISOString().split('T')[0],
        insegnanteId: nuovoInsegnanteId,
        isGruppo: false,
        studentiIds: [studenteId],
        materia: 'Lezione Individuale',
        oraInizio,
        oraFine,
        stato: 'attiva'
      };

      return [...aggiornate, lezioneSingola];
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-1 overflow-auto bg-gray-50/50">
        {activeTab === 'planning' && (
          <PlanningCalendario
            insegnanti={insegnanti}
            studenti={studenti}
            lezioni={lezioni}
            onDeleteLezione={handleDeleteLezione}
            onOpenModal={() => setShowLezioneModal(true)}
            onSelectStudent={(stdId) => {
              const std = studenti.find(s => s.id === stdId);
              setStudenteSelezionatoDettaglio(std);
            }}
            onUpdateLezioneStatus={(id, nuovoStato, motivo = '', tipo = 'gratuito') => {
              setLezioni(lezioni.map(l => l.id === id ? {
                ...l,
                stato: nuovoStato,
                motivoAnnullamento: motivo,
                tipoAnnullamento: tipo
              } : l));
            }}
            onRestoreLezione={(id) => {
              setLezioni(lezioni.map(l => l.id === id ? { ...l, stato: 'attiva', motivoAnnullamento: '', tipoAnnullamento: '' } : l));
            }}
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
            onToggleStato={(id) => setInsegnanti(insegnanti.map(ins => ins.id === id ? { ...ins, attivo: !ins.attivo } : ins))}
            onDelete={(id) => setInsegnanti(insegnanti.filter(ins => ins.id !== id))}
          />
        )}

        {activeTab === 'studenti' && (
          <GestioneStudenti
            studenti={studenti}
            searchQuery={searchQuery}
            onOpenModal={handleOpenStudenteModal}
            onToggleStato={(id) => setStudenti(studenti.map(s => s.id === id ? { ...s, attivo: !s.attivo } : s))}
            onDelete={(id) => setStudenti(studenti.filter(s => s.id !== id))}
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
        onClose={() => setShowLezioneModal(false)}
        onSave={handleSaveLezione}
        insegnanti={insegnanti}
        studenti={studenti}
        lezioni={lezioni}
      />

      {studenteSelezionatoDettaglio && (
        <DettaglioStudente
          studente={studenteSelezionatoDettaglio}
          lezioni={lezioni}
          onClose={() => setStudenteSelezionatoDettaglio(null)}
          onUpdateLezioneCompleta={handleUpdateLezioneCompleta}
          onUpdateLezioneStatus={(id, nuovoStato, motivo, tipo) => {
            setLezioni(prev => prev.map(l => l.id === id ? {
              ...l,
              stato: nuovoStato,
              motivoAnnullamento: motivo,
              tipoAnnullamento: tipo
            } : l));
          }}
        />
      )}
    </div>
  );
}
