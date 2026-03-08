const fs = require('fs');
const path = require('path');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const worldPath = path.join(targetFolderPath, 'world');

    const exists = fs.existsSync(worldPath);

    return { worldExists: exists };
}
