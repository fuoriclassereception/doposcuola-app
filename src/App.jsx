import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import GestioneInsegnanti from './components/GestioneInsegnanti';
import ModaleInsegnante from './components/ModaleInsegnante';

export default function App() {
  const [activeTab, setActiveTab] = useState('insegnanti');
  const [searchQuery, setSearchQuery] = useState('');

  // Nessun dato di prova: lista insegnanti parte con i dati reali dell'anagrafica
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
        gdprConfermato: false // Di default il GDPR parte da confermare fino ad azione reale
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
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

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
            Sezione Planning
          </div>
        )}

        {activeTab === 'studenti' && (
          <div className="p-8 text-center text-gray-500 font-bold">
            Sezione Anagrafica Studenti
          </div>
        )}

        {activeTab === 'cassa' && (
          <div className="p-8 text-center text-gray-500 font-bold">
            Sezione Cassa & Presenze
          </div>
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
    </div>
  );
}
