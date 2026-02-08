
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

			if (interaction.commandName == plugin['var'].kickCommand) {

				let user = interaction.options.getUser('user')
				let reasonText = interaction.options.getString('reasontext')

				const guild = await client.guilds.fetch(plugin['var'].server)
				let discordMember = await guild.members.resolve(user.id);

				await discordMember.kick(reasonText)

				return await interaction.reply({
					content: 'der User wurde vom Server gekickt',
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
			plugin['var'].kickCommand &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].kickCommand)
				.setDescription('Kick command')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User der gebannt werden soll')
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('reasontext')
						.setDescription('Bangrund')
						.setRequired(false)
				)
			
		)

	}

};
module.exports = new Plugin();



