const helper = require("../lib/helper.js");
var ObjectId = require('mongodb').ObjectId;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const log = require("../lib/log.js");

const BotManager = require('./botManager');

class EventManager {

	obj = {}; 

    constructor() {
        if (!EventManager.instance) {
            EventManager.instance = this;
        }
        return EventManager.instance;
    }

	async addEvents(events, botId) {
		this.obj[botId] = events
	}

    async triggerEvent(triggerPluginId, currencyId, discordUserId, oldValue, newValue) {

		
		//checks if the Plugin who triggered this event is registered correctly
		if(! triggerIsRegistered(this.obj, triggerPluginId, currencyId)) throw new Error("Trigger is not registered!!")

		for (const [botId, pluginArray] of Object.entries(this.obj)) {
			
			//TODO: holds Objects with Ids not only Ids -> rename
			let pluginIdArray = []

			for(let pluginObj of pluginArray){
				if(pluginObj.type == "event" && pluginObj.variable == currencyId){
					pluginIdArray.push(pluginObj)
				}
			}

			if(pluginIdArray.length > 0){
				BotManager.getBot(botId).send({
					command: "triggerEvent",
					pluginIdArray: pluginIdArray,
					currencyId: currencyId,
					oldValue: oldValue,
					newValue: newValue,
					discordUserId: discordUserId
				})
			}
		}

    }

	
	async getEvent( db){
		return this.obj
	}
}

const instance = new EventManager();
module.exports = instance;


function triggerIsRegistered(obj, triggerPluginId, currencyId){

	for (const [botId, pluginArray] of Object.entries(obj)) {
		//sucht das richtige object raus was triggert, testes ob es vom typ trigger ist und ob die richtige currencyId verändert wird
		if( pluginArray.some((obj) => (obj.pluginId === triggerPluginId && obj.type === 'trigger' && obj.variable == currencyId)) ){
			return true
		}
	}
	return false
}