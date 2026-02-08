const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ChannelType, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');

const { PermissionsBitField  } = require('discord.js');



var ObjectId = require('mongodb').ObjectId;

class Plugin {

	async execute(client, plugin) {

		let channel = await client.channels.cache.get(plugin['var'].channelRules)

		if (channel) {
			let message = await channel.messages.fetch(plugin['var'].messageId)
		}

		plugin.on(client, 'interactionCreate', async interaction => {


			if (isButton(interaction, 'deleteTicket')) {

				console.log(interaction)

				let channel = await client.channels.fetch(interaction.channelId)
				channel.delete()

			}

			if (isButton(interaction, 'closeTicket')) {

				console.log(interaction)

				

				//overwrite permissons
				let channel = await client.channels.cache.get(interaction.channelId)

				await channel.edit({ permissionOverwrites: [
					{
					  id: interaction.guildId,
					  deny: [PermissionsBitField.Flags.ViewChannel]
					}
				] });

				//change message text and button

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setDescription("Ticket")
					.setTitle("Ticket [Geschlossen]")

				const actionRow = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('deleteTicket')
							.setLabel('Lösche Ticket')
							.setStyle(ButtonStyle.Danger)
					);

				return await interaction.update({
					embeds: [exampleEmbed],
					components: [actionRow]
				});

			}

			if (isButton(interaction, 'createTicket')) {

				//let channel = await client.channels.fetch(plugin['var'].shopChannel)
	
				console.log(interaction)

				let permissionArray = 
				[
					{
					  id: interaction.user.id, // Ersetze dies durch die ID des Benutzers, der Zugriff haben soll
					  allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
					  deny: [PermissionsBitField.Flags.ManageChannels]
					},
					{
					  id: interaction.guildId,
					  deny: [PermissionsBitField.Flags.ViewChannel]
					}
				]

				for (let i = 0; i < plugin['var'].moderatorRole.length; i++) {
					const roleId = plugin['var'].moderatorRole[i].roleId;
					
					permissionArray.push(
						{
							id: roleId,
							allow: [PermissionsBitField.Flags.ViewChannel]
						}
					)
				}
				
				//ticket channel
				let channel = null
	
				if (!interaction.channel.parent) {
					channel = await interaction.guild.channels.create({
						name: "ticket-"+interaction.user.username,
						type: ChannelType.GuildText,
						permissionOverwrites: permissionArray
					});


					


					await interaction.reply({
						content: 'Dein Ticket wurde erstellt!', 
						ephemeral: true 
					});
					//return;
				}
				

				if (interaction.channel.parent) {
					channel = await interaction.channel.parent.children.create({
						name: "ticket-"+interaction.user.username,
						type: ChannelType.GuildText, 
						permissionOverwrites: permissionArray
					});

					
				
					await interaction.reply({
						content: 'Dein Ticket wurde erstellt!', 
						ephemeral: true 
					});
					//return;
				}

				

				const exampleEmbed = new EmbedBuilder()
				.setColor('#0099ff')
				.setDescription("Ticket")
				.setTitle("Ticket [Offen]")
			
				const actionRow = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('closeTicket')
							.setLabel('Schließe Ticket')
							.setStyle(ButtonStyle.Danger)
					);
		

				let message = await channel.send(
				{ 
					embeds: [exampleEmbed],
					components: [actionRow]
				})
	
			}
		})
		

		
	}
	async create(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		//delete old Message if exist
		//await deleteMessage(client, plugin, db)

		let channel = await client.channels.cache.get(plugin['var'].channelTicket)

		const exampleEmbed = new EmbedBuilder()
			.setColor('#2b2d31')
			.setDescription(plugin['var'].description)
			.setTitle("Ticket")

		const actionRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('createTicket')
					.setLabel('Erstelle Ticket')
					.setStyle(ButtonStyle.Primary)
			);

		let message = await channel.send({ 
			embeds: [exampleEmbed],
			components: [actionRow]
		})


		await saveMessageArray(db, plugin.id, message.channelId, message.id)
		
		return ({ saved: true, infoMessage: "Embed wurde erstellt", infoStatus: "Info" })
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}
		
		return ({ saved: true, infoMessage: "Daten wurden gespeichert", infoStatus: "Info" })
	}
	async delete(plugin, config) {

		let db = DatabaseManager.get()
		let client = dataManager.client

		await deleteMessage(client, plugin, db)
		return ({ saved: true, infoMessage: "Embed wurde gelöscht", infoStatus: "Info" })
	}
};
module.exports = new Plugin();



async function deleteMessage(client, plugin, db) {
	const { channelId, messageIdArray } = await getMessageIdArray(db, plugin.id)

	if (channelId && messageIdArray) {
		let channel = await client.channels.fetch(channelId)

		for (let i = 0; i < messageIdArray.length; i++) {
			const messageId = messageIdArray[i];
			let message = await channel.messages.fetch(messageId)
			message.delete()
		}

		
		await saveMessageArray(db, plugin.id, '', [])
	}
}

async function saveMessageArray(db, pluginId, channelId, messageIdArray) {

	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.updateOne(
		{ _id: ObjectId(pluginId) },
		{
			$set: {
				channelId: channelId,
				messageIdArray: messageIdArray
			}
		}
	);

	return filteredDocs;
}

async function getMessageIdArray(db, pluginId) {

	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.findOne(
		{ _id: ObjectId(pluginId) }
	);

	return {
		channelId: filteredDocs.channelId,
		messageIdArray: filteredDocs.messageIdArray
	}
}


function isButton(interaction, buttonId) {
	if (interaction.customId && (interaction.customId == buttonId || interaction.customId.includes(buttonId + "-"))) {
		return true
	}
	return false
}