const fs = require('fs');
const path = require('path');
const PluginManager = require("../lib/PluginManager.js");
const dataManager = require("../lib/dataManager.js");
const botManager = require("../libIndex/botManager.js");

module.exports = {
    async execute(ipc, data, socket) {
        const payload = data?.data || data || {};
        const pluginTag = payload.pluginTag || data.pluginTag;
        const apiEndpoint = payload.apiEndpoint || data.apiEndpoint;
        const pluginId = payload.pluginId || data.pluginId;

        // Case 1: Called from parent process index.js (ipc is the IPC server instance)
        if (ipc && ipc.server && typeof ipc.server.emit === 'function') {
            const bots = botManager.getAllBots();

            if (!bots || bots.length === 0) {
                const res = { success: false, botOnline: false, error: 'Discord-Bot ist aktuell nicht erreichbar.' };
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
                            resolve({ success: false, botOnline: false, error: 'Bot-Prozess Antwort Timeout.' });
                        }, 10000);

                        const handler = (msg) => {
                            if (msg && typeof msg === 'object' && msg.command === 'pluginApi') {
                                clearTimeout(timeout);
                                child.removeListener('message', handler);
                                resolve(msg.result);
                            }
                        };

                        child.on('message', handler);
                        child.send({ command: 'pluginApi', data: payload });
                    });

                    if (botResult && (botResult.success || botResult.status === 'ok')) {
                        break;
                    }
                }
            }

            const finalRes = botResult || { success: false, botOnline: false, error: 'Discord-Bot ist aktuell nicht erreichbar.' };
            if (socket) {
                ipc.server.emit(socket, 'NodeProcessResponse', finalRes);
            }
            return finalRes.success || false;
        }

        // Case 2: Called inside child process (discordBot.js) where first parameter is botStruct
        const botStruct = ipc;
        const client = botStruct ? botStruct.client : dataManager.client;
        const projectAlias = botStruct ? botStruct.projectAlias : '';

        const allPlugins = PluginManager.getAll();
        let pluginInstance = null;

        if (allPlugins && allPlugins.length > 0) {
            if (pluginId) {
                pluginInstance = allPlugins.find(p => p.id === pluginId || p._id?.toString() === pluginId.toString());
            }
            if (!pluginInstance && pluginTag) {
                pluginInstance = allPlugins.find(p => p.pluginTag === pluginTag || (p.name && p.name.toLowerCase() === pluginTag.toLowerCase()));
            }
        }

        if (!pluginInstance) {
            return {
                command: 'pluginApi',
                result: { success: false, botOnline: true, error: `Plugin '${pluginTag || pluginId}' im Bot nicht gefunden oder inaktiv.` }
            };
        }

        const tag = pluginInstance.pluginTag || pluginTag;
        const reqData = payload.data !== undefined ? payload.data : payload;

        // Path to API file inside the plugin folder: plugins/<pluginTag>/api/<apiEndpoint>.js
        const apiPath = path.join(__dirname, '../../plugins', tag, 'api', apiEndpoint + '.js');

        if (fs.existsSync(apiPath)) {
            try {
                if (require.cache[require.resolve(apiPath)]) {
                    delete require.cache[require.resolve(apiPath)];
                }
                const apiModule = require(apiPath);
                let config = null;
                const configPath = path.join(__dirname, '../../plugins', tag, 'config.js');
                if (fs.existsSync(configPath)) {
                    config = require(configPath);
                }

                let response;
                if (typeof apiModule === 'function') {
                    response = await apiModule(client, pluginInstance, config, projectAlias, reqData);
                } else if (typeof apiModule.execute === 'function') {
                    response = await apiModule.execute(client, pluginInstance, config, projectAlias, reqData);
                } else {
                    response = { success: false, error: 'API endpoint ist keine Funktion.' };
                }

                return {
                    command: 'pluginApi',
                    result: {
                        botOnline: true,
                        ...response
                    }
                };
            } catch (err) {
                console.error(`[pluginApi] Fehler bei Ausführung von Endpoint ${apiEndpoint} in Plugin ${tag}:`, err);
                return {
                    command: 'pluginApi',
                    result: { success: false, botOnline: true, error: err.message || 'Fehler im Plugin-API-Endpoint.' }
                };
            }
        }

        // Fallback: Check if function exists directly on plugin logic (e.g. plugin.logic[apiEndpoint])
        if (pluginInstance.logic && typeof pluginInstance.logic[apiEndpoint] === 'function') {
            try {
                const response = await pluginInstance.logic[apiEndpoint](client, pluginInstance, reqData);
                return {
                    command: 'pluginApi',
                    result: {
                        botOnline: true,
                        ...response
                    }
                };
            } catch (err) {
                console.error(`[pluginApi] Fehler bei Ausführung von logic.${apiEndpoint} in Plugin ${tag}:`, err);
                return {
                    command: 'pluginApi',
                    result: { success: false, botOnline: true, error: err.message }
                };
            }
        }

        return {
            command: 'pluginApi',
            result: { success: false, botOnline: true, error: `API-Endpoint '${apiEndpoint}' für Plugin '${tag}' nicht gefunden.` }
        };
    }
};
