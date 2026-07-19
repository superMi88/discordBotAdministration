const PluginManager = require("../lib/PluginManager.js");
const dataManager = require("../lib/dataManager.js");

module.exports = {
    async execute(ipc, data, socket) {
        try {
            const discordUserId = data.data ? data.data.discordUserId : data.discordUserId;
            const client = dataManager.client;

            if (!client || !discordUserId) {
                if (socket) {
                    ipc.server.emit(socket, 'NodeProcessResponse', { success: false, error: 'Client or userId missing' });
                }
                return false;
            }

            const allPlugins = PluginManager.getAll();
            if (!allPlugins || allPlugins.length === 0) {
                if (socket) {
                    ipc.server.emit(socket, 'NodeProcessResponse', { success: true, count: 0 });
                }
                return true;
            }

            let member = null;
            // Iterate over client guilds to find the target member
            for (const guild of client.guilds.cache.values()) {
                try {
                    member = await guild.members.fetch(discordUserId);
                    if (member) break;
                } catch (e) {
                    // Member not in this guild, check next
                }
            }

            if (!member) {
                console.warn(`[userVerified] Nutzer ${discordUserId} konnte in den Guilds nicht gefunden werden.`);
                if (socket) {
                    ipc.server.emit(socket, 'NodeProcessResponse', { success: false, error: 'Member not found on guild' });
                }
                return false;
            }

            console.log(`[userVerified] Führe Verifizierungs-Plugins für ${member.user.tag} (${member.id}) aus...`);

            for (const plugin of allPlugins) {
                if (plugin.logic && typeof plugin.logic.onUserVerified === 'function') {
                    try {
                        await plugin.logic.onUserVerified(client, plugin, member);
                    } catch (pluginErr) {
                        console.error(`[userVerified] Fehler beim Ausführen von Plugin ${plugin.name || plugin.id}:`, pluginErr);
                    }
                }
            }

            if (socket) {
                ipc.server.emit(socket, 'NodeProcessResponse', { success: true, verifiedUser: discordUserId });
            }
            return true;
        } catch (error) {
            console.error("[userVerified] Execution error:", error);
            if (socket) {
                ipc.server.emit(socket, 'NodeProcessResponse', { success: false, error: error.message });
            }
            return false;
        }
    }
};
