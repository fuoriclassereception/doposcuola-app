// File: api/invito.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Metodo non consentito' });
  }

  const { email, nomeStudente, linkApp } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Indirizzo email mancante' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'fuoriclasse.reception@gmail.com',
        pass: 'ssnbbnnfpwhurwbi'
      }
    });

    const urlPiattaforma = linkApp || 'https://fuoriclasse.vercel.app';
    const allievo = nomeStudente || 'tuo figlio/a';

    const mailOptions = {
      from: '"FuoriClasse Segreteria" <fuoriclasse.reception@gmail.com>',
      to: email,
      subject: `📚 Benvenuto a FuoriClasse - Accesso e Profilo di ${allievo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
          <div style="background-color: #0f172a; padding: 25px; text-align: center;">
            <h1 style="color: #fbbf24; margin: 0; font-size: 24px; font-weight: 900;">📚 FuoriClasse</h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 5px 0 0 0;">Area Riservata Genitori & Allievi</p>
          </div>
          
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Gentile Famiglia, 👋</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Vi confermiamo che il profilo didattico per <b>${allievo}</b> è attivo presso la nostra struttura.
            </p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Attraverso la nostra Web App potrete verificare il calendario delle lezioni in tempo reale, controllare il saldo del vostro plafond ore e ricevere i promemoria automatici.
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #334155; font-weight: bold;">
                Email di accesso: <span style="color: #2563eb;">${email}</span>
              </p>
              <a href="${urlPiattaforma}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 8px;">
                🚀 Accedi alla Piattaforma
              </a>
            </div>

            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.4;">
                <b>Primo accesso?</b> Nella schermata di login cliccate su <i>"Primo Accesso / Password dimenticata"</i> inserendo questo indirizzo email per scegliere la vostra password personale.
              </p>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
              Per ogni informazione o variazione oraria, la nostra segreteria resta sempre a vostra completa disposizione.<br><br>
              A presto,<br>
              <b>Il Team di FuoriClasse</b>
            </p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
              Questa è un'email automatica generata da FuoriClasse Gestione Didattica.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Email inviata con successo' });

  } catch (error) {
    console.error("Errore invio email invito:", error);
    return res.status(500).json({ success: false, message: 'Errore durante la spedizione' });
  }
}
