const path = require('path');
const fs = require('fs');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const worldPath = path.join(targetFolderPath, 'world');

    if (fs.existsSync(worldPath)) {
        fs.rmSync(worldPath, { recursive: true, force: true });
        return { saved: true, infoMessage: "Welt erfolgreich gelöscht", infoStatus: "Info" };
    } else {
        return { saved: false, infoMessage: "Welt-Ordner existiert nicht", infoStatus: "Warning" };
    }
}
