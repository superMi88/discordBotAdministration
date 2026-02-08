const helper = require("./helper.js");
var ObjectId = require('mongodb').ObjectId;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const log = require("./log.js");
const dataManager = require("./dataManager.js");
const DatabaseManager = require("./DatabaseManager.js");

//Jeder Bot hat einen eigenen PluginManager
class PluginManager {


	allPlugins = undefined

    constructor() {
    }
	async createPluginManager(botId, db, client){
		this.allPlugins = await helper.getPluginFromBot(botId, db, client)
	}

	//bekommt alle Plugins
	getAll(){
		return this.allPlugins
	}

	//bekomme ein Plugin
	get(pluginId){
		return this.allPlugins.find(element => element.id == pluginId)
	}

	//teste ob ein Plugin im PluginManager exestiert
	exist(pluginId){
		if(this.get(pluginId) === undefined){
			return false
		}
		return true
	}

	//fügt ein Plugin zum Plugin Manager hinzu, es wird nur hinzugefügt, kein ausführen von execute funktionen usw.
	add(plugin){
		this.allPlugins.push(plugin)
	}

	//lösche ein Plugin vollständig, Datenbank, eventListener, Crownjobs
	async delete(pluginId, client){

		let plugin = this.get(pluginId)

        //remove registered Plugin eventListeners
        if(plugin.eventListener){
            plugin.eventListener.forEach(listenerObject => {
                client.off(listenerObject.eventName, listenerObject.eventFunction)
            });
        }

        //remove registered Plugin cronJobs
        if(plugin.cronJob){
            plugin.cronJob.forEach(cronJob => {
                cronJob.stop()
            });
        }

        //remove Plugin from pluginlist
        const index = this.allPlugins.indexOf(plugin)
        if (index > -1) { // only splice array when item is found
            this.allPlugins.splice(index, 1); // 2nd parameter means remove one item only
        }

	}


	//speichert ein Plugin ab wenn ein Cache file exestiert und fügt es zur Pluginliste hinzu wenn es erfolgreich war
	//TODO config wird nochnicht auf richtigkeit geprüft das sollte in der Zukunft gemacht werden
    async save(plugin, config) {

        let db = DatabaseManager.get()
        let client = dataManager.client

        const fs = require('fs');

        if(! fs.existsSync('./cache/bot-'+client.user.id+'/plugin-'+plugin.id+'.txt')){
            return { saved: true, infoMessage: "Schon auf dem neusten Stand", infoStatus: "Info" }
        }

        try {
            const str = fs.readFileSync('./cache/bot-'+client.user.id+'/plugin-'+plugin.id+'.txt', 'utf8');
            var obj = JSON.parse(str);
        } catch (err) {
            console.error(err);
        }

        const collection = db.collection('pluginCollection');
        var ObjectId = require('mongodb').ObjectId;

        let result = await collection.updateOne(
            { _id: ObjectId(plugin.id) },
            {
                $set: {
                    var: obj,
                    status: "saved"
                }
            }
        );

        try {
            fs.unlinkSync('./cache/bot-'+client.user.id+'/plugin-'+plugin.id+'.txt');
        } catch (err) {
            console.error(err);
        }
        //update plugin vars with the saved one in database
        //replace old vars with new
        let oldPlugin = await this.get(plugin.id)
        if(oldPlugin){
            oldPlugin['var'] = obj
        }else{
            console.log("ERROR: no old plugin")
        }
        
        return { saved: true, infoMessage: "Speichern Erfolgreich", infoStatus: "Info" }
    }

	//ruft addCommands für alle aktiven Plugins auf und sendet diese and Discord
    async reloadSlashCommands() {

        var client = dataManager.client
        var token = dataManager.token

        let commandMap = new Map()

        //add commands from each plugin
        for (const plugin of this.allPlugins) {
            if(plugin.logic.addCommands){
                await plugin.logic.addCommands(plugin, commandMap)
            }
        }

        let commands = commandMap

        if (commands.size > 0) {

            const rest = new REST({ version: "9" }).setToken(token);

            

            commands.forEach((commandArray, serverId) => {

                rest.put(Routes.applicationGuildCommands(client.user.id, serverId), { body: commandArray })
                    .then((r) => {
                        log.write("Slash commands are registerd")
                    })
                    .catch((e) => {
                        log.write("Error in Slash commands register")
                        console.error(e)
                    });

            })

        }

    }

    //ruft addEvents für alle aktiven Plugins auf und sendet diese and Discord
    async reloadEvents() {

        var client = dataManager.client

        let eventsArray = []

        //add commands from each plugin
        for (const plugin of this.allPlugins) {
            if(plugin.logic.addEvents){
                await plugin.logic.addEvents(plugin, eventsArray)
            }
        }

        process.send({
			manager: "addEvent",
			botId: client.user.id,
			/*pluginId: plugin.id,*/
			events: eventsArray
		}) 

    }

}

module.exports = new PluginManager();