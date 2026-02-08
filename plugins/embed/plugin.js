const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

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

		let messageText = ""

		plugin['var'].iconAndText1.sort(function (a, b) {
			var valueA, valueB;

			valueA = a["order"]; // Where 1 is your index, from your example
			valueB = b["order"];
			if (valueA < valueB) {
				return -1;
			}
			else if (valueA > valueB) {
				return 1;
			}
			return 0;
		});

		const exampleEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setDescription(plugin['var'].description)
			.setTitle(plugin['var'].title)
		//.setImage('https://media.discordapp.net/attachments/938083998377320482/938200180476477440/cake.png?width=529&height=653')

		let fieldtext = ""

		plugin['var'].iconAndText1.forEach(iconAndText1Element => {


			exampleEmbed.addFields(
				{ name: iconAndText1Element.headline, value: iconAndText1Element.text },
			)
		});

		return exampleEmbed
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

		let channel = await client.channels.cache.get(plugin['var'].channel1)
		if(channel && channel.send){
			let message = await channel.send({ embeds: [messageText] })
			await saveMessage(db, plugin.id, message.channelId, message.id)
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
		const { channelId, messageId } = await getMessageId(db, plugin.id)
		try {
			let channel = await client.channels.fetch(channelId)
			let message = await channel.messages.fetch(messageId)
			message.edit({ embeds: [messageText] })
		} catch (e) {
			console.log("message konnte nicht bearbeitet werden")
		}


		return ({ saved: true, infoMessage: "Embed wurde geupdatet", infoStatus: "Info" })
	}
	async delete(client, plugin, config, db, allPlugins, token, ownerId) {
		await deleteMessage(client, plugin, db)
		return ({ saved: true, infoMessage: "Embed wurde gelöscht", infoStatus: "Info" })
	}
};

module.exports = new Plugin();


async function deleteMessage(client, plugin, db) {
	const { channelId, messageId } = await getMessageId(db, plugin.id)
	if (channelId && messageId) {
		let channel = await client.channels.fetch(channelId)
		let message = await channel.messages.fetch(messageId)

		message.delete()
		await saveMessage(db, plugin.id, '', '')
	}
}

async function saveMessage(db, pluginId, channelId, messageId) {

	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.updateOne(
		{ _id: ObjectId(pluginId) },
		{
			$set: {
				channelId: channelId,
				messageId: messageId
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
		messageId: filteredDocs.messageId
	}
}
