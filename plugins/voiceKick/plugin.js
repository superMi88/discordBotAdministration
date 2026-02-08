
const dataManager = require("../../discordBot/lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');
const VariableManager = require("../../discordBot/lib/VariableManager.js");
const helper = require("../../discordBot/lib/helper.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].voiceKickCommand) {

				let user = interaction.options.getUser('user')
				const guild = await client.guilds.fetch(plugin['var'].server)
				let discordMember = await guild.members.resolve(user.id);

				console.log(discordMember)

				discordMember.voice.disconnect()

				return await interaction.reply({
					content: 'der User wurde gekickt',
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
			plugin['var'].voiceKickCommand &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].voiceKickCommand)
				.setDescription('voice kick command')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User der aus dem voice gekickt werden soll')
						.setRequired(true)
				)
		)

	}

};

module.exports = new Plugin();



