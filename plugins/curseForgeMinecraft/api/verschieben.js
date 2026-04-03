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

        // ZIP Validation
        let directory;
        try {
            directory = await unzipper.Open.file(sourcePath);
            if (directory.files.length === 0) {
                throw new Error("ZIP-Datei enthält keine Einträge.");
            }
        } catch (err) {
            throw new Error("Die ZIP-Datei ist ungültig oder beschädigt: " + err.message);
        }

        const entries = directory.files;
        const rootFolder = entries[0].path.split('/')[0];

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            let relativePath = entry.path;
            if (relativePath.startsWith(rootFolder + '/')) {
                relativePath = relativePath.slice(rootFolder.length + 1);
            }
            if (!relativePath) continue;

            const fullPath = path.join(targetFolderPath, relativePath);

            if (entry.type === 'Directory') {
                fs.mkdirSync(fullPath, { recursive: true });
            } else {
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                await new Promise((resolve, reject) => {
                    entry.stream()
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

        console.log("ZIP-Datei wurde erfolgreich entpackt.");

        return { saved: true, infoMessage: "Entpacken erfolgreich", infoStatus: "Info" };
    } catch (err) {
        console.error("Fehler beim Entpacken der Datei: ", err);
        return { saved: false, infoMessage: "Fehler beim Entpacken: " + err.message, infoStatus: "Error" };
    }
}

