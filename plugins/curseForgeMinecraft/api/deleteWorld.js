const path = require('path');
const fs = require('fs');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const worldPath = path.join(targetFolderPath, 'world');

    let infoMessage = "Welt erfolgreich gelöscht";
    let infoStatus = "Info";

    if (fs.existsSync(worldPath)) {
        fs.rmSync(worldPath, { recursive: true, force: true });
    } else {
        infoMessage = "Welt-Ordner existiert nicht, aber Datei-Referenz wird entfernt.";
        infoStatus = "Warning";
    }

    // Lösche auch die ZIP Datei im uploads ordner, falls vorhanden
    if (plugin.var.worldFile) {
        const sourcePath = path.join(__dirname, '../../../', 'uploads', projectAlias, plugin.botId, plugin.id, plugin.var.worldFile);
        if (fs.existsSync(sourcePath)) {
            fs.rmSync(sourcePath, { force: true });
        }
    }

    plugin.var = { ...plugin.var, worldFile: "" };

    const cacheDir = `./cache/bot-${client.user.id}`;
    const cacheFile = `${cacheDir}/plugin-${plugin.id}.txt`;

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(plugin.var));

    const PluginManager = require("../../../discordBot/lib/PluginManager.js");
    await PluginManager.save(plugin, config);

    return { saved: true, infoMessage: infoMessage, infoStatus: infoStatus };
}
