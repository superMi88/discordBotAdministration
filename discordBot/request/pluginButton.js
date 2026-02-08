//execute a plugin button action

const fs = require('fs');
const helper = require("../lib/helper.js");
const PluginManager = require('../lib/PluginManager.js');

module.exports = {

    async execute(ipc, clientExtendedInfos, data, socket, createClient, db) {

        //sucht Plugin aus den vorhandenen Plugins raus

        /*
        let allPlugins = PluginManager.getAll()
        let pluginDatabase = allPlugins.find(element => element.id == data.data.pluginId)
        */
        //TODO: should work the same
        let allPlugins = PluginManager.getAll()

        let pluginDatabase = PluginManager.get(data.data.pluginId)

        let response = ""

        let client = clientExtendedInfos.client
        

        //Wenn es kein Plugin gibt ist es neu und und muss neu geladen werden(execute function ausführen etc)
        if(!pluginDatabase){

            let botId = clientExtendedInfos.clientId

            //let get plugin Data and wrapper
            pluginDatabase = await helper.getPluginFromDatabaseOrCacheIfExist(botId, data.data.pluginId)
            pluginDatabase = helper.addWrapperForPlugin(pluginDatabase)

            //add Plugin logic
            pluginDatabase.logic = require('../plugins/' + data.data.pluginTag + '/plugin.js'); //test über neues Object

            //execute plugin execute function to start plugin
            response = await pluginDatabase.logic["execute"](
                clientExtendedInfos.client, 
                pluginDatabase,
                clientExtendedInfos.projectAlias //projectAlias
            )
            
            //add Plugin to Plugin Manager
            PluginManager.add(pluginDatabase)
        }

        if(pluginDatabase){
            let plugin = require(`../plugins/${data.data.pluginTag}/plugin.js`);

            //old -> config dont exist
            let config = null

            if (fs.existsSync(`./plugins/${data.data.pluginTag}/config.js`)) {
                //new way
                config = require(`../plugins/${data.data.pluginTag}/config.js`);
            }



            response = await plugin[data.data.onClick](
                pluginDatabase, 
                config,
                clientExtendedInfos.projectAlias //projectAlias
            )
        
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