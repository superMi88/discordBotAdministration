const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { EmbedBuilder } = require('discord.js');
var ObjectId = require('mongodb').ObjectId;

class Plugin {
	async execute(client, plugin) {

		let channel = await client.channels.cache.get(plugin['var'].channelRules)

		if (channel) {
			let message = await channel.messages.fetch(plugin['var'].messageId)
		}
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

		//let messageText = await this.getMessageText(plugin)

		let channel = await client.channels.cache.get(plugin['var'].channelRules)

		//sort because we get this array unsorted
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


		let allRuleIdsArray = []
		

		let message = await channel.send({ files: ["https://storage.googleapis.com/"+plugin['var'].image] })
		let channelId = message.channelId
		allRuleIdsArray.push(message.id)


		for (let i = 0; i < plugin['var'].iconAndText1.length; i++) {
			let iconAndText1Element = plugin['var'].iconAndText1[i]

			const exampleEmbed = new EmbedBuilder()
				.setColor('#2b2d31')
				.setDescription(iconAndText1Element.text)
				.setTitle(iconAndText1Element.headline)
			
			if(channel && channel.send){
				let message = await channel.send({ embeds: [exampleEmbed] })
				
				allRuleIdsArray.push(message.id)
				channelId = message.channelId
			}
		}

		await saveMessageArray(db, plugin.id, channelId, allRuleIdsArray)
		
		return ({ saved: true, infoMessage: "Embed wurde erstellt", infoStatus: "Info" })
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