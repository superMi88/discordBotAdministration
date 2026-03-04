const fs = require('fs');
const helper = require("../lib/helper.js");
const PluginManager = require('../lib/PluginManager.js');
const path = require('path');

module.exports = {

    async execute(ipc, clientExtendedInfos, data, socket, createClient, db) {

        let pluginId = data.data.pluginId;
        let apiEndpoint = data.data.apiEndpoint;

        let allPlugins = PluginManager.getAll()
        let pluginDatabase = PluginManager.get(pluginId)

        let response = { status: "error", message: "Unknown error" };
        let client = clientExtendedInfos.client

        if (!pluginDatabase) {
            let botId = clientExtendedInfos.clientId

            pluginDatabase = await helper.getPluginFromDatabaseOrCacheIfExist(botId, pluginId)
            pluginDatabase = helper.addWrapperForPlugin(pluginDatabase)

            pluginDatabase.logic = require('../../plugins/' + data.data.pluginTag + '/plugin.js');

            //execute plugin execute function to start plugin
            try {
                if (pluginDatabase.logic && typeof pluginDatabase.logic.execute === 'function') {
                    await pluginDatabase.logic.execute(
                        clientExtendedInfos.client,
                        pluginDatabase,
                        clientExtendedInfos.projectAlias
                    )
                }
            } catch (e) {
                console.log("Error executing plugin logic on init", e)
            }

            PluginManager.add(pluginDatabase)
        }

        if (pluginDatabase) {
            let pluginTag = pluginDatabase.pluginTag || data.data.pluginTag;

            // Construct path to API file
            // We are in discordBot/request/pluginApi.js
            let apiPath = path.join(__dirname, '../../plugins', pluginTag, 'api', apiEndpoint + '.js');

            if (fs.existsSync(apiPath)) {
                try {
                    if (require.cache[require.resolve(apiPath)]) {
                        delete require.cache[require.resolve(apiPath)];
                    }
                    const apiModule = require(apiPath);

                    let config = null;
                    let configPath = path.join(__dirname, '../../plugins', pluginTag, 'config.js');
                    if (fs.existsSync(configPath)) {
                        config = require(configPath);
                    }

                    // Execute
                    // Signature: async (client, plugin, config, projectAlias, data)
                    if (typeof apiModule === 'function') {
                        response = await apiModule(client, pluginDatabase, config, clientExtendedInfos.projectAlias, data.data);
                    } else if (typeof apiModule.execute === 'function') {
                        response = await apiModule.execute(client, pluginDatabase, config, clientExtendedInfos.projectAlias, data.data);
                    } else {
                        response = { status: "error", message: "API endpoint is not a function" };
                    }

                } catch (err) {
                    console.error("Error executing API endpoint:", err);
                    response = { status: "error", message: "Error executing API endpoint: " + err.message };
                }
            } else {
                response = { status: "error", message: "API endpoint not found: " + apiEndpoint };
            }
        } else {
            response = { status: "error", message: "Plugin not found" };
        }

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                response: response
            }
        );

    }
};
