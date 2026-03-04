const fs = require('fs');
const path = require('path');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);

    if (!fs.existsSync(targetFolderPath)) {
        return { files: [] };
    }

    try {
        const files = await fs.promises.readdir(targetFolderPath);
        const executableExtensions = ['.sh', '.ps1', '.bat'];

        const executables = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return executableExtensions.includes(ext);
        });

        return { files: executables };
    } catch (err) {
        console.error("Error identifying executables:", err);
        return { files: [], error: err.message };
    }
}
