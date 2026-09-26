import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

export default function ModalePin({ isOpen, onClose, onSuccess, descrizione }) {
  const [pin, setPin] = useState('');
  const [errore, setErrore] = useState(false);
  const inputRef = useRef(null);
  const PIN_SEGRETO = "1234";

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrore(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConferma = () => {
    if (pin === PIN_SEGRETO) {
      onSuccess();
    } else {
      setErrore(true);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6"/>
        </div>
        <div>
          <h3 className="font-black text-lg text-slate-900">Autorizzazione Sicurezza</h3>
          <p className="text-xs text-gray-500 mt-1">{descrizione}</p>
        </div>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="password"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setErrore(false);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConferma(); }}
            className={`w-full text-center text-2xl tracking-widest font-black py-3 rounded-2xl border bg-gray-50 focus:outline-none ${
              errore ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-gray-200 text-slate-900'
            }`}
          />
          {errore && <p className="text-[11px] font-bold text-rose-600">PIN errato! (Suggerimento: 1234)</p>}
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
          >
            Annulla
          </button>
          <button
            onClick={handleConferma}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            Conferma PIN
          </button>
        </div>
      </div>
    </div>
  );
}
