import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function AppGenitore() {
  const [vistaAttiva, setVistaAttiva] = useState('dashboard'); // 'dashboard' | 'nuovaRichiesta'
  const [richieste, setRichieste] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stato del form
  const [nuovaRichiesta, setNuovaRichiesta] = useState({
    nomeStudente: '', // Temporaneo per i test interni
    materia: '',
    ore: 1,
    note: ''
  });

  // Lettura in tempo reale da Firestore
  useEffect(() => {
    const q = query(collection(db, 'richieste_genitori'), orderBy('dataCreazione', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dati = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Formattiamo la data per la visualizzazione
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
        stato: 'In attesa', // Stati possibili: 'In attesa', 'Approvata', 'Rifiutata'
        dataCreazione: serverTimestamp(),
        // Qui in futuro salveremo l'URL del file caricato su Firebase Storage
        materialeUrl: null 
      });

      // Reset form e ritorno alla dashboard
      setNuovaRichiesta({ nomeStudente: '', materia: '', ore: 1, note: '' });
      setVistaAttiva('dashboard');
    } catch (error) {
      console.error("Errore durante l'invio della richiesta:", error);
      alert("Errore di connessione. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-lg flex flex-col h-screen">
        
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold">FuoriClasse</h1>
            <p className="text-sm text-blue-100">Area Genitori (Test Interno)</p>
          </div>
          <div className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
            G
          </div>
        </header>

        {/* Contenuto Scrollabile */}
        <main className="flex-1 overflow-y-auto p-4">
          
          {vistaAttiva === 'dashboard' && (
            <div className="space-y-6">
              <button 
                onClick={() => setVistaAttiva('nuovaRichiesta')}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-blue-700 transition flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Richiedi Nuove Ore
              </button>

              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Storico Richieste</h2>
                
                {richieste.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">Nessuna richiesta effettuata.</p>
                ) : (
                  <div className="space-y-3">
                    {richieste.map(req => (
                      <div key={req.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
                        {/* Bordo colorato in base allo stato */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          req.stato === 'Approvata' ? 'bg-green-500' : 
                          req.stato === 'Rifiutata' ? 'bg-red-500' : 'bg-yellow-400'
                        }`}></div>
                        
                        <div className="flex justify-between items-start pl-2">
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
                        <p className="text-xs text-gray-400 pl-2">Data: {req.dataFormattata}</p>
                        {req.note && <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg mt-1 ml-2">"{req.note}"</p>}
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
                <span className="font-medium">Indietro</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuova Richiesta</h2>
              
              <form onSubmit={handleInviaRichiesta} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Studente *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Es. Mario Rossi"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={nuovaRichiesta.nomeStudente}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, nomeStudente: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Es. Matematica, Latino..."
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={nuovaRichiesta.materia}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, materia: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero di ore richieste *</label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={nuovaRichiesta.ore}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, ore: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note e Argomenti (Opzionale)</label>
                  <textarea 
                    rows="3"
                    placeholder="Cosa bisogna studiare? (Es. Capitolo 4, equazioni...)"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={nuovaRichiesta.note}
                    onChange={(e) => setNuovaRichiesta({...nuovaRichiesta, note: e.target.value})}
                  ></textarea>
                </div>

                {/* Placeholder per upload - Da collegare a Firebase Storage in futuro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materiale Extra</label>
                  <input 
                    type="file" 
                    className="w-full p-2 border border-dashed border-gray-400 rounded-xl text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => console.log("File selezionato per i test:", e.target.files[0])}
                  />
                  <p className="text-xs text-gray-400 mt-1">L'upload reale richiede l'attivazione di Firebase Storage.</p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition mt-4 flex justify-center items-center ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
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
