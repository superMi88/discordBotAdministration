const PluginManager = require("../../../discordBot/lib/PluginManager.js");

module.exports = async function (client, plugin, config, projectAlias, data) {
    const running = [];
    if (plugin.processes) {
        for (const [file, proc] of Object.entries(plugin.processes)) {
            if (proc && !proc.killed) {
                running.push(file);
            }
        }
    }
    return { runningProcesses: running };
}
