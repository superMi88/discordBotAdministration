const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { EmbedBuilder } = require('discord.js');
var ObjectId = require('mongodb').ObjectId;

class Plugin {
	async execute(client, plugin) {

		let channel = await client.channels.cache.get(plugin['var'].channel1)

		if (channel) {
			let message = await channel.messages.fetch(plugin['var'].messageId)
		}
	}
	async getMessageText(plugin) {

		const exampleEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setDescription(plugin['var'].description)
			.setTitle(plugin['var'].title)
		//.setImage('https://media.discordapp.net/attachments/938083998377320482/938200180476477440/cake.png?width=529&height=653')

		return exampleEmbed
	}
	async getfollowUpMessageText(plugin) {
		return plugin['var'].followupMessage
	}
	async create(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		//delete old Message if exist
		await deleteMessage(client, plugin, db)

		let messageText = await this.getMessageText(plugin)
		let followUpMessageText = await this.getfollowUpMessageText(plugin)

		let channel = await client.channels.cache.get(plugin['var'].channel1)
		if(channel && channel.send){
			let message = await channel.send(
				{ 
					content: '<@&'+plugin['var'].announcementRole+'>\n', 
					embeds: [messageText] 
				})
			if(followUpMessageText){
				let followUpMessage = await channel.send(
					{ 
						content: followUpMessageText, 
					})
					await saveMessage(db, plugin.id, message.channelId, message.id, followUpMessage.id)
			}else{
				await saveMessage(db, plugin.id, message.channelId, message.id, '')
			}
			
		}

		return ({ saved: true, infoMessage: "Embed wurde erstellt", infoStatus: "Info" })
	}
	async update(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		let messageText = await this.getMessageText(plugin)
		let followUpMessageText = await this.getfollowUpMessageText(plugin)

		const { channelId, messageId, followUpMessageId } = await getMessageId(db, plugin.id)
		try {
			let channel = await client.channels.fetch(channelId)

			let message = await channel.messages.fetch(messageId)
			message.edit({ embeds: [messageText] })

			if(followUpMessageId){
				let followUpMessage = await channel.messages.fetch(followUpMessageId)
				followUpMessage.edit({ content: followUpMessageText })
			}

		} catch (e) {
			console.log("message konnte nicht bearbeitet werden")
		}


		return ({ saved: true, infoMessage: "Embed wurde geupdatet", infoStatus: "Info" })
	}
	async delete(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		await deleteMessage(client, plugin, db)
		return ({ saved: true, infoMessage: "Embed wurde gelöscht", infoStatus: "Info" })
	}
};

module.exports = new Plugin();



async function deleteMessage(client, plugin, db) {
	const { channelId, messageId, followUpMessageId } = await getMessageId(db, plugin.id)
	if (channelId && messageId) {
		let channel = await client.channels.fetch(channelId)
		let message = await channel.messages.fetch(messageId)
		message.delete()

		if(followUpMessageId){
			let followUpMessage = await channel.messages.fetch(followUpMessageId)
			followUpMessage.delete()
		}

		
		await saveMessage(db, plugin.id, '', '', '')
	}
}

async function saveMessage(db, pluginId, channelId, messageId, followUpMessageId) {

	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.updateOne(
		{ _id: ObjectId(pluginId) },
		{
			$set: {
				channelId: channelId,
				messageId: messageId,
				followUpMessageId: followUpMessageId
			}
		}
	);

	return filteredDocs;
}

async function getMessageId(db, pluginId) {

	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.findOne(
		{ _id: ObjectId(pluginId) }
	);

	return {
		channelId: filteredDocs.channelId,
		messageId: filteredDocs.messageId,
		followUpMessageId: filteredDocs.followUpMessageId
	}
}