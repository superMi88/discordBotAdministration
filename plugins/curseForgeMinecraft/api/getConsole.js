const path = require('path');
const fs = require('fs');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const LOG_FILE = path.join(targetFolderPath, 'console.txt');

    try {
        if (!fs.existsSync(LOG_FILE)) {
            return "No log file found.";
        }

        // Read file
        // For efficiency with large files, we might want to read only the end.
        // But for simplicity let's read it all and slice.
        const content = await fs.promises.readFile(LOG_FILE, 'utf-8');

        // Get last 2000 characters or last 50 lines
        // Let's do last 50 lines
        const lines = content.split('\n');
        const lastLines = lines.slice(-50).join('\n');

        return lastLines;
    } catch (err) {
        return `Error reading log: ${err.message}`;
    }
}
