const path = require('path');
const fs = require('fs');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const { content } = data;
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const serverPropertiesPath = path.join(targetFolderPath, 'server.properties');

    // Ensure folder exists (it should)
    if (!fs.existsSync(targetFolderPath)) {
        return { saved: false, infoMessage: "Server folder does not exist.", infoStatus: "Error" };
    }

    try {
        fs.writeFileSync(serverPropertiesPath, content, 'utf8');
        return { saved: true, infoMessage: "server.properties gespeichert.", infoStatus: "Info" };
    } catch (err) {
        console.error("Error writing server.properties:", err);
        return { saved: false, infoMessage: "Fehler beim Speichern der Datei.", infoStatus: "Error" };
    }
}
