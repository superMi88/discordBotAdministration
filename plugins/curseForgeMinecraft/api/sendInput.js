const path = require('path');
const fs = require('fs');
const PluginManager = require("../../../discordBot/lib/PluginManager.js");

module.exports = async function (client, plugin, config, projectAlias, data) {
    const { filename, input } = data;

    if (!filename) {
        return { saved: false, infoMessage: "No file specified.", infoStatus: "Error" };
    }

    if (!plugin.processes || !plugin.processes[filename] || plugin.processes[filename].killed) {
        return { saved: false, infoMessage: `No running process for ${filename}`, infoStatus: "Error" };
    }

    // Allow empty input for "Enter" key
    // if (!input) {
    //    return { saved: false, infoMessage: "Empty command.", infoStatus: "Error" };
    // }

    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const logFile = path.join(targetFolderPath, `console_${filename}.txt`);

    try {
        // Log input to file so it appears in console view
        try {
            fs.appendFileSync(logFile, `> ${input}\n`);
        } catch (e) { }

        const success = plugin.processes[filename].stdin.write(input + '\r\n');
        if (!success) {
            console.warn("Stdin buffer full, unexpected.");
        }
        return { saved: true, infoMessage: `Sent: ${input}`, infoStatus: "Info" };
    } catch (err) {
        console.error("Error sending input:", err);
        return { saved: false, infoMessage: "Error sending input.", infoStatus: "Error" };
    }
}
