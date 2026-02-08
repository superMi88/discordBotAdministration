
const dataManager = require("../../lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../lib/helper.js');
const VariableManager = require("../../lib/VariableManager.js");
const helper = require("../../lib/helper.js");
const PluginManager = require("../../lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].timeoutCommand) {

				let user = interaction.options.getUser('user')
				let days = interaction.options.getInteger('days')
				let hours = interaction.options.getInteger('hours')
				let minutes = interaction.options.getInteger('minutes')
				let reason = interaction.options.getString('reason')

				const guild = await client.guilds.fetch(plugin['var'].server)
				let discordMember = await guild.members.resolve(user.id);

				

				if(!days && !hours && !minutes){
					return await interaction.reply({
						content: 'Es muss eine Zeit angegeben werden',
						ephemeral: true
					});
				}

				await discordMember.timeout(((days*24*60*60) + (hours*60*60) + (minutes*60)) * 1000, reason) //timeout in milliseconds

				let string = '';
				if(days){
					string += days+' Tage '
				}
				if(hours){
					string += hours+' Stunden '
				}
				if(minutes){
					string += minutes+' Minuten '
				}

				return await interaction.reply({
					content: 'der User wurde in timeout geschickt für '+string,
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
			plugin['var'].timeoutCommand &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].timeoutCommand)
				.setDescription('timeout command')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User der in timeout soll')
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option
						.setName('days')
						.setDescription('Tage')
						.setRequired(false)
				)
				.addIntegerOption(option =>
					option
						.setName('hours')
						.setDescription('Stunden')
						.setRequired(false)
				)
				.addIntegerOption(option =>
					option
						.setName('minutes')
						.setDescription('Minuten')
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('reason')
						.setDescription('Begründung')
						.setRequired(false)
				)
			
		)

	}

};
module.exports = new Plugin();



