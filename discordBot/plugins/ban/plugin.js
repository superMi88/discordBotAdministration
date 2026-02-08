
const dataManager = require("../../lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../lib/helper.js');
const VariableManager = require("../../lib/VariableManager.js");
const PluginManager = require("../../lib/PluginManager.js");
const helper = require("../../lib/helper.js");

module.exports = {
	async execute(client, plugin) {

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].banCommand) {

				let user = interaction.options.getUser('user')

				const guild = await client.guilds.fetch(plugin['var'].server)
				let discordMember = await guild.members.resolve(user.id);

				await discordMember.ban()

				return await interaction.reply({
					content: 'der User wurde gebannt',
					ephemeral: true
				});
				

			}

		});

	},
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		await PluginManager.reloadSlashCommands()
		await PluginManager.reloadEvents()

		return ({ saved: true, infoMessage: "updatet", infoStatus: "Info" })
	},
	async addCommands(plugin, commandMap) {

		if (!(
			plugin['var'].banCommand &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].banCommand)
				.setDescription('Ban command')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User der gebannt werden soll')
						.setRequired(true)
				)
		)

	}

};



