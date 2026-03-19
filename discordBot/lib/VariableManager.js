/**
 * alternativer name CurrencyManager
 * 
 */
const helper = require("./helper.js");
var ObjectId = require('mongodb').ObjectId;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const log = require("./log.js");



/**
 * Benutzung:
 * 
 * VariableManager.addEvent(client, plugin,
 *  [
 *      VariableManager.create(EventType.Event, plugin['var'].chatActivity, "benachrichte mich wenn chat erhört wird"),
 *      VariableManager.create(EventType.Event, plugin['var'].voiceActivity, "benachrichte mich wenn voice erhört wird")
 *      VariableManager.create(EventType.Trigger, plugin['var'].money, "triggerEvent wenn Geld erhöht wird")
 *  ]
 * )
 * 
 * 
 */


//Jeder Bot hat einen eigenen EventManager
class VariableManager {

    Trigger = 'trigger' 
    Event = 'event' 

	obj = {}; 

    constructor() {
    }


    //Add Events from Array with different event types, //remove all preexisting events
    addEvent(client, plugin, eventsArray) {

        console.log("run addEvent in VariableManager(addEvent)")
		process.send({
			manager: "addEvent",
			botId: client.user.id,
			pluginId: plugin.id,
			events: eventsArray
		}) 

	}

    //create a new Object for the eventArray
    create(type, currencyId, infoMessage){
        return {
            currencyId: currencyId,
            type: type,
            infoMessage: infoMessage
        }
    }

    //wenn ein counter erhöht wird und die anderen Events werden entsprechend getriggert
    async counterAdd(discordUserId, activityCounter, counterId, db, plugin) {

        console.log("wird ausgeführt")

        if (isNaN(activityCounter)) return

        const UserData = require('./UserData.js');
        let discordUserData = await UserData.get(discordUserId);

        let oldValue = discordUserData.getCurrency(counterId);
        if (!oldValue) oldValue = 0;

        discordUserData.addCurrency(counterId, parseInt(activityCounter));
        
        // UserData.save() automatically manages triggering the events via process.send
        await discordUserData.save(plugin);

        return discordUserData.currencyData;
    }

}

module.exports = new VariableManager();


