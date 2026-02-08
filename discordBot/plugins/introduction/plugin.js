const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

const { EmbedBuilder } = require('discord.js');

const { MessageEmbed } = require('discord.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SelectMenuBuilder } = require('discord.js');
//SelectMenuBuilder geht irgendwann in der Zukunft

//TODO this plugin is currently not active

const {interactionSlashCommand} = require('../../lib/helper');
const helper = require('../../lib/helper.js');

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

			if (!interaction.isChatInputCommand()) return;

			if (interactionSlashCommand(this, interaction, plugin, "introductionCommand") ) {
				// Create the modal
				const modal = new ModalBuilder()
					.setCustomId('myModal')
					.setTitle('Vorstellung');

				// Add components to modal

				// Create the text input components
				const favoriteColorInput = new TextInputBuilder()
					.setCustomId('BirthdayInput')
					// The label is the prompt the user sees for this input
					.setLabel("Wann wurdest du Geboren? (DD-MM-YYYY)")
					// Short means only a single line of text
					.setStyle(TextInputStyle.Short);

				const hobbiesInput = new TextInputBuilder()
					.setCustomId('hobbiesInput')
					.setLabel("Was sind deine Hobbys")
					// Paragraph means multiple lines of text.
					.setStyle(TextInputStyle.Paragraph);



				// An action row only holds one text input,
				// so you need one action row per text input.
				const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
				const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);

				// Add inputs to the modal
				modal.addComponents(firstActionRow, secondActionRow);

				// Show the modal to the user
				await interaction.showModal(modal);
			}
		});

	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}
		
		await PluginManager.reloadSlashCommands()

		
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