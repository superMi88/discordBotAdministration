const PluginManager = require("../lib/PluginManager.js");
const dataManager = require("../lib/dataManager.js");
const botManager = require("../libIndex/botManager.js");

module.exports = {
    async execute(ipc, data, socket) {
        // Case 1: Called from parent process index.js (ipc is the IPC server instance)
        if (ipc && ipc.server && typeof ipc.server.emit === 'function') {
            const bots = botManager.getAllBots();
            if (!bots || bots.length === 0) {
                if (socket) {
                    ipc.server.emit(socket, 'NodeProcessResponse', {
                        success: false,
                        error: 'Kein Discord Bot Prozess gestartet.'
                    });
                }
                return false;
            }

            let botResult = null;
            for (const child of bots) {
                if (child && !child.killed) {
                    botResult = await new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve({ success: false, error: 'Bot response timeout' });
                        }, 10000);

                        const handler = (msg) => {
                            if (msg && typeof msg === 'object' && msg.command === 'userVerified') {
                                clearTimeout(timeout);
                                child.removeListener('message', handler);
                                resolve(msg.result);
                            }
                        };

                        child.on('message', handler);
                        child.send({ command: 'userVerified', data: data.data || data });
                    });

                    if (botResult && botResult.success) {
                        break;
                    }
                }
            }

            if (socket) {
                ipc.server.emit(socket, 'NodeProcessResponse', botResult || {
                    success: false,
                    error: 'Rollenvergabe fehlgeschlagen oder Nutzer nicht gefunden.'
                });
            }
            return botResult?.success || false;
        }

        // Case 2: Called inside child process (discordBot.js) where first parameter is botStruct
        const botStruct = ipc;
        const client = botStruct ? botStruct.client : dataManager.client;
        const discordUserId = data?.data ? data.data.discordUserId : data?.discordUserId;

        if (!client || !discordUserId) {
            return {
                command: 'userVerified',
                result: { success: false, error: 'Client or userId missing' }
            };
        }

        const allPlugins = PluginManager.getAll();
        let verifyLinkPlugin = null;
        if (allPlugins && allPlugins.length > 0) {
            const pluginId = data?.data?.pluginId || data?.pluginId;
            if (pluginId) {
                verifyLinkPlugin = allPlugins.find(p => p.id === pluginId || p._id?.toString() === pluginId.toString());
            }
            if (!verifyLinkPlugin) {
                verifyLinkPlugin = allPlugins.find(p => p.pluginTag === 'verifyLink' || (p.name && p.name.toLowerCase() === 'verifylink'));
            }
        }

        if (verifyLinkPlugin && verifyLinkPlugin.logic && typeof verifyLinkPlugin.logic.verifyUser === 'function') {
            try {
                const res = await verifyLinkPlugin.logic.verifyUser(client, verifyLinkPlugin, discordUserId);
                return {
                    command: 'userVerified',
                    result: res
                };
            } catch (err) {
                console.error("[userVerified] Fehler im verifyLink-Plugin:", err);
                return {
                    command: 'userVerified',
                    result: { success: false, error: err.message || 'Fehler im verifyLink-Plugin.' }
                };
            }
        }

        // Fallback if verifyLink plugin logic not registered directly
        const members = [];
        for (const guild of client.guilds.cache.values()) {
            try {
                const m = await guild.members.fetch(discordUserId);
                if (m) members.push(m);
            } catch (e) {
                // Member not in this guild
            }
        }

        if (members.length === 0) {
            return {
                command: 'userVerified',
                result: { success: false, error: 'Nutzer wurde auf dem Discord-Server nicht gefunden. Bitte tritt dem Server bei.' }
            };
        }

        let pluginsSuccess = true;
        for (const member of members) {
            if (allPlugins && allPlugins.length > 0) {
                for (const plugin of allPlugins) {
                    if (plugin.logic && typeof plugin.logic.onUserVerified === 'function') {
                        try {
                            const pluginResult = await plugin.logic.onUserVerified(client, plugin, member);
                            if (pluginResult === false) {
                                pluginsSuccess = false;
                            }
                        } catch (pluginErr) {
                            console.error(`[userVerified] Fehler beim Ausführen von Plugin ${plugin.name || plugin.id}:`, pluginErr);
                            pluginsSuccess = false;
                        }
                    }
                }
            }
        }

        return {
            command: 'userVerified',
            result: {
                success: pluginsSuccess,
                verifiedUser: discordUserId,
                error: pluginsSuccess ? null : 'Rollenvergabe im Discord fehlgeschlagen.'
            }
        };
    }
};
