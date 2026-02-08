/**
 * alternativer name CurrencyManager
 * 
 */
const helper = require("./helper.js");
var ObjectId = require('mongodb').ObjectId;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const log = require("./log.js");
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('./helper.js')


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

        let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

        //wurde kein user gefunden nicht ausführen
        if (discordUserDatabase) {

            //karma gewichtung des users der den command ausführt
            let counter = discordUserDatabase[counterId]

            if (!counter) counter = 0 // karmaWeighting != 0 weil 0 auch als undefined zählt
            
            const collection = db.collection('userCollection');

            let miau = await updateUserFromDatabase(db, discordUserId,
                {
                    $inc: {
                        ["currency." + counterId]: parseInt(activityCounter),	//add timestamp on last karma add
                    }
                }
            )

            let oldValue = miau.value.currency[counterId]
            let newValue = miau.value.currency[counterId] + parseInt(activityCounter)

            //undefined and null = 0
            if(!oldValue) oldValue = 0
            if(!newValue) newValue = 0 + parseInt(activityCounter)


            console.log("triggerEvent Auslöser: "+oldValue+" -> "+newValue)
            process.send({
                manager: "triggerEvent",
                triggerPluginId: plugin.id,
                discordUserId: discordUserId,
                currencyId: counterId,
                oldValue: oldValue,
                newValue: newValue
            })

        }
        return discordUserDatabase;
    }

}

module.exports = new VariableManager();


