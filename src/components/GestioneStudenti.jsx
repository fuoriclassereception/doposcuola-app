import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  MessageCircle, 
  Mail, 
  FileText, 
  User, 
  School, 
  Phone, 
  Euro,
  KeyRound
} from 'lucide-react';

export default function GestioneStudenti() {
  const [studenti, setStudenti] = useState([]);
  const [filtroRicerca, setFiltroRicerca] = useState('');
  const [studenteSelezionato, setStudenteSelezionato] = useState(null);
  const [showModalNuovo, setShowModalNuovo] = useState(false);
  const [showModalScheda, setShowModalScheda] = useState(false);

  // Form nuovo studente
  const [nuovoStudente, setNuovoStudente] = useState({
    nome: '',
    cognome: '',
    scuola: 'elementare',
    genitoreNome: '',
    genitoreTelefono: '',
    genitoreEmail: '',
    studenteTelefono: '',
    studenteEmail: '',
    totaleVersato: 0,
    totaleConsumato: 0,
    categoriaTariffaria: 'elementari',
    isMinorenne: true,
    attivo: true
  });

  // Caricamento studenti in tempo reale
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'studenti'), (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a.cognome || '').localeCompare(b.cognome || ''));
      setStudenti(lista);
    });
    return () => unsub();
  }, []);

  // Filtro ricerca
  const studentiFiltrati = studenti.filter(s => {
    const query = filtroRicerca.toLowerCase();
    const nomeCompleto = `${s.nome || ''} ${s.cognome || ''}`.toLowerCase();
    const genitore = `${s.genitoreNome || ''} ${s.genitoreEmail || ''}`.toLowerCase();
    return nomeCompleto.includes(query) || genitore.includes(query);
  });

  // Aggiungi nuovo studente
  const handleCreaStudente = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'studenti'), {
        ...nuovoStudente,
        totaleVersato: Number(nuovoStudente.totaleVersato) || 0,
        totaleConsumato: 0,
        totalePattuito: 0,
        storicoRicariche: [],
        gdprConfermato: false,
        dataIscrizione: serverTimestamp()
      });
      setShowModalNuovo(false);
      setNuovoStudente({
        nome: '',
        cognome: '',
        scuola: 'elementare',
        genitoreNome: '',
        genitoreTelefono: '',
        genitoreEmail: '',
        studenteTelefono: '',
        studenteEmail: '',
        totaleVersato: 0,
        totaleConsumato: 0,
        categoriaTariffaria: 'elementari',
        isMinorenne: true,
        attivo: true
      });
      alert('✅ Studente registrato con successo!');
    } catch (err) {
      console.error('Errore creazione studente:', err);
      alert('Errore durante la registrazione.');
    }
  };

  // Aggiorna dati studente dalla scheda
  const handleSalvaModificheScheda = async (e) => {
    e.preventDefault();
    try {
      const refDoc = doc(db, 'studenti', studenteSelezionato.id);
      await updateDoc(refDoc, {
        nome: studenteSelezionato.nome || '',
        cognome: studenteSelezionato.cognome || '',
        scuola: studenteSelezionato.scuola || '',
        genitoreNome: studenteSelezionato.genitoreNome || '',
        genitoreTelefono: studenteSelezionato.genitoreTelefono || '',
        genitoreEmail: studenteSelezionato.genitoreEmail || '',
        studenteTelefono: studenteSelezionato.studenteTelefono || '',
        studenteEmail: studenteSelezionato.studenteEmail || '',
        totaleVersato: Number(studenteSelezionato.totaleVersato) || 0,
        totaleConsumato: Number(studenteSelezionato.totaleConsumato) || 0
      });
      setShowModalScheda(false);
      alert('✅ Dati studente aggiornati con successo!');
    } catch (err) {
      console.error('Errore aggiornamento:', err);
      alert('Errore durante il salvataggio.');
    }
  };

  // Elimina studente
  const handleEliminaStudente = async (id, nome) => {
    if (window.confirm(`Sei sicuro di voler eliminare definitivamente il profilo di ${nome}?`)) {
      try {
        await deleteDoc(doc(db, 'studenti', id));
      } catch (err) {
        console.error('Errore eliminazione:', err);
        alert('Impossibile eliminare il profilo.');
      }
    }
  };

  // Iniziali per Avatar
  const getIniziali = (nome = '', cognome = '') => {
    return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase() || 'ST';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER E BARRA SUPERIORE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            👨‍🎓 Gestione Allievi & GDPR
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Anagrafica studenti, stato del consenso privacy, saldi plafond e contatti.
          </p>
        </div>
        <button
          onClick={() => setShowModalNuovo(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Nuovo Studente
        </button>
      </div>

      {/* BARRA DI RICERCA */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cerca per nome studente, cognome, genitore o email..."
          value={filtroRicerca}
          onChange={(e) => setFiltroRicerca(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* GRIGLIA CARD STUDENTI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {studentiFiltrati.map((std) => {
          const versato = Number(std.totaleVersato || 0);
          const consumato = Number(std.totaleConsumato || 0);
          const saldo = versato - consumato;

          return (
            <div 
              key={std.id} 
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Badge di stato alto */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    {getIniziali(std.nome, std.cognome)}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 leading-snug">
                      {std.nome} {std.cognome}
                    </h3>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase mt-0.5">
                      {std.scuola || 'Scuola'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase">
                  {std.attivo !== false ? 'Iscritto' : 'Archiviato'}
                </span>
              </div>

              {/* Box Plafond e Saldo */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 my-3 text-center">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Plafond</p>
                  <p className="text-xs font-black text-slate-700">€ {versato.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Consumato</p>
                  <p className="text-xs font-black text-slate-700">€ {consumato.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Saldo</p>
                  <p className={`text-xs font-black ${saldo < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {saldo > 0 ? '+' : ''}€ {saldo.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Contatti Genitore e Studente */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl space-y-1">
                  <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    Genitore: {std.genitoreNome || 'Non specificato'}
                  </p>
                  {std.genitoreTelefono && (
                    <p className="text-[11px] text-amber-800 pl-5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-600" /> {std.genitoreTelefono}
                    </p>
                  )}
                  {std.genitoreEmail && (
                    <p className="text-[11px] text-amber-800 pl-5 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-amber-600 shrink-0" /> {std.genitoreEmail}
                    </p>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Contatto Studente:
                  </p>
                  <p className="text-[11px] text-slate-500 pl-5 truncate">
                    📞 {std.studenteTelefono || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 pl-5 truncate">
                    ✉️️ {std.studenteEmail || '-'}
                  </p>
                </div>
              </div>

              {/* STATO GDPR CON TASTO SCARICA PDF */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  {std.gdprConfermato ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GDPR Firmato
                      </span>
                      {std.gdprPdfUrl && (
                        <a
                          href={std.gdprPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 text-[10px] font-bold transition shadow-sm"
                          title="Visualizza e scarica modulo PDF"
                        >
                          <FileText className="w-3 h-3 text-blue-600" /> Scarica PDF
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> GDPR In attesa di firma
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <KeyRound className="w-3 h-3 text-slate-400" />
                  {std.appAttivata ? 'App Attivata' : 'App Non ancora attivata'}
                </div>
              </div>

              {/* BOTTONI AZIONI */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100">
                {std.genitoreTelefono ? (
                  <a
                    href={`https://wa.me/39${std.genitoreTelefono.replace(/\s+/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition text-[11px] font-black gap-1"
                    title="WhatsApp Genitore"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WA
                  </a>
                ) : (
                  <button disabled className="opacity-40 p-2 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-black">WA</button>
                )}

                {std.genitoreEmail ? (
                  <a
                    href={`mailto:${std.genitoreEmail}`}
                    className="flex items-center justify-center p-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl transition text-[11px] font-black gap-1"
                    title="Invia Email"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                ) : (
                  <button disabled className="opacity-40 p-2 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-black">Email</button>
                )}

                <button
                  onClick={() => handleEliminaStudente(std.id, `${std.nome} ${std.cognome}`)}
                  className="flex items-center justify-center p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition text-[11px] font-black"
                  title="Elimina Allievo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setStudenteSelezionato(std);
                    setShowModalScheda(true);
                  }}
                  className="flex items-center justify-center p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition text-[11px] font-black gap-1"
                  title="Apri Scheda Completa"
                >
                  <Eye className="w-3.5 h-3.5" /> Scheda
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODALE NUOVO STUDENTE */}
      {showModalNuovo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black text-slate-800">Nuovo Allievo FuoriClasse</h2>
              <button onClick={() => setShowModalNuovo(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreaStudente} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Nome Studente *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50"
                    value={nuovoStudente.nome}
                    onChange={(e) => setNuovoStudente({ ...nuovoStudente, nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Cognome Studente *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50"
                    value={nuovoStudente.cognome}
                    onChange={(e) => setNuovoStudente({ ...nuovoStudente, cognome: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Grado Scolastico</label>
                <input
                  type="text"
                  placeholder="Es. Primaria, Medie, Superiore..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  value={nuovoStudente.scuola}
                  onChange={(e) => setNuovoStudente({ ...nuovoStudente, scuola: e.target.value })}
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <p className="text-[11px] font-black text-amber-900 uppercase">Dati Esercente Responsabilità (Genitore)</p>
                <div>
                  <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Nome e Cognome Genitore</label>
                  <input
                    type="text"
                    placeholder="Es. Matteo Petrocchi"
                    className="w-full p-2.5 border border-amber-200 rounded-xl text-xs bg-white"
                    value={nuovoStudente.genitoreNome}
                    onChange={(e) => setNuovoStudente({ ...nuovoStudente, genitoreNome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Cellulare Genitore</label>
                    <input
                      type="tel"
                      placeholder="340..."
                      className="w-full p-2.5 border border-amber-200 rounded-xl text-xs bg-white"
                      value={nuovoStudente.genitoreTelefono}
                      onChange={(e) => setNuovoStudente({ ...nuovoStudente, genitoreTelefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Email Genitore (Accesso App)</label>
                    <input
                      type="email"
                      required
                      placeholder="genitore@gmail.com"
                      className="w-full p-2.5 border border-amber-200 rounded-xl text-xs bg-white"
                      value={nuovoStudente.genitoreEmail}
                      onChange={(e) => setNuovoStudente({ ...nuovoStudente, genitoreEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Ricarica Iniziale Plafond (€)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                  value={nuovoStudente.totaleVersato}
                  onChange={(e) => setNuovoStudente({ ...nuovoStudente, totaleVersato: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition mt-2"
              >
                Crea Profilo Studente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE SCHEDA DETTAGLIATA ("APRI SCHEDA") */}
      {showModalScheda && studenteSelezionato && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black text-slate-800">
                Scheda Allievo: {studenteSelezionato.nome} {studenteSelezionato.cognome}
              </h2>
              <button onClick={() => setShowModalScheda(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSalvaModificheScheda} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                    value={studenteSelezionato.nome || ''}
                    onChange={(e) => setStudenteSelezionato({ ...studenteSelezionato, nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Cognome</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                    value={studenteSelezionato.cognome || ''}
                    onChange={(e) => setStudenteSelezionato({ ...studenteSelezionato, cognome: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Scuola Frequentata</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  value={studenteSelezionato.scuola || ''}
                  onChange={(e) => setStudenteSelezionato({ ...studenteSelezionato, scuola: e.target.value })}
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <p className="text-[10px] font-black text-amber-900 uppercase">Dati Esercente Responsabilità (Genitore)</p>
                <div>
                  <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Nome Genitore</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-amber-200 rounded-xl text-xs bg-white"
                    value={studenteSelezionato.genitoreNome || ''}
                    onChange={(e) => setStudenteSelezionato({ ...studenteSelezionato, genitoreNome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Cellulare Genitore</label>
                    <input
                      type="tel"
                      className="w-full p-2 border border-amber-200 rounded-xl text-xs bg-white"
                      value={studenteSelezionato.genitoreTelefono || ''}
                      onChange={(e) => setStudenteSelezionato({ ...studenteSelezionato, genitoreTelefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Email Genitore</label>
                    <input
                      type="email"
                      className="w-full p-2 border border-amber-200 rounded-xl text-xs bg-white"
                      value={studenteSelezionato.genitoreEmail || ''}
                      onChange={(e) => setStudenteSelezionato({ ...studenteSelezionato, genitoreEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Totale Versato (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                    value={studenteSelezionato.totaleVersato || 0}
                    onChange={(e) => setStudenteSelezionato({ ...studenteSelezionato, totaleVersato: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Totale Consumato (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                    value={studenteSelezionato.totaleConsumato || 0}
                    onChange={(e) => setStudenteSelezionato({ ...studenteSelezionato, totaleConsumato: e.target.value })}
                  />
                </div>
              </div>

              {/* BOX DOCUMENTALE GDPR & DOWNLOAD PDF */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Modulo Privacy & GDPR
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {studenteSelezionato.gdprConfermato 
                      ? `Firmato da: ${studenteSelezionato.gdprEmailFirmatario || 'Genitore'}`
                      : 'Nessun consenso registrato per questo allievo'}
                  </p>
                </div>
                {studenteSelezionato.gdprPdfUrl ? (
                  <a
                    href={studenteSelezionato.gdprPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1"
                  >
                    Apri PDF
                  </a>
                ) : (
                  <span className="text-[11px] text-amber-600 font-bold">Non disponibile</span>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalScheda(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
