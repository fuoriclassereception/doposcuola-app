import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import GestioneInsegnanti from './components/GestioneInsegnanti';
import ModaleInsegnante from './components/ModaleInsegnante';
import GestioneStudenti from './components/GestioneStudenti';
import ModaleStudente from './components/ModaleStudente';

export default function App() {
  const [activeTab, setActiveTab] = useState('insegnanti');
  const [searchQuery, setSearchQuery] = useState('');

  // ---------- STATO INSEGNANTI ----------
  const [insegnanti, setInsegnanti] = useState([
    {
      id: 'ins_1',
      nome: 'Helena',
      cognome: 'Capocasa',
      telefono: '3405762809',
      email: 'capocasa.helena@gmail.com',
      materia: 'Tedesco/Italiano/Matematica',
      colore: '#3b82f6',
      attivo: true,
      gdprConfermato: false
    },
    {
      id: 'ins_2',
      nome: 'Maria',
      cognome: 'Piemontese',
      telefono: '',
      email: '',
      materia: 'Lingue',
      colore: '#10b981',
      attivo: true,
      gdprConfermato: false
    }
  ]);

  const [showInsegnanteModal, setShowInsegnanteModal] = useState(false);
  const [editingInsegnante, setEditingInsegnante] = useState(null);
  const [insegnanteForm, setInsegnanteForm] = useState({
    nome: '', cognome: '', telefono: '', email: '', materia: '', colore: '#3b82f6'
  });

  const handleOpenInsegnanteModal = (ins = null) => {
    if (ins) {
      setEditingInsegnante(ins.id);
      setInsegnanteForm({
        nome: ins.nome,
        cognome: ins.cognome,
        telefono: ins.telefono,
        email: ins.email,
        materia: ins.materia,
        colore: ins.colore || '#3b82f6'
      });
    } else {
      setEditingInsegnante(null);
      setInsegnanteForm({ nome: '', cognome: '', telefono: '', email: '', materia: '', colore: '#3b82f6' });
    }
    setShowInsegnanteModal(true);
  };

  const handleSaveInsegnante = (e) => {
    e.preventDefault();
    if (!insegnanteForm.nome || !insegnanteForm.cognome) return;

    if (editingInsegnante) {
      setInsegnanti(insegnanti.map(ins => ins.id === editingInsegnante ? {
        ...ins,
        ...insegnanteForm
      } : ins));
    } else {
      const newIns = {
        id: `ins_${Date.now()}`,
        ...insegnanteForm,
        attivo: true,
        gdprConfermato: false
      };
      setInsegnanti([...insegnanti, newIns]);
    }

    setShowInsegnanteModal(false);
  };

  const handleDeleteInsegnante = (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo insegnante dall'anagrafica?")) {
      setInsegnanti(insegnanti.filter(ins => ins.id !== id));
    }
  };

  const toggleInsegnanteStato = (id) => {
    setInsegnanti(insegnanti.map(ins => ins.id === id ? { ...ins, attivo: !ins.attivo } : ins));
  };

  // ---------- STATO STUDENTI & GENITORI ----------
  const [studenti, setStudenti] = useState([]);
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
    genitoreNome: '',
    genitoreTelefono: '',
    genitoreEmail: '',
    genitoreCodiceFiscale: '',
    note: ''
  });

  const handleOpenStudenteModal = (std = null) => {
    if (std) {
      setEditingStudente(std.id);
      setStudenteForm({ ...std });
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
        genitoreNome: '',
        genitoreTelefono: '',
        genitoreEmail: '',
        genitoreCodiceFiscale: '',
        note: ''
      });
    }
    setShowStudenteModal(true);
  };

  const handleSaveStudente = (e) => {
    e.preventDefault();
    if (!studenteForm.nome || !studenteForm.cognome) return;

    if (editingStudente) {
      setStudenti(studenti.map(s => s.id === editingStudente ? {
        ...s,
        ...studenteForm
      } : s));
    } else {
      const newStudente = {
        id: `std_${Date.now()}`,
        ...studenteForm,
        attivo: true,
        gdprConfermato: false
      };
      setStudenti([...studenti, newStudente]);
    }

    setShowStudenteModal(false);
  };

  const handleDeleteStudente = (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo studente dall'anagrafica?")) {
      setStudenti(studenti.filter(s => s.id !== id));
    }
  };

  const toggleStudenteStato = (id) => {
    setStudenti(studenti.map(s => s.id === id ? { ...s, attivo: !s.attivo } : s));
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Sidebar Laterale */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Area Principale dei Contenuti */}
      <main className="flex-1 overflow-auto bg-gray-50/50">
        {activeTab === 'insegnanti' && (
          <GestioneInsegnanti
            insegnanti={insegnanti}
            searchQuery={searchQuery}
            onOpenModal={handleOpenInsegnanteModal}
            onToggleStato={toggleInsegnanteStato}
            onDelete={handleDeleteInsegnante}
          />
        )}

        {activeTab === 'studenti' && (
          <GestioneStudenti
            studenti={studenti}
            searchQuery={searchQuery}
            onOpenModal={handleOpenStudenteModal}
            onToggleStato={toggleStudenteStato}
            onDelete={handleDeleteStudente}
          />
        )}

        {activeTab === 'planning' && (
          <div className="p-8 text-center text-gray-500 font-bold">
            Sezione Planning
          </div>
        )}

        {activeTab === 'cassa' && (
          <div className="p-8 text-center text-gray-500 font-bold">
            Sezione Cassa & Presenze
          </div>
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
    </div>
  );
}
