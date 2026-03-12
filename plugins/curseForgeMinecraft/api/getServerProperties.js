const path = require('path');
const fs = require('fs');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const serverPropertiesPath = path.join(targetFolderPath, 'server.properties');

    if (!fs.existsSync(serverPropertiesPath)) {
        return { content: "# File not found", infoMessage: "server.properties noch nicht erstellt.", infoStatus: "Warning" };
    }

    try {
        const content = fs.readFileSync(serverPropertiesPath, 'utf8');
        return { content: content, infoMessage: "Server Properties geladen.", infoStatus: "Info" };
    } catch (err) {
        console.error("Error reading server.properties:", err);
        return { content: "", infoMessage: "Fehler beim Lesen der Datei.", infoStatus: "Error" };
    }
}
