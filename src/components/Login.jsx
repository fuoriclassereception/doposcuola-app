import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore('');
    setCaricamento(true);

    try {
      if (isLogin) {
        // ACCESSO
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // REGISTRAZIONE
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Salva il ruolo "genitore" nel database
        await setDoc(doc(db, 'utenti', user.uid), {
          nome: nome,
          email: email,
          ruolo: 'genitore', // Di default chi si registra qui è genitore
          dataCreazione: new Date()
        });
      }
    } catch (err) {
      console.error(err);
      setErrore("Errore: controlla le credenziali o la password (minimo 6 caratteri).");
    } finally {
      setCaricamento(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center">FuoriClasse</h1>
        <p className="text-gray-500 text-center mb-8">
          {isLogin ? 'Accedi al tuo account' : 'Registra un account genitore'}
        </p>

        {errore && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium">{errore}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome e Cognome</label>
              <input 
                type="text" required 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={nome} onChange={(e) => setNome(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" required 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" required 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={caricamento}
            className={`w-full text-white font-bold py-3 rounded-lg transition ${caricamento ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {caricamento ? 'Attendi...' : (isLogin ? 'Accedi' : 'Registrati')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Non hai un account? " : "Hai già un account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrore(''); }}
            className="text-blue-600 font-bold hover:underline focus:outline-none"
          >
            {isLogin ? 'Registrati qui' : 'Accedi qui'}
          </button>
        </div>
      </div>
    </div>
  );
}
