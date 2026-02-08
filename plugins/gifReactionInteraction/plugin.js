const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
const helper = require('../../discordBot/lib/helper.js');


//TODO this plugin is currently not active

class Plugin {
	async execute(client, plugin) {


		client.on('interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].name1) {

				if(interaction.options.getUser('user').bot){

					if(plugin['var'].imageBotList === undefined || plugin['var'].imageBotList.length == 0){
						return await interaction.reply({
							content:'[Fehler] Keine Bilder vorhanden, melde dich beim Team das sie Bilder hinzufügen für den command',
							ephemeral: true
						});
					}

					let text = plugin['var'].botText
					text = text.replace('<@user>', "<@"+interaction.user.id+">");

					var randomNumber = Math.floor(Math.random() * plugin['var'].imageBotList.length); //wenn 3 dann -> 0-2
					const responseEmbed = new EmbedBuilder()
						.setColor('#0099ff')
						.setDescription(text) //"<@"+interaction.user.id+"> versucht den Bot zu huggen aber es ist ein Igel, aua :("
						.setImage("https://storage.googleapis.com/"+plugin['var'].imageBotList[randomNumber].image)
					
					return await interaction.reply({ embeds: [responseEmbed] })


				}else if(interaction.user.id === interaction.options.getUser('user').id){
					
					if(plugin['var'].imageSelfList === undefined || plugin['var'].imageSelfList.length == 0){
						return await interaction.reply({
							content:'[Fehler] Keine Bilder vorhanden, melde dich beim Team das sie Bilder hinzufügen für den command',
							ephemeral: true
						});
					}

					let text = plugin['var'].selfText
					text = text.replace('<@user>', "<@"+interaction.user.id+">");

					var randomNumber = Math.floor(Math.random() * plugin['var'].imageSelfList.length); //wenn 3 dann -> 0-2
					const responseEmbed = new EmbedBuilder()
						.setColor('#0099ff')
						.setDescription(text)
						.setImage("https://storage.googleapis.com/"+plugin['var'].imageSelfList[randomNumber].image)
					
					return await interaction.reply({ embeds: [responseEmbed] })

					
				}else{


					if(plugin['var'].imageList === undefined || plugin['var'].imageList.length == 0){
						return await interaction.reply({
							content:'[Fehler] Keine Bilder vorhanden, melde dich beim Team das sie Bilder hinzufügen für den command',
							ephemeral: true
						});
					}

					let text = plugin['var'].userText
					if(!text) {
						text = "Pls add some text"
					}
					text = text.replace('<@user>', "<@"+interaction.user.id+">");
					text = text.replace('<@userMentioned>', "<@"+interaction.options.getUser('user').id+">");

					var randomNumber = Math.floor(Math.random() * plugin['var'].imageList.length); //wenn 3 dann -> 0-2
					const responseEmbed = new EmbedBuilder()
						.setColor('#0099ff')
						.setDescription(text)
						.setImage("https://storage.googleapis.com/"+plugin['var'].imageList[randomNumber].image)
					
					return await interaction.reply({ embeds: [responseEmbed] })
				}

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

		return ({ saved: true, infoMessage: "Einstellungen gespeichert", infoStatus: "Info" })
	}

	async addCommands(plugin, commandMap) {

		if(!commandMap) return

		if(! (plugin['var'].name1 && plugin['var'].description && plugin['var'].server)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
			.setName(plugin['var'].name1)
			.setDescription(plugin['var'].description)
			.addUserOption(option =>
				option
					.setName('user')
					.setDescription('The user')
					.setRequired(true)
			)
		)

		/*
		await plugin.setCommands(
			[
				{
					serverId: plugin['var'].server, 
					slashCommand: new SlashCommandBuilder()
						.setName(plugin['var'].name1)
						.setDescription(plugin['var'].description)
						.addUserOption(option =>
							option
								.setName('user')
								.setDescription('The user')
								.setRequired(true)
						)
				}
			]
		)*/
	}
	
};

module.exports = new Plugin();


