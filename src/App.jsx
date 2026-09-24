import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import GestioneInsegnanti from './components/GestioneInsegnanti';
import ModaleInsegnante from './components/ModaleInsegnante';

export default function App() {
  const [activeTab, setActiveTab] = useState('insegnanti'); // 'planning' | 'insegnanti' | 'studenti' | 'cassa'
  const [searchQuery, setSearchQuery] = useState('');

  // Stato Anagrafica Insegnanti
  const [insegnanti, setInsegnanti] = useState([
    {
      id: 'ins_1',
      nome: 'Helena',
      cognome: 'Capocasa',
      telefono: '3405762809',
      email: 'capocasa.helena@gmail.com',
      materia: 'Tedesco/Italiano/Matematica',
      colore: 'bg-blue-500',
      attivo: true,
      gdprConfermato: true
    },
    {
      id: 'ins_2',
      nome: 'Maria',
      cognome: 'Piemontese',
      telefono: '333 1122334',
      email: 'maria.p@gmail.com',
      materia: 'Lingue',
      colore: 'bg-emerald-500',
      attivo: true,
      gdprConfermato: false
    }
  ]);

  const [showInsegnanteModal, setShowInsegnanteModal] = useState(false);
  const [editingInsegnante, setEditingInsegnante] = useState(null);
  const [insegnanteForm, setInsegnanteForm] = useState({
    nome: '', cognome: '', telefono: '', email: '', materia: '', colore: 'bg-indigo-500'
  });

  const colorOptions = [
    { label: 'Blu', class: 'bg-blue-500' },
    { label: 'Verde', class: 'bg-emerald-500' },
    { label: 'Viola', class: 'bg-purple-500' },
    { label: 'Ambra', class: 'bg-amber-500' },
    { label: 'Rosso', class: 'bg-rose-500' },
    { label: 'Ciano', class: 'bg-cyan-500' }
  ];

  const handleOpenInsegnanteModal = (ins = null) => {
    if (ins) {
      setEditingInsegnante(ins.id);
      setInsegnanteForm({
        nome: ins.nome,
        cognome: ins.cognome,
        telefono: ins.telefono,
        email: ins.email,
        materia: ins.materia,
        colore: ins.colore || 'bg-indigo-500'
      });
    } else {
      setEditingInsegnante(null);
      setInsegnanteForm({ nome: '', cognome: '', telefono: '', email: '', materia: '', colore: 'bg-indigo-500' });
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

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Sidebar Laterale con Voci di Menu a Sinistra */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Contenuto Principale */}
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

        {activeTab === 'planning' && (
          <div className="p-8 text-center text-gray-500 font-bold">
            Sezione Planning (In sviluppo nel prossimo modulo)
          </div>
        )}

        {activeTab === 'studenti' && (
          <div className="p-8 text-center text-gray-500 font-bold">
            Sezione Anagrafica Studenti (Pronta per il Modulo 2)
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
        colorOptions={colorOptions}
      />
    </div>
  );
}
