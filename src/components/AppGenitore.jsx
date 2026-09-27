import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function AppGenitore() {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard');
  const [richieste, setRichieste] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nuovaRichiesta, setNuovaRichiesta] = useState({
    nomeStudente: '', 
    materia: '',
    ore: 1,
    note: ''
  });

  // Legge le richieste in tempo reale da Firebase
  useEffect(() => {
    const q = query(collection(db, 'richieste_genitori'), orderBy('dataCreazione', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dati = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataFormattata: doc.data().dataCreazione?.toDate().toLocaleDateString('it-IT') || 'Oggi'
      }));
      setRichieste(dati);
    });

    return () => unsubscribe();
  }, []);

  const handleInviaRichiesta = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'richieste_genitori'), {
        studente: nuovaRichiesta.nomeStudente,
        materia: nuovaRichiesta.materia,
        ore: Number(nuovaRichiesta.ore),
        note: nuovaRichiesta.note,
        stato: 'In attesa',
        dataCreazione: serverTimestamp(),
        materialeUrl: null 
      });

      setNuovaRichiesta({ nomeStudente: '', materia: '', ore: 1, note: '' });
      setVistaAttiva('dashboard');
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore di connessione. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      {/* Contenitore che simula lo schermo di un telefono */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-screen">
        
        {/* Header App */}
        <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold">FuoriClasse</h1>
            <p className="text-sm text-blue-100">Area Genitori (Test)</p>
          </div>
          <div className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow">
            G
          </div>
        </header>

        {/* Corpo Scrollabile */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          
          {vistaAttiva === 'dashboard' && (
            <div className="space-y-6">
              <button 
                onClick={() => setVistaAttiva('nuovaRichiesta')}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Richiedi Nuove Ore
              </button>

              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Storico Richieste</h2>
                
                {richieste.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nessuna richiesta effettuata.</p>
                ) : (
                  <div className="space-y-4">
                    {richieste.map(req => (
                      <div key={req.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          req.stato === 'Approvata' ? 'bg-green-500' : 
                          req.stato === 'Rifiutata' ? 'bg-red-500' : 'bg-yellow-400'
                        }`}></div>
                        
                        <div className="flex justify-between items-start pl-3">
                          <div>
                            <span className="font-bold text-gray-800 block text-lg">{req.materia}</span>
                            <span className="text-sm font-medium text-gray-600">Studente: {req.studente} • {req.ore} {req.ore === 1 ? 'ora' : 'ore'}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            req.stato === 'Approvata' ? 'bg-green-100 text-green-700' : 
                            req.stato === 'Rifiutata' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.stato}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 pl-3 mt-1">Data: {req.dataFormattata}</p>
                        {req.note && <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 p-3 rounded-lg mt-3 ml-3">"{req.note}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {vistaAttiva === 'nuovaRichiesta' && (
            <div>
              <div className="flex items-center gap-2 mb-6 cursor-pointer text-blue-600 w-max" onClick={() => setVistaAttiva('dashboard')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span className="font-medium">Indietro alla Dashboard</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuova Richiesta</h2>
              
              <form onSubmit={handleInviaRichiesta} className="space-y-5 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Studente *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Es. Mario Rossi"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    value={nuovaRichiesta.nomeStudente}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, nomeStudente: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Materia *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Es. Matematica, Latino..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    value={nuovaRichiesta.materia}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, materia: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Numero di ore richieste *</label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    value={nuovaRichiesta.ore}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, ore: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Note e Argomenti</label>
                  <textarea 
                    rows="3"
                    placeholder="Cosa bisogna studiare? (Es. Capitolo 4...)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                    value={nuovaRichiesta.note}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, note: e.target.value})}
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-bold py-4 rounded-xl shadow transition mt-2 flex justify-center items-center ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta al Desk'}
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
