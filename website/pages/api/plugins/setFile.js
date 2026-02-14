import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { database } from '@/lib/database'; // Angenommene Import-Pfad für die Datenbank
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

const options = {
  keepExtensions: true, // Behält die Dateiendung bei (z.B. .zip)
  maxFileSize: 5 * 1024 * 1024 * 1024,       // 5 GB für einzelne Datei
  maxTotalFileSize: 5 * 1024 * 1024 * 1024,  // 5 GB insgesamt
  allowEmptyFiles: true,
  minFileSize: 0,
};

export default async (req, res) => {
  console.log("⏳ Start Upload-Request");

  const form = new IncomingForm(options);

  form.parse(req, async (err, fields, files) => {
    console.log("📥 Request parsed");

    if (err) {
      if (err.code === 1009) {
        console.error("❌ Datei zu groß");
        return res.status(413).json({ message: 'Die Datei ist zu groß. Maximal erlaubt: 5 GB.' });
      }
      if (err.code === 1012) {
        console.error("❌ Upload abgebrochen (Code 1012)");
        return res.status(400).json({ message: 'Upload wurde abgebrochen.', code: 1012 });
      }
      if (err.code === 1016) {
        console.error("❌ Fehler beim Parsen: Unexpected end of form (Code 1016)");
        return res.status(400).json({ message: 'Upload fehlerhaft (unvollständig).', code: 1016 });
      }
      console.error("❌ Fehler beim Parsen:", err);
      return res.status(500).json({ message: 'Fehler beim Verarbeiten der Datei', error: err, code: err.code });
    }

    console.log("📦 Felder erhalten:", fields);
    console.log("📁 Dateien erhalten:", files);

    const isChunked = fields.chunkIndex !== undefined && fields.totalChunks !== undefined;
    // Korrektur: files.file ist ein Array, nimm das erste Element
    const part = Array.isArray(files.file) ? files.file[0] : files.file;
    const originalName = fields.originalName?.[0] || (part?.originalFilename ?? '');

    const uploadDir = path.join(
      process.cwd(),
      '..',
      'uploads',
      fields.projectAlias?.[0],
      fields.botId?.[0],
      fields.pluginId?.[0]
    );

    console.log("📂 Upload-Pfad:", uploadDir);

    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    } catch (mkdirErr) {
      console.error("❌ Fehler beim Erstellen des Upload-Ordners:", mkdirErr);
      return res.status(500).json({ message: 'Fehler beim Anlegen des Upload-Ordners', error: mkdirErr });
    }

    if (isChunked) {
      const idx = parseInt(fields.chunkIndex?.[0] || fields.chunkIndex, 10);
      const total = parseInt(fields.totalChunks?.[0] || fields.totalChunks, 10);
      const chunkPath = path.join(uploadDir, `${originalName}.part${idx}`);

      console.log(`📤 Chunk-Upload: Index ${idx} / ${total - 1}`);

      try {
        await fs.promises.rename(part.filepath, chunkPath);
        console.log(`✅ Chunk ${idx} gespeichert: ${chunkPath}`);
      } catch (renameErr) {
        console.error(`❌ Fehler beim Speichern von Chunk ${idx}:`, renameErr);
        return res.status(500).json({ message: `Fehler beim Speichern von Chunk ${idx}`, error: renameErr });
      }

      if (idx + 1 === total) {
        console.log("📚 Alle Chunks empfangen – Zusammenfügen startet...");
        const finalPath = path.join(uploadDir, originalName);
        const writeStream = fs.createWriteStream(finalPath);

        try {
          for (let i = 0; i < total; i++) {
            const partPath = path.join(uploadDir, `${originalName}.part${i}`);
            const data = await fs.promises.readFile(partPath);
            writeStream.write(data);
            await fs.promises.unlink(partPath);
            console.log(`🧩 Chunk ${i} zusammengefügt und gelöscht`);
          }
          writeStream.end();
          console.log("✅ Upload erfolgreich abgeschlossen:", finalPath);

          return res.status(200).json({ message: 'Upload komplett', filename: originalName });
        } catch (combineErr) {
          console.error("❌ Fehler beim Zusammenfügen der Chunks:", combineErr);
          return res.status(500).json({ message: 'Fehler beim Zusammenfügen der Datei', error: combineErr });
        }
      }

      return res.status(200).json({ message: `Chunk ${idx} empfangen` });
    } else {
      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!uploadedFile) {
        console.error("❌ Keine Datei erhalten");
        return res.status(400).json({ message: 'Keine Datei hochgeladen' });
      }

      const imgPath = uploadedFile.filepath;
      const name = fields.name?.[0];
      const fieldnameToUpdate = fields.fieldnameToUpdate?.[0];
      const textId = fields.textId?.[0];
      const pluginId = fields.pluginId?.[0];

      const ext = path.extname(uploadedFile.originalFilename || '') || '.zip';
      const fileName = `${fieldnameToUpdate}${ext}`;
      const targetPath = path.join(uploadDir, fileName);

      try {
        fs.renameSync(imgPath, targetPath);
        console.log("✅ Einzeldaten-Upload abgeschlossen:", targetPath);
        return res.status(200).json({ message: 'Datei erfolgreich hochgeladen', filename: fileName });
      } catch (moveError) {
        console.error("❌ Fehler beim Verschieben:", moveError);
        return res.status(500).json({ message: 'Fehler beim Verschieben der Datei', error: moveError });
      }
    }
  });
};
