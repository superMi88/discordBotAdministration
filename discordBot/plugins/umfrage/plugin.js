
const dataManager = require("../../lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events, Message, parseEmoji } = require('discord.js');
const { interactionSlashCommand } = require('../../lib/helper.js');
const VariableManager = require("../../lib/VariableManager.js");
const helper = require("../../lib/helper.js");
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../lib/helper.js')
const PluginManager = require("../../lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].createUmfrageCommand) {

				let arrEmoji = []


				let numberOfOptions = parseInt(plugin['var'].numberOfOptions)

				let umfrageText = interaction.options.getString('umfragetext')

				for (let i = 0; i < numberOfOptions; i++) {
					let option = interaction.options.getString('option'+(i+1))
					if(option) { arrEmoji.push(option) }
				}

				for (let i = 0; i < arrEmoji.length; i++) {
					arrEmoji[i] = parseEmoji(arrEmoji[i]);
				}
				
				for (let i = 0; i < arrEmoji.length; i++) {

					let emoji = arrEmoji[i]

					//test 
					let isNormalEmoji = (emoji.name && (emoji.id === undefined || emoji.id === null))
					let isServerEmoji = (client.emojis.cache.get(emoji.id) !== undefined)

					//ist is no normal emoji and no extern emoji 
					if( !isNormalEmoji && !isServerEmoji){

						const exampleEmbed = new EmbedBuilder()
							.setColor('#0099ff')
							.setTitle("[Umfrage]")
							.setDescription("kein zugriff auf emoji womöglich von einem anderen Server oder ungültig")

						return await interaction.reply({
							embeds: [exampleEmbed],
							ephemeral: true
						});
					}
				}


				console.log(plugin['var'])

				let headline = "[Umfrage]"
				if(plugin['var'].headline) headline = plugin['var'].headline
				
				//create message
				const exampleEmbed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(headline)
				.setDescription(umfrageText)

				let replyMessage = await interaction.reply({
					embeds: [exampleEmbed],
					fetchReply: true
				});

				//add emoji
				
				if (replyMessage instanceof Message) {

					for (let i = 0; i < arrEmoji.length; i++) {

						let emoji = arrEmoji[i]

						if(emoji.id){
							replyMessage.react(emoji.id)
						}else{
							replyMessage.react(emoji.name)
						}
					}
				}

				return 
				
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
			plugin['var'].createUmfrageCommand &&
			plugin['var'].server
		)) return ""

		let slashCommandBuilder = new SlashCommandBuilder()
				.setName(plugin['var'].createUmfrageCommand)
				.setDescription('Entferne eine verwarnung')
				.addStringOption(option =>
					option
						.setName('umfragetext')
						.setDescription('umfragetext')
						.setRequired(true)
				)


		let numberOfOptions = parseInt(plugin['var'].numberOfOptions)

		for (let i = 0; i < numberOfOptions; i++) {
			slashCommandBuilder
			.addStringOption(option =>
				option
					.setName('option'+(i+1))
					.setDescription('emoji option'+(i+1))
					.setRequired(false)
			)
			
		}

		helper.addToCommandMap(commandMap, plugin['var'].server, slashCommandBuilder)

	}

};

module.exports = new Plugin();