
const dataManager = require("../../lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../lib/helper.js');
const VariableManager = require("../../lib/VariableManager.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");
const PluginManager = require("../../lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		plugin.on(client, Events.MessageCreate, async interaction => {

			//keine bot interactionen
			if (interaction.author.bot) return
			
			await VariableManager.counterAdd(interaction.author.id, 1, plugin['var'].chatActivity, db, plugin)

			//this test got removed -> counts all messages now
			//test for valid message //not to small or emoji spam 
			/*
			let message = interaction.content
			message = message.replace(/<.*>/, '') //remove emojis because there are between <> examble: <:NA_002UwU:828939131697627166>
			if (message.length >= 5) {
				
			}*/

		})

	}
	async addEvents(plugin, eventsArray){

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Trigger,
				variable: plugin['var'].chatActivity,
				message: "löst den trigger aus Chat"
			},
		)
	}
	async save(plugin, config) {
		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		await PluginManager.reloadEvents()

		return ({ saved: true, infoMessage: "Gespeichert", infoStatus: "Info" })
	}

};

module.exports = new Plugin();



