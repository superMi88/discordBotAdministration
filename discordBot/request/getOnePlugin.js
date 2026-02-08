
const fs = require('fs');
const helper = require("../lib/helper.js");

module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        let botId = botStruct.clientId
        let pluginObj = await helper.getPluginFromDatabaseOrCacheIfExist(botId, data.data.pluginId)
        
        //TODO ersetze _id durch id oder pluginId
        //filteredDocs.id = filteredDocs._id.toString()
        //delete filteredDocs['_id']

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "get One Plugin From Server",
                data: pluginObj
            }
        );
        
	}
};