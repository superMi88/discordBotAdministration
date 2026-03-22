const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const unzipper = require('unzipper');
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

        // ZIP Validation and Opening with unzipper
        const directory = await unzipper.Open.file(sourcePath);
        const entries = directory.files;
        if (entries.length === 0) {
            throw new Error("ZIP-Datei enthält keine Einträge.");
        }

        const rootFolder = entries[0].path.split('/')[0];

        for (let i = 0; i < entries.length; i++) {
            const file = entries[i];
            let relativePath = file.path;

            // Logik zum Entfernen des Root-Ordners
            if (relativePath.startsWith(rootFolder + '/')) {
                relativePath = relativePath.slice(rootFolder.length + 1);
            } else if (relativePath === rootFolder || relativePath === rootFolder + '/') {
                continue;
            }

            if (!relativePath) continue;

            const fullPath = path.join(targetFolderPath, relativePath);

            if (file.type === 'Directory') {
                await fsp.mkdir(fullPath, { recursive: true });
            } else {
                await fsp.mkdir(path.dirname(fullPath), { recursive: true });
                // Streaming extraction to avoid memory issues with large files
                await new Promise((resolve, reject) => {
                    file.stream()
                        .pipe(fs.createWriteStream(fullPath))
                        .on('finish', resolve)
                        .on('error', reject);
                });
            }

            // Update Progress
            plugin.extractionProgress = Math.round(((i + 1) / entries.length) * 100);

            // Allow event loop to breathe
            if (i % 10 === 0) {
                await new Promise(resolve => setImmediate(resolve));
            }
        }

        // Reset progress when done
        delete plugin.extractionProgress;

        // Speichere Setup-Status
        plugin.var = { ...plugin.var, setupComplete: true };

        // Schreibe Änderungen in Cache-Datei, damit PluginManager.save sie übernimmt
        const cacheDir = `./cache/bot-${client.user.id}`;
        const cacheFile = `${cacheDir}/plugin-${plugin.id}.txt`;

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        fs.writeFileSync(cacheFile, JSON.stringify(plugin.var));

        await PluginManager.save(plugin, config);

        console.log("ZIP-Datei wurde erfolgreich mit unzipper entpackt.");

        return { saved: true, infoMessage: "Entpacken erfolgreich", infoStatus: "Info" };
    } catch (err) {
        console.error("Fehler beim Entpacken der Datei (unzipper): ", err);
        delete plugin.extractionProgress;
        return { saved: false, infoMessage: "Fehler beim Entpacken: " + err.message, infoStatus: "Error" };
    }
}
