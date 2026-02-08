import { createImage } from "../../../lib/app";
import { database } from '@/lib/database';
var ObjectId = require('mongodb').ObjectId;

export const config = {
  api: {
    bodyParser: false,
  },
};

const options = {
  keepExtensions: true,
};

export default async (req, res) => {
  const { IncomingForm } = require('formidable');
  const form = new IncomingForm(options);

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: 'Fehler beim Verarbeiten der Datei', error: err });
    }

    // Greife auf das erste Element des Array zu, falls files.file ein Array ist
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      return res.status(400).json({ message: 'Keine Datei hochgeladen' });
    }

    const imgPath = uploadedFile.filepath; // Temporärer Pfad
    let name = fields.name;
    let fieldnameToUpdate = fields.fieldnameToUpdate;
    let textId = fields.textId;
    let pluginId = fields.pluginId;

    let image;
    try {
      image = await bucketAddFile("ttezlowa", imgPath);
    } catch (uploadError) {
      return res.status(500).json({ message: 'Fehler beim Hochladen in den Bucket', error: uploadError.message });
    }

    res.status(200).json({ message: "Datei erfolgreich angelegt", filename: image });
  });
};

const { Storage } = require('@google-cloud/storage');
const serviceKey = '../../../../keys.json';

const storage = new Storage({
  keyFilename: serviceKey,
  public: true
});

// Lädt die Datei in den Bucket hoch und gibt den vollständigen Pfad zurück
async function bucketAddFile(bucket, filename) {
  let result = await storage.bucket(bucket).upload(filename, {
    metadata: { cacheControl: 'public, max-age=31536000' }
  });
  return bucket + "/" + result[0].metadata.name;
}
