
const dataManager = require("../../lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../lib/helper.js');
const VariableManager = require("../../lib/VariableManager.js");
const helper = require("../../lib/helper.js");
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../lib/helper.js')
const PluginManager = require("../../lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].muteCommand) {

				let user = interaction.options.getUser('user')

				const guild = await client.guilds.fetch(plugin['var'].server)
				let member = await guild.members.resolve(user.id);

				member.roles.add(plugin['var'].muteRole)

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setTitle("[Textmute]")
					.setDescription(plugin['var'].descriptionMute)
					member.send({embeds:[exampleEmbed]})

				return await interaction.reply({
					content: 'User wurde gemutet',
					ephemeral: true
				});
				
			}
			if (interaction.commandName == plugin['var'].muteRemoveCommand) {

				let user = interaction.options.getUser('user')
				
				const guild = await client.guilds.fetch(plugin['var'].server)
				let member = await guild.members.resolve(user.id);

				member.roles.remove(plugin['var'].muteRole)


				return await interaction.reply({
					content: 'Mute des Users entfernt',
					ephemeral: true
				});
				
			}
			if (interaction.commandName == plugin['var'].mutelistCommand) {

				const guild = await client.guilds.fetch(plugin['var'].server)
				let userlist = await guild.roles.cache.find(r => r.id == plugin['var'].muteRole).members.map(m=>m.user.id);
				
				let warnlistText = ""
				for (let i = 0; i < userlist.length; i++) {
					const userId = userlist[i];
					warnlistText += "<@"+userId+">\n"
				}

				const exampleEmbed = new EmbedBuilder()
					.setColor('#ff0000')
					.setTitle("Alle aktiven Mutes")
					.setDescription(warnlistText)

				return await interaction.reply({
					embeds:[exampleEmbed],
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
			plugin['var'].mutelistCommand &&
			plugin['var'].muteCommand &&
			plugin['var'].muteRemoveCommand &&
			plugin['var'].server
		)) return ""

		
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].mutelistCommand)
				.setDescription('Bekomme eine Liste aller gemuteten User')
		)
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].muteCommand)
				.setDescription('Mute einen User')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User der Gemutet wurde')
						.setRequired(true)
				)
		)
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].muteRemoveCommand)
				.setDescription('Entferne einen Mute')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User wo der mute entfernt werden soll')
						.setRequired(true)
				)
		)

	}

};

module.exports = new Plugin();