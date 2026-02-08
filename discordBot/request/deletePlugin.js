
const fs = require('fs');

const dataManager = require("../lib/dataManager.js");
const PluginManager = require('../lib/PluginManager.js');

module.exports = {
	async execute(ipc, clientExtendedInfos, data, socket, createClient, db) {

        let client = clientExtendedInfos.client

        //warte bis der PluginManager das Plugin gelöscht hat
        await PluginManager.delete(data.data.pluginId, client)
        
        //reload SlashCommands, because maybe a slashCommand got removed
        PluginManager.reloadSlashCommands()

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                response: {}
            }
        );
        
	}
};