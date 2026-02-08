const helper = require("../lib/helper.js");
var ObjectId = require('mongodb').ObjectId;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const log = require("../lib/log.js");

//Jeder Bot hat einen eigenen EventManager
class EventManager {

	obj = {}; 

    constructor() {
    }

	//addEvents to currency database if no array exists a new array will be createt
	//TODO: only add Events that are not added yet, and test for deletet events
	addEvent(client, plugin, eventsArray) {

		console.log("run addEvent in Eventmanager")
		process.send({
			manager: "addEvent",
			botId: client.user.id,
			pluginId: plugin.id,
			events: eventsArray
		}) 

	}

}

module.exports = new EventManager();

