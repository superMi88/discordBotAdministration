const PluginManager = require("../lib/PluginManager.js");
const dataManager = require("../lib/dataManager.js");
const botManager = require("../libIndex/botManager.js");

module.exports = {
    async execute(ipc, data, socket) {
        const payload = data?.data || data || {};
        const { discordUserId, pluginId } = payload;

        // Case 1: Called from parent process index.js (ipc is the IPC server instance)
        if (ipc && ipc.server && typeof ipc.server.emit === 'function') {
            const bots = botManager.getAllBots();

            if (!bots || bots.length === 0) {
                const res = { success: false, botOnline: false, error: 'Discord Bot ist aktuell nicht erreichbar.' };
                if (socket) {
                    ipc.server.emit(socket, 'NodeProcessResponse', res);
                }
                return false;
            }

            let botResult = null;
            for (const child of bots) {
                if (child && !child.killed) {
                    botResult = await new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve({ success: false, botOnline: false, error: 'Bot Prozess Antwort Timeout.' });
                        }, 10000);

                        const handler = (msg) => {
                            if (msg && typeof msg === 'object' && msg.command === 'getBirthday') {
                                clearTimeout(timeout);
                                child.removeListener('message', handler);
                                resolve(msg.result);
                            }
                        };

                        child.on('message', handler);
                        child.send({ command: 'getBirthday', data: payload });
                    });

                    if (botResult && botResult.success) {
                        break;
                    }
                }
            }

            const finalRes = botResult || { success: false, botOnline: false, error: 'Discord Bot ist aktuell nicht erreichbar.' };
            if (socket) {
                ipc.server.emit(socket, 'NodeProcessResponse', finalRes);
            }
            return finalRes.success || false;
        }

        // Case 2: Called inside child process (discordBot.js) where first parameter is botStruct
        const botStruct = ipc;
        const client = botStruct ? botStruct.client : dataManager.client;

        if (!discordUserId) {
            return {
                command: 'getBirthday',
                result: { success: false, botOnline: true, error: 'Nutzer-ID fehlt.' }
            };
        }

        const allPlugins = PluginManager.getAll();
        let targetPlugin = null;

        if (allPlugins && allPlugins.length > 0) {
            if (pluginId) {
                targetPlugin = allPlugins.find(p => p.id === pluginId || p._id?.toString() === pluginId.toString());
            }
            if (!targetPlugin) {
                targetPlugin = allPlugins.find(p => p.pluginTag === 'birthday' || (p.name && p.name.toLowerCase() === 'birthday'));
            }
        }

        if (targetPlugin && targetPlugin.logic && typeof targetPlugin.logic.getBirthdayForUser === 'function') {
            try {
                const res = await targetPlugin.logic.getBirthdayForUser(client, targetPlugin, discordUserId);
                return {
                    command: 'getBirthday',
                    result: {
                        ...res,
                        botOnline: true
                    }
                };
            } catch (pErr) {
                console.error("[getBirthday] Fehler im Birthday-Plugin:", pErr);
                return {
                    command: 'getBirthday',
                    result: { success: false, botOnline: true, error: pErr.message || 'Fehler beim Abrufen aus dem Birthday-Plugin.' }
                };
            }
        }

        return {
            command: 'getBirthday',
            result: { success: false, botOnline: true, error: 'Birthday-Plugin auf dem Bot nicht aktiv.' }
        };
    }
};
