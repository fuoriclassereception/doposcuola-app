import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email o password non validi.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Questa email è già registrata. Prova ad accedere.');
      } else {
        setError('Si è verificato un errore. Riprova.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Inserisci il tuo indirizzo email qui sopra e poi clicca su 'Password dimenticata'.");
      return;
    }
    
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Ti abbiamo inviato un'email con il link per reimpostare la tua password!");
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError("Nessun account trovato con questa email.");
      } else {
        setError("Errore durante l'invio dell'email. Verifica l'indirizzo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner rotate-3">
            <span className="text-3xl font-black text-slate-900 block -rotate-3">FC</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FuoriClasse</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Gestionale Didattico</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-black text-slate-800 mb-6 text-center">
            {isLogin ? 'Accedi al tuo account' : 'Crea un nuovo account'}
          </h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-bold">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  placeholder="es. mario.rossi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Password</label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={handleResetPassword}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Password dimenticata?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white font-black py-3.5 rounded-xl shadow-lg hover:bg-slate-800 transition-all mt-6 flex justify-center items-center gap-2"
            >
              {isLoading ? 'Attendere...' : (isLogin ? 'Entra in FuoriClasse' : 'Registrati')}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500 font-medium">
              {isLogin ? "Non hai ancora un account?" : "Hai già un account?"}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
                className="ml-2 font-black text-slate-900 hover:text-amber-600 transition-colors"
              >
                {isLogin ? 'Registrati ora' : 'Accedi'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
