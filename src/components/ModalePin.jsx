import React, { useState, useEffect, useRef } from 'react';
import { Lock, Delete, X, Check } from 'lucide-react';

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

  const handlePressNumber = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setErrore(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrore(false);
  };

  const handleConferma = () => {
    if (pin === PIN_SEGRETO) {
      onSuccess();
    } else {
      setErrore(true);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in duration-150 select-none">
        
        {/* Intestazione */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <Lock className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">Inserire PIN</h3>
              <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">{descrizione || 'Autorizzazione richiesta'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Display PIN con input nascosto/supportato anche per tastiera fisica */}
        <div className="relative">
          <input
            ref={inputRef}
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setErrore(false);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConferma(); }}
            placeholder="PIN"
            className={`w-full text-center text-2xl tracking-[0.3em] font-black py-2.5 rounded-2xl border bg-gray-50 focus:outline-none transition-all ${
              errore ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-gray-300 text-slate-900'
            }`}
          />
          {errore && (
            <p className="text-[11px] font-bold text-rose-600 text-center mt-1">
              PIN errato! Riprova (Default: 1234)
            </p>
          )}
        </div>

        {/* Tastierino Touch Reception (3x4) */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handlePressNumber(num.toString())}
              className="h-12 bg-gray-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-black text-xl rounded-2xl border border-gray-200 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}

          {/* Tasto 0 (occupa 2 colonne) */}
          <button
            type="button"
            onClick={() => handlePressNumber('0')}
            className="col-span-2 h-12 bg-gray-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-black text-xl rounded-2xl border border-gray-200 shadow-xs flex items-center justify-center transition-all cursor-pointer"
          >
            0
          </button>

          {/* Tasto Backspace / Cancella Cifra */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-bold rounded-2xl border border-rose-200 flex items-center justify-center transition-all cursor-pointer"
            title="Cancella cifra"
          >
            <Delete className="w-5 h-5"/>
          </button>
        </div>

        {/* Pulsante Conferma Touch Verde */}
        <button
          type="button"
          onClick={handleConferma}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4"/>
          <span>CONFERMA</span>
        </button>

      </div>
    </div>
  );
}
