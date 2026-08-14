const PluginManager = require("../lib/PluginManager.js");
const dataManager = require("../lib/dataManager.js");
const botManager = require("../libIndex/botManager.js");
const UserData = require("../../lib/UserData.js");

module.exports = {
    async execute(ipc, data, socket) {
        const payload = data?.data || data || {};
        const { discordUserId, pluginId, day, month, year } = payload;

        // Case 1: Called from parent process index.js (ipc is the IPC server instance)
        if (ipc && ipc.server && typeof ipc.server.emit === 'function') {
            const bots = botManager.getAllBots();

            let botResult = null;
            if (bots && bots.length > 0) {
                for (const child of bots) {
                    if (child && !child.killed) {
                        botResult = await new Promise((resolve) => {
                            const timeout = setTimeout(() => {
                                resolve({ success: false, error: 'Bot prozess antwortet nicht (Timeout).' });
                            }, 10000);

                            const handler = (msg) => {
                                if (msg && typeof msg === 'object' && msg.command === 'updateBirthday') {
                                    clearTimeout(timeout);
                                    child.removeListener('message', handler);
                                    resolve(msg.result);
                                }
                            };

                            child.on('message', handler);
                            child.send({ command: 'updateBirthday', data: payload });
                        });

                        if (botResult && botResult.success) {
                            break;
                        }
                    }
                }
            }

            // Fallback if no child bot handled it: update via DB directly with UserData
            if (!botResult || !botResult.success) {
                try {
                    let d = parseInt(day);
                    let m = parseInt(month);
                    let y = year ? parseInt(year) : false;

                    if (isNaN(d) || d < 1 || d > 31 || isNaN(m) || m < 1 || m > 12) {
                        botResult = { success: false, error: 'Ungültiger Tag (1-31) oder Monat (1-12).' };
                    } else {
                        let birthdayObj = { day: d, month: m };
                        if (y) {
                            if (isNaN(y) || y <= 1900 || y >= new Date().getFullYear()) {
                                botResult = { success: false, error: 'Ungültiges Geburtsjahr.' };
                            } else {
                                birthdayObj.year = y;
                            }
                        }

                        if (!botResult || botResult.success !== false) {
                            let userData = await UserData.get(discordUserId);
                            const key = pluginId ? `birthday-${pluginId}` : 'birthday';
                            userData.pluginData[key] = birthdayObj;
                            userData._modifiedPluginData.add(key);
                            await userData.save();
                            botResult = { success: true, birthday: birthdayObj };
                        }
                    }
                } catch (dbErr) {
                    console.error("[updateBirthday DB Fallback Error]:", dbErr);
                    botResult = { success: false, error: 'Fehler beim Speichern in der Datenbank.' };
                }
            }

            if (socket) {
                ipc.server.emit(socket, 'NodeProcessResponse', botResult);
            }
            return botResult?.success || false;
        }

        // Case 2: Called inside child process (discordBot.js) where first parameter is botStruct
        const botStruct = ipc;
        const client = botStruct ? botStruct.client : dataManager.client;

        if (!discordUserId) {
            return {
                command: 'updateBirthday',
                result: { success: false, error: 'Nutzer-ID fehlt.' }
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

        if (targetPlugin && targetPlugin.logic && typeof targetPlugin.logic.setBirthdayForUser === 'function') {
            try {
                const res = await targetPlugin.logic.setBirthdayForUser(client, targetPlugin, discordUserId, { day, month, year });
                return {
                    command: 'updateBirthday',
                    result: res
                };
            } catch (pErr) {
                console.error("[updateBirthday] Fehler im Birthday-Plugin:", pErr);
                return {
                    command: 'updateBirthday',
                    result: { success: false, error: pErr.message || 'Fehler beim Ausführen des Birthday-Plugins.' }
                };
            }
        }

        // If plugin is not active in child process, use UserData helper directly
        try {
            let d = parseInt(day);
            let m = parseInt(month);
            let y = year ? parseInt(year) : false;

            if (isNaN(d) || d < 1 || d > 31 || isNaN(m) || m < 1 || m > 12) {
                return {
                    command: 'updateBirthday',
                    result: { success: false, error: 'Ungültiger Tag (1-31) oder Monat (1-12).' }
                };
            }

            let birthdayObj = { day: d, month: m };
            if (y) {
                if (isNaN(y) || y <= 1900 || y >= new Date().getFullYear()) {
                    return {
                        command: 'updateBirthday',
                        result: { success: false, error: 'Ungültiges Geburtsjahr.' }
                    };
                }
                birthdayObj.year = y;
            }

            let userData = await UserData.get(discordUserId);
            const tagKey = pluginId ? `birthday-${pluginId}` : 'birthday';
            userData.pluginData[tagKey] = birthdayObj;
            userData._modifiedPluginData.add(tagKey);
            await userData.save();

            return {
                command: 'updateBirthday',
                result: { success: true, birthday: birthdayObj }
            };
        } catch (err) {
            console.error("[updateBirthday Error]:", err);
            return {
                command: 'updateBirthday',
                result: { success: false, error: 'Fehler beim Speichern.' }
            };
        }
    }
};
