import React from 'react';
import { X, Save, Crown } from 'lucide-react';

export default function ModaleInsegnante({ isOpen, onClose, onSave, formData, setFormData, isEditing }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        
        <div className="bg-slate-900 p-6 flex justify-between items-center">
          <h2 className="text-xl font-black text-white">{isEditing ? 'Modifica Insegnante' : 'Nuovo Insegnante'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="w-6 h-6"/></button>
        </div>
        
        <form onSubmit={onSave} className="p-6 space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Nome</label>
                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Cognome</label>
                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.cognome} onChange={e => setFormData({...formData, cognome: e.target.value})} />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Materia Principale</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={formData.materia} onChange={e => setFormData({...formData, materia: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Colore Planning</label>
                <input type="color" className="w-full h-[46px] p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={formData.colore} onChange={e => setFormData({...formData, colore: e.target.value})} />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Telefono</label>
                <input type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Email (Accesso App)</label>
                <input type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-blue-600" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
           </div>

           {/* LA NUOVA SPUNTA PER L'ADMIN */}
           <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
             <label className="flex items-center gap-3 cursor-pointer">
               <input type="checkbox" className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 cursor-pointer" checked={formData.isCoordinatore || false} onChange={e => setFormData({...formData, isCoordinatore: e.target.checked})} />
               <div>
                 <span className="text-sm font-black text-amber-900 flex items-center gap-1"><Crown className="w-4 h-4"/> Coordinatore (Docente Admin)</span>
                 <p className="text-[10px] text-amber-700 font-medium leading-tight mt-0.5">Permette a questo docente di inserire ore per i colleghi e gruppi liberi.</p>
               </div>
             </label>
           </div>

           <div className="pt-4 flex justify-end">
             <button type="submit" className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-slate-800 transition flex items-center gap-2"><Save className="w-4 h-4"/> Salva Docente</button>
           </div>
        </form>
      </div>
    </div>
  );
}
