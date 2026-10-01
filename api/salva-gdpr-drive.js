// File: api/salva-gdpr-drive.js
import { google } from 'googleapis';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Metodo non consentito' });
  }

  const { pdfBase64, nomeFile, studenteNome, studenteCognome } = req.body;

  if (!pdfBase64 || !nomeFile) {
    return res.status(400).json({ success: false, message: 'Dati incompleti' });
  }

  try {
    const FOLDER_ID = '1sTRha9amzSEJldxgGduvP_M-xqix8-HF';

    // Se hai inserito le credenziali Service Account nelle variabili d'ambiente su Vercel:
    // GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      const drive = google.drive({ version: 'v3', auth });

      const buffer = Buffer.from(pdfBase64.split(',')[1] || pdfBase64, 'base64');
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata = {
        name: nomeFile,
        parents: [FOLDER_ID]
      };

      const media = {
        mimeType: 'application/pdf',
        body: stream
      };

      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      return res.status(200).json({
        success: true,
        driveFileId: file.data.id,
        driveLink: file.data.webViewLink
      });
    }

    // Modalità fallback se non hai ancora collegato le credenziali Service Account
    return res.status(200).json({
      success: true,
      fallback: true,
      message: 'PDF generato. Configurare GOOGLE_SERVICE_ACCOUNT_EMAIL su Vercel per l\'archiviazione automatica.'
    });

  } catch (error) {
    console.error("Errore salvataggio Google Drive:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
