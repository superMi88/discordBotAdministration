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

    const fileName = plugin.var.file;

    const sourcePath = path.join(__dirname, '../../../', 'uploads', projectAlias, plugin.botId, plugin.id, fileName);
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);

    // Ensure directories exist
    if (!fs.existsSync(targetFolderPath)) {
        fs.mkdirSync(targetFolderPath, { recursive: true });
    }

    try {
        console.log("Quellpfad:", sourcePath);
        console.log("Zielpfad Folder(nur fürs Entpacken):", targetFolderPath);

        // Access check
        await fsp.access(sourcePath);

        // ZIP Validation
        let zip;
        try {
            zip = new AdmZip(sourcePath);
            if (zip.getEntries().length === 0) {
                throw new Error("ZIP-Datei enthält keine Einträge.");
            }
        } catch (err) {
            throw new Error("Die ZIP-Datei ist ungültig oder beschädigt.");
        }

        const entries = zip.getEntries();
        const rootFolder = entries[0].entryName.split('/')[0];

        entries.forEach(entry => {
            let relativePath = entry.entryName;
            if (relativePath.startsWith(rootFolder + '/')) {
                relativePath = relativePath.slice(rootFolder.length + 1);
            }
            if (!relativePath) return;

            const fullPath = path.join(targetFolderPath, relativePath);

            if (entry.isDirectory) {
                fs.mkdirSync(fullPath, { recursive: true });
            } else {
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, entry.getData());
            }
        });

        console.log("ZIP-Datei wurde erfolgreich entpackt.");
        return { saved: true, infoMessage: "Entpacken erfolgreich", infoStatus: "Info" };
    } catch (err) {
        console.error("Fehler beim Entpacken der Datei: ", err);
        return { saved: false, infoMessage: "Fehler beim Entpacken: " + err.message, infoStatus: "Error" };
    }
}
