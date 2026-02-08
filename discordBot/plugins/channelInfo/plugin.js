
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

			if (interaction.commandName == plugin['var'].channelInfoCommand) {

				console.log("try to get info")

				let channel = await client.channels.fetch(interaction.channelId)

				console.log(channel)

				let antwort = JSON.stringify(channel).replaceAll(",", ',\n    ').replaceAll("{", '{\n    ').replaceAll("}", '\n}')


				return await interaction.reply({
					content: antwort,
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
			plugin['var'].channelInfoCommand &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].channelInfoCommand)
				.setDescription('Channel Info')
		)

	}

};

module.exports = new Plugin();


