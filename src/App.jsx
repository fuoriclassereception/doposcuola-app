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
  
  // Stato per visualizzare la scheda di dettaglio/statistiche di uno studente
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
const handleUpdateLezioneCompleta = (moveData) => {
  setLezioni(lezioni.map(l => l.id === moveData.lezioneId ? {
    ...l,
    data: moveData.data || l.data,
    oraInizio: moveData.oraInizio,
    oraFine: moveData.oraFine,
    insegnanteId: moveData.insegnanteId,
    isGruppo: moveData.isGruppo
  } : l));
};

// Nella chiamata del componente PlanningCalendario:
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
/>
  // ---------- STATO LEZIONI / PLANNING ----------
  const [lezioni, setLezioni] = useState([
    { id: 'lez_1', data: new Date().toISOString().split('T')[0], insegnanteId: 'ins_1', isGruppo: false, studentiIds: ['std_1'], materia: 'Tedesco', oraInizio: '15:00', oraFine: '16:00', stato: 'attiva' }
  ]);
  const [showLezioneModal, setShowLezioneModal] = useState(false);

  const handleSaveLezione = (formData, isPinAuthorized = false) => {
    const dataOggi = new Date().toISOString().split('T')[0];

    // Verifica Sovrapposizione Docente
    if (!formData.isGruppo && !isPinAuthorized) {
      const sovrapposizione = lezioni.some(l => 
        l.data === dataOggi &&
        l.insegnanteId === formData.insegnanteId &&
        !l.isGruppo &&
        l.stato !== 'annullata' &&
        ((formData.oraInizio >= l.oraInizio && formData.oraInizio < l.oraFine) ||
         (formData.oraFine > l.oraInizio && formData.oraFine <= l.oraFine))
      );

      if (sovrapposizione) {
        return false;
      }
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

  // Aggiornamento orario d'inizio e di fine via Drag & Drop o Popup (+/- 15 min)
  const handleUpdateLezioneOrari = (lezioneId, oraInizio, oraFine) => {
    setLezioni(lezioni.map(l => l.id === lezioneId ? { ...l, oraInizio, oraFine } : l));
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
            onUpdateLezioneStatus={(id, nuovoStato) => {
              setLezioni(lezioni.map(l => l.id === id ? { ...l, stato: nuovoStato } : l));
            }}
            onRestoreLezione={(id) => {
              setLezioni(lezioni.map(l => l.id === id ? { ...l, stato: 'attiva' } : l));
            }}
            onUpdateLezioneOrari={handleUpdateLezioneOrari}
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

      {/* Modale Insegnante */}
      <ModaleInsegnante
        isOpen={showInsegnanteModal}
        onClose={() => setShowInsegnanteModal(false)}
        onSave={handleSaveInsegnante}
        formData={insegnanteForm}
        setFormData={setInsegnanteForm}
        isEditing={Boolean(editingInsegnante)}
      />

      {/* Modale Studente */}
      <ModaleStudente
        isOpen={showStudenteModal}
        onClose={() => setShowStudenteModal(false)}
        onSave={handleSaveStudente}
        formData={studenteForm}
        setFormData={setStudenteForm}
        isEditing={Boolean(editingStudente)}
      />

      {/* Modale Inserimento Lezione */}
      <ModaleLezione
        isOpen={showLezioneModal}
        onClose={() => setShowLezioneModal(false)}
        onSave={handleSaveLezione}
        insegnanti={insegnanti}
        studenti={studenti}
        lezioni={lezioni}
      />

      {/* Pop-up Scheda e Dettaglio Lezioni Studente */}
      {studenteSelezionatoDettaglio && (
        <DettaglioStudente
          studente={studenteSelezionatoDettaglio}
          lezioni={lezioni}
          onClose={() => setStudenteSelezionatoDettaglio(null)}
        />
      )}
    </div>
  );
}
