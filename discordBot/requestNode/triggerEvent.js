module.exports = {
	async execute(botStruct, data) {

        //erstelle PluginManager
        const PluginManager = require("../lib/PluginManager.js");
        const DatabaseManager = require("../lib/DatabaseManager.js");
    
        let allPlugins = PluginManager.getAll()

		for (let i = 0; i < allPlugins.length; i++) {
            const pluginOne = allPlugins[i];

            for (let j = 0; j < data.pluginIdArray.length; j++) {
                const pluginObj = data.pluginIdArray[j];

                if(pluginOne.id == pluginObj.pluginId){

                    if (pluginObj.type == "event"){
                        await pluginOne.logic.triggerEvent(botStruct.client, pluginOne, DatabaseManager.db, data.discordUserId, data.currencyId, data.oldValue, data.newValue)
                    }
                }
                
            }
            
        }

        return true
	}
};