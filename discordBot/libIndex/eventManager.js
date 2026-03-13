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

		if (!triggerIsRegistered(this.obj, triggerPluginId, currencyId)) {
			return;
		}

		for (const [botId, pluginArray] of Object.entries(this.obj)) {

			let pluginIdArray = []

			for (let pluginObj of pluginArray) {
				// Loose equality for currencyId (string vs number)
				if (pluginObj.type == "event" && pluginObj.variable == currencyId) {
					pluginIdArray.push(pluginObj)
				}
			}

			if (pluginIdArray.length > 0) {
				const bot = BotManager.getBot(botId);
				if (bot) {
					bot.send({
						command: "triggerEvent",
						pluginIdArray: pluginIdArray,
						currencyId: currencyId,
						oldValue: oldValue,
						newValue: newValue,
						discordUserId: discordUserId
					})
				} else {
					console.error(`[EventManager] Bot ${botId} not found in BotManager while dispatching event!`);
				}
			}
		}

	}


	async getEvent(db) {
		return this.obj
	}
}

const instance = new EventManager();
module.exports = instance;


function triggerIsRegistered(obj, triggerPluginId, currencyId) {
	for (const [botId, pluginArray] of Object.entries(obj)) {
		if (pluginArray.some((p) => (p.pluginId == triggerPluginId && p.type == 'trigger' && p.variable == currencyId))) {
			return true
		}
	}
	return false
}