
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

			if (interaction.commandName == plugin['var'].setNicknameCommand) {

				let user = interaction.options.getUser('user')
				let newNickname = interaction.options.getString('newnickname')

				const guild = await client.guilds.fetch(plugin['var'].server)
				const member = await guild.members.fetch(user.id)
				member.setNickname(newNickname)

				if(!newNickname){
					return await interaction.reply({
						content: 'nickname entfernt',
						ephemeral: true
					});
				}

				return await interaction.reply({
					content: 'nickname geändert',
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
			plugin['var'].setNicknameCommand &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].setNicknameCommand)
				.setDescription('Setnickname command')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('User')
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('newnickname')
						.setDescription('nickname')
						.setRequired(false)
				)
		)

	}

};

module.exports = new Plugin();



