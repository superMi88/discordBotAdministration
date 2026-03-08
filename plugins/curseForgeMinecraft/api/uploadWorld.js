const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const AdmZip = require('adm-zip');
const PluginManager = require("../../../discordBot/lib/PluginManager.js");

module.exports = async function (client, plugin, config, projectAlias, data) {
    let status = await PluginManager.save(plugin, config);
    if (!status.saved) {
        return status;
    }

    if (!plugin.var.worldFile) {
        return { saved: false, infoMessage: "Keine Datei als Welt ausgewählt. Bitte lade erst eine Datei hoch.", infoStatus: "Error" };
    }

    const fileName = plugin.var.worldFile;
    const sourcePath = path.join(__dirname, '../../../', 'uploads', projectAlias, plugin.botId, plugin.id, fileName);
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const worldPath = path.join(targetFolderPath, 'world');

    try {
        await fsp.access(sourcePath);

        if (fs.existsSync(worldPath)) {
            fs.rmSync(worldPath, { recursive: true, force: true });
        }

        let zip;
        try {
            zip = new AdmZip(sourcePath);
        } catch (err) {
            throw new Error("Die ZIP-Datei ist ungültig oder beschädigt.");
        }

        let entries = zip.getEntries();
        if (entries.length === 0) throw new Error("ZIP-Datei ist leer.");

        const firstEntryPart = entries[0].entryName.split('/')[0];
        const hasRootFolder = entries.every(e => e.entryName.startsWith(firstEntryPart + '/'));

        fs.mkdirSync(worldPath, { recursive: true });

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            let relativePath = entry.entryName;

            if (hasRootFolder && firstEntryPart) {
                relativePath = relativePath.slice(firstEntryPart.length + 1);
            }
            if (!relativePath) continue;

            const fullPath = path.join(worldPath, relativePath);

            if (entry.isDirectory) {
                fs.mkdirSync(fullPath, { recursive: true });
            } else {
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, entry.getData());
            }

            // Update Progress
            plugin.extractionProgress = Math.round(((i + 1) / entries.length) * 100);

            // Allow event loop to process other requests (e.g. getStatus)
            if (i % 5 === 0) {
                await new Promise(resolve => setImmediate(resolve));
            }
        }

        // Reset progress when done
        delete plugin.extractionProgress;

        return { saved: true, infoMessage: "Welt erfolgreich hochgeladen und entpackt", infoStatus: "Info" };
    } catch (err) {
        console.error("Fehler beim Welt-Upload:", err);
        return { saved: false, infoMessage: "Fehler beim Welt-Upload: " + err.message, infoStatus: "Error" };
    }
}
