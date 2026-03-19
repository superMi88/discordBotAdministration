
const dataManager = require("../../discordBot/lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');
const VariableManager = require("../../discordBot/lib/VariableManager.js");
const helper = require("../../discordBot/lib/helper.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");
const UserData = require("../../lib/UserData.js");

class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].warnCommand) {

				let user = interaction.options.getUser('user')
				let userData = await UserData.get(user.id);

				let warnings = userData.getCurrency("warnings");
				userData.setCurrency("warnings", warnings + 1);
				await userData.save();

				const guild = await client.guilds.fetch(plugin['var'].server)
				let discordUser = await guild.members.resolve(user.id);

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setTitle("[Verwarnungen]")
					.setDescription(plugin['var'].descriptionWarn)
					discordUser.send({embeds:[exampleEmbed]})

				return await interaction.reply({
					content: 'User wurde verwarnt, Verwarnungen des Users: '+(warnings+1),
					ephemeral: true
				});
				
			}
			if (interaction.commandName == plugin['var'].warnRemoveCommand) {

				let user = interaction.options.getUser('user')
				let userData = await UserData.get(user.id);
				userData.setCurrency("warnings", 0);
				await userData.save();

				return await interaction.reply({
					content: 'Alle verwarnungen des Users entfernt',
					ephemeral: true
				});
				
			}
			if (interaction.commandName == plugin['var'].warnlistCommand) {

				let userlist = await UserData.find({ "currency.warnings": { $gt: 0 } });

				let warnlistText = ""
				for (let i = 0; i < userlist.length; i++) {
					const user = userlist[i];
					warnlistText += "<@"+user.discordId+">\n"
				}

				const exampleEmbed = new EmbedBuilder()
					.setColor('#ff0000')
					.setTitle("Alle aktiven Verwarnungen")
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
			plugin['var'].warnlistCommand &&
			plugin['var'].warnCommand &&
			plugin['var'].warnRemoveCommand &&
			plugin['var'].server
		)) return ""

		
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].warnlistCommand)
				.setDescription('Bekomme eine Liste aller verwarnten User')
		)
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].warnCommand)
				.setDescription('Verwarne einen User')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User der Verwarnt werden soll')
						.setRequired(true)
				)
		)
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].warnRemoveCommand)
				.setDescription('Entferne eine verwarnung')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User wo die Verwarnung entfernt werden soll')
						.setRequired(true)
				)
		)

	}

};
module.exports = new Plugin();
