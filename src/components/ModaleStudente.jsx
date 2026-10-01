import React from 'react';
import { X, UserPlus, Tag, ShieldCheck, MessageCircle, Mail, Sparkles } from 'lucide-react';
import { TARIFFE_STANDARD } from '../utils/tariffeConfig';

export default function ModaleStudente({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEditing
}) {
  if (!isOpen) return null;

  const recapitoTelefono = formData.genitoreTelefono || formData.telefono || '';
  const recapitoEmail = formData.genitoreEmail || formData.email || '';

  const handleInviaWhatsApp = () => {
    const tel = recapitoTelefono.replace(/\D/g, '');
    if (!tel) {
      alert("Inserisci prima il numero di telefono del genitore o dello studente.");
      return;
    }
    const numeroCompleto = tel.startsWith('39') ? tel : `39${tel}`;
    const nomeStudente = formData.nome ? `${formData.nome} ${formData.cognome || ''}`.trim() : 'tuo figlio/a';
    const linkApp = typeof window !== 'undefined' ? window.location.origin : 'https://fuoriclasse.vercel.app';
    
    const messaggio = `Ciao! Ti diamo il benvenuto a FuoriClasse 📚\n\nAbbiamo attivato il profilo per *${nomeStudente}*.\nPer visualizzare il calendario lezioni, consultare il saldo ore e impostare i promemoria, puoi accedere alla nostra Web App da questo link:\n${linkApp}\n\nSe è il tuo primo accesso, utilizza questo indirizzo email per impostare la tua password personale tramite 'Primo Accesso / Password dimenticata'. A presto!`;

    window.open(`https://wa.me/${numeroCompleto}?text=${encodeURIComponent(messaggio)}`, '_blank');
  };

  const handleInviaEmail = () => {
    if (!recapitoEmail) {
      alert("Inserisci prima l'indirizzo email del genitore o dello studente.");
      return;
    }
    const nomeStudente = formData.nome ? `${formData.nome} ${formData.cognome || ''}`.trim() : 'lo studente';
    const linkApp = typeof window !== 'undefined' ? window.location.origin : 'https://fuoriclasse.vercel.app';
    const oggetto = `Benvenuto a FuoriClasse - Accesso e Profilo di ${nomeStudente}`;
    const corpo = `Gentile Genitore,\n\nTi diamo il benvenuto a FuoriClasse!\n\nAbbiamo attivato il profilo per ${nomeStudente}.\nPer visualizzare il calendario lezioni, consultare lo stato del plafond ore e salvare le preferenze per le notifiche, puoi collegarti alla nostra piattaforma web all'indirizzo:\n${linkApp}\n\nAl primo accesso ti basterà cliccare su 'Primo Accesso / Password dimenticata' inserendo questo indirizzo email (${recapitoEmail}) per impostare la tua password personale.\n\nRestiamo a disposizione per qualsiasi chiarimento.\n\nCordiali saluti,\nLa Segreteria di FuoriClasse`;

    window.location.href = `mailto:${recapitoEmail}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(corpo)}`;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Se lo studente era contrassegnato come provvisorio, la compilazione della scheda lo formalizza
    if (formData.isProvvisorio) {
      setFormData(prev => ({ ...prev, isProvvisorio: false }));
    }
    onSave(e);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-amber-500"/>
            <h3 className="font-extrabold text-lg text-slate-900">
              {isEditing ? 'Modifica Studente' : 'Nuovo Iscritto FuoriClasse'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Avviso se il profilo è provvisorio / ospite */}
        {formData.isProvvisorio && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0"/>
              <div>
                <p className="text-xs font-black">Allievo Registrato al Volo (Prova)</p>
                <p className="text-[10px] text-amber-800">Completa i dati del genitore e salva per renderlo un allievo effettivo.</p>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              Provvisorio
            </span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Dati Base Studente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Nome Studente</label>
              <input
                type="text"
                required
                value={formData.nome || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Cognome</label>
              <input
                type="text"
                required
                value={formData.cognome || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Data di Nascita</label>
              <input
                type="date"
                value={formData.dataNascita || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dataNascita: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Scuola / Classe</label>
              <input
                type="text"
                placeholder="es. 2° Media Galilei"
                value={formData.scuola || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, scuola: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* INQUADRAMENTO TARIFFARIO & MARKETING */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-amber-600"/>
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Inquadramento Tariffario</h4>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Categoria Scolastica (Tariffa Base)</label>
              <select
                value={formData.categoriaTariffaria || 'medie'}
                onChange={(e) => setFormData(prev => ({ ...prev, categoriaTariffaria: e.target.value }))}
                className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-slate-900 focus:outline-none"
              >
                {Object.values(TARIFFE_STANDARD).filter(t => t.id !== 'gruppo').map(tar => (
                  <option key={tar.id} value={tar.id}>
                    {tar.label} — {tar.prezzoOrarioDefault.toFixed(2)} €/h
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox Tariffa Riservata */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.haTariffaRiservata)}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    haTariffaRiservata: e.target.checked,
                    tariffaRiservataValore: e.target.checked ? (prev.tariffaRiservataValore || 20) : ''
                  }))}
                  className="rounded text-amber-500 w-4 h-4"
                />
                <span className="font-extrabold text-slate-900">Applica Tariffa Riservata (Accordo / Sconto Speciale)</span>
              </label>

              {formData.haTariffaRiservata && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Prezzo Concordato (€/h)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={formData.tariffaRiservataValore || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tariffaRiservataValore: e.target.value }))}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-black text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-950 uppercase mb-1">Motivo / Tipo Accordo</label>
                    <input
                      type="text"
                      placeholder="es. Sconto fratelli / 40h anticipate"
                      value={formData.tariffaRiservataMotivo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tariffaRiservataMotivo: e.target.value }))}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dati Genitore Referente (Intestatario Quietanza Fiscale) */}
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-sky-700"/>
              <h4 className="font-black text-sky-950 text-xs uppercase tracking-wider">Intestatario Pagamenti (Genitore)</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-sky-900 uppercase mb-1">Nome e Cognome Genitore</label>
                <input
                  type="text"
                  placeholder="Mario Rossi"
                  value={formData.genitoreNome || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genitoreNome: e.target.value }))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-sky-900 uppercase mb-1">Codice Fiscale Genitore</label>
                <input
                  type="text"
                  placeholder="RSSMRA80A01H501U"
                  value={formData.genitoreCodiceFiscale || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genitoreCodiceFiscale: e.target.value.toUpperCase() }))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl font-bold text-slate-900 uppercase focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-sky-900 uppercase mb-1">Telefono Genitore</label>
                <input
                  type="tel"
                  value={formData.genitoreTelefono || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genitoreTelefono: e.target.value }))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-sky-900 uppercase mb-1">Email Genitore (per ricevute e app)</label>
                <input
                  type="email"
                  value={formData.genitoreEmail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genitoreEmail: e.target.value }))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* SEZIONE INVITO RAPIDO WHATSAPP ED EMAIL */}
            <div className="pt-2 border-t border-sky-200/60 space-y-1.5">
              <label className="block text-[10px] font-black text-sky-900 uppercase">
                Invio Accesso & Istruzioni Password
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleInviaWhatsApp}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5"/> Invia WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleInviaEmail}
                  className="w-full py-2 px-3 bg-sky-700 hover:bg-sky-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <Mail className="w-3.5 h-3.5"/> Invia Email
                </button>
              </div>
              <p className="text-[9px] text-sky-700 leading-tight">
                Genera un messaggio formattato con link all'app e istruzioni per configurare la password.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm"
            >
              Salva Scheda Studente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
