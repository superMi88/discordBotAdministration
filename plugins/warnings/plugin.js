
const dataManager = require("../../discordBot/lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');
const VariableManager = require("../../discordBot/lib/VariableManager.js");
const helper = require("../../discordBot/lib/helper.js");
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../discordBot/lib/helper.js');
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].warnCommand) {

				let user = interaction.options.getUser('user')
				let discordUserDatabase = await getUserCurrencyFromDatabase(user.id, db)

				if(!discordUserDatabase.warnings){
					warnings = 0
				}

				let returnValue = await updateUserFromDatabase(db, user.id, {
					$inc: {
						["currency." + "warnings"]: 1,
					}
				})

				const guild = await client.guilds.fetch(plugin['var'].server)
				let discordUser = await guild.members.resolve(user.id);

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setTitle("[Verwarnungen]")
					.setDescription(plugin['var'].descriptionWarn)
					discordUser.send({embeds:[exampleEmbed]})

				return await interaction.reply({
					content: 'User wurde verwarnt, Verwarnungen des Users: '+(returnValue.value.currency.warnings+1),
					ephemeral: true
				});
				
			}
			if (interaction.commandName == plugin['var'].warnRemoveCommand) {

				let user = interaction.options.getUser('user')
				let discordUserDatabase = await getUserCurrencyFromDatabase(user.id, db)

				if(!discordUserDatabase.warnings){
					warnings = 0
				}

				await updateUserFromDatabase(db, user.id, {
					$set: {
						["currency." + "warnings"]: 0,
					}
				})

				return await interaction.reply({
					content: 'Alle verwarnungen des Users entfernt',
					ephemeral: true
				});
				
			}
			if (interaction.commandName == plugin['var'].warnlistCommand) {

			
				const collection = db.collection('userCollection');

				let userlist = await collection.find({ "currency.warnings": { $gt: 0 } }).toArray();

				console.log(userlist)

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
