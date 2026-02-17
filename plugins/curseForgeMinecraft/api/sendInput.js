const PluginManager = require("../../../discordBot/lib/PluginManager.js");

module.exports = async function (client, plugin, config, projectAlias, data) {
    if (!plugin.mcProcess || plugin.mcProcess.killed) {
        return { saved: false, infoMessage: "No running process to send input to.", infoStatus: "Error" };
    }

    const { input } = data; // "stop", "op user", "setup_yes", etc.

    if (!input) {
        return { saved: false, infoMessage: "Empty command.", infoStatus: "Error" };
    }

    try {
        const success = plugin.mcProcess.stdin.write(input + '\r\n');
        if (!success) {
            console.warn("Stdin buffer full, unexpected.");
        }
        return { saved: true, infoMessage: `Sent: ${input}`, infoStatus: "Info" };
    } catch (err) {
        console.error("Error sending input:", err);
        return { saved: false, infoMessage: "Error sending input.", infoStatus: "Error" };
    }
}
