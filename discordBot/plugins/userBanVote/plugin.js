
const dataManager = require("../../lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

const { EmbedBuilder } = require('discord.js');

const { MessageEmbed } = require('discord.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SelectMenuBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
//SelectMenuBuilder geht irgendwann in der Zukunft

const helper = require('../../lib/helper.js');
const PluginManager = require("../../lib/PluginManager.js");

//TODO this plugin is currently not active

class Plugin {
	async execute(client, plugin) {

		client.on('interactionCreate', async interaction => {
			if (!interaction.isModalSubmit()) return;
			if (interaction.customId === 'myModal') {

				let textchannel = await client.channels.fetch(plugin['var'].vorstellungsForum)

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setDescription("description hier")
					.setTitle("title hier")
				//.setImage('https://media.discordapp.net/attachments/938083998377320482/938200180476477440/cake.png?width=529&height=653')
				/*
				.addFields(
					{ name: 'Kuchentext', value: '** sdada dadada<@'+user+'>**' },
				)*/

				//return await interaction.reply({ embeds: [exampleEmbed] })


				exampleEmbed.addFields(
					{ name: 'Optionen', value: "123 hello"+ interaction.fields.getTextInputValue("BirthdayInput") },
				)
				

				textchannel.send({ embeds: [exampleEmbed] })

				await interaction.reply({ content: 'Your submission was received successfully!', ephemeral: true });



			}
		});

		client.on('interactionCreate', async interaction => {
			var slashCommandInteraction = interaction;

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName === 'userbanvote') {

				const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('primary')
						.setLabel('Click me!')
						.setStyle(ButtonStyle.Primary),
				);

				const message = await interaction.reply({ content: 'Ban vote for <@'+slashCommandInteraction.options.getUser('user')+'> 1/2', components: [row] });

				const filter = (user, collected) => {

					for (const buttonInteraction of collected) {
						if(buttonInteraction.user.id == user.user.id){
							return false
						}
					}

					return true
				}

				const collector = message.createMessageComponentCollector({
					max: "2", // The number of times a user can click on the button
					time: "100000", // The amount of time the collector is valid for in milliseconds,
					filter // Add the filter
				});

				

				collector.on("collect", async (interaction) => {
					interaction.update('Ban vote for <@'+slashCommandInteraction.options.getUser('user')+'> '+collector.collected.size+'/2')
				});

				collector.on("end", (collected) => {
					console.log(`Collected ${collected.size} clicks`); // Run a piece of code when the collector ends
				});

			}


		
		});

	}

	async addCommands(plugin, commandMap) {

		if(!commandMap) return

		if(! (plugin['var'].name1 && plugin['var'].description && plugin['var'].server)) return ""

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
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}
	}
};
module.exports = new Plugin();