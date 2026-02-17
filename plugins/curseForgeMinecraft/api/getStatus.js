const PluginManager = require("../../../discordBot/lib/PluginManager.js");

module.exports = async function (client, plugin, config, projectAlias, data) {
    if (plugin.mcProcess && !plugin.mcProcess.killed) {
        return { status: "Online" };
    } else {
        return { status: "Offline" };
    }
}
