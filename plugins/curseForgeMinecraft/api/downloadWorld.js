const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const worldPath = path.join(targetFolderPath, 'world');

    if (!fs.existsSync(worldPath)) {
        return { saved: false, infoMessage: "Welt-Ordner existiert nicht", infoStatus: "Error" };
    }

    try {
        const publicUploads = path.join(__dirname, '../../../', 'website', 'public', 'uploads', projectAlias, plugin.botId, plugin.id);
        fs.mkdirSync(publicUploads, { recursive: true });

        const zipFile = path.join(publicUploads, 'world.zip');
        const zip = new AdmZip();
        zip.addLocalFolder(worldPath, "world");
        zip.writeZip(zipFile);

        const downloadUrl = `/uploads/${projectAlias}/${plugin.botId}/${plugin.id}/world.zip`;

        return { saved: true, url: downloadUrl, infoMessage: "Download-Datei erstellt", infoStatus: "Info" };
    } catch (err) {
        console.error("Fehler beim Welt-Download:", err);
        return { saved: false, infoMessage: "Fehler beim Erstellen der Zip-Datei: " + err.message, infoStatus: "Error" };
    }
}
