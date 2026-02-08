
const dataManager = require("../../lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../lib/helper.js');
const VariableManager = require("../../lib/VariableManager.js");
const helper = require("../../lib/helper.js");
const PluginManager = require("../../lib/PluginManager.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");


class Plugin {
	async execute(client, plugin) {

		let db = DatabaseManager.get()

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].clearChatCommand) {

				let amount = interaction.options.getInteger('amount')


				/*
				const collection = db.collection('pluginCollection');
		
				
				insertResult = await collection.insertOne(
					{ 
						botId: client.user.id,
						name: "botCreatet",
						pluginTag: "clearChat",
						status: "saved",
						var: {
							server:"970393899073933352",
							clearChatCommand:"xyz"
						}
					}
				)
				
				console.log(insertResult.insertedId.toString())


				var obj = { 
					id: insertResult.insertedId.toString(),
					botId: client.user.id,
					name: "botCreatet",
					pluginTag: "clearChat",
					status: "saved",
					var: {
						server:"970393899073933352",
						clearChatCommand:"xyz"
					}
				}

				helper.addWrapperForPlugin(obj)

				const plugin = Object.create(require('../../plugins/' + "clearChat" + '/plugin.js')); //test über neues Object

				

				response = await plugin["execute"](
					client, 
					obj,
				)

				
				PluginManager.add(obj)

				await PluginManager.reloadSlashCommands()
				await PluginManager.reloadEvents()
				*/

				//PluginManager.add(obj)
				console.log("try to clear")

				let channel = await client.channels.fetch(interaction.channelId)
				await channel.bulkDelete(amount, true)

				try {
            		await channel.bulkDelete(amount, true);
				} catch (error) {
					if (error.code === 50034) {
						console.log("❌ Enthält Nachrichten älter als 14 Tage wird ignoriert");
					} else {
						console.error("Unerwarteter Fehler:", error);
					}
				}

				return await interaction.reply({
					content: 'Nachrichten gecleart ',
					ephemeral: true
				});
				

			}

		});

	}
	async save(plugin, config) {
		
		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		await PluginManager.reloadSlashCommands()
		await PluginManager.reloadEvents()

		return ({ saved: true, infoMessage: "updatet", infoStatus: "Info" })
	}
	async addCommands(plugin, commandMap) {

		if (!(
			plugin['var'].clearChatCommand &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].clearChatCommand)
				.setDescription('Clear command')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('Wie viele Nachrichten sollen gelöscht werden?')
						.setRequired(true)
				)
		)

	}

};

module.exports = new Plugin();


