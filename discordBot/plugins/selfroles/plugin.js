const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { EmbedBuilder } = require('discord.js');


class Plugin {
	
	variable = { } //TODO hier stehen die plugin vars drin die geändert werden können
	async execute(client, plugin) {
		let db = DatabaseManager.get()


		let messageReactionAddFunction = async (potentialPartialReaction, potentialPartialUser) => {
			executeReactionFunction(client, plugin, db, potentialPartialReaction, potentialPartialUser, (member, role) => {
				member.roles.add(role)
			})
			
		}

		plugin.on(client, 'messageReactionAdd', messageReactionAddFunction)

		let messageReactionRemoveFunction = async (potentialPartialReaction, potentialPartialUser) => {
			executeReactionFunction(client, plugin, db, potentialPartialReaction, potentialPartialUser, (member, role) => {
				member.roles.remove(role)
			})
			
		}

		plugin.on(client, 'messageReactionRemove', messageReactionRemoveFunction)

	}
	async create(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		//delete old Message if exist
		try{
			await deleteMessage(client, plugin, db)
		}catch(e){
			console.log("Message kann nicht gelöscht werden, wurde wahrscheinlich per hand gelöscht")
		}
		

		let messageText = await getMessageText(client, plugin)

		let message = await client.channels.cache.get(plugin['var'].channel1).send({ embeds: [messageText] })

		await saveMessage(db, plugin.id, message.channelId, message.id)

		//TODO save message id in database	
		plugin['var'].iconAndText1.forEach(async iconAndText1Element => {

			if (
				iconAndText1Element.emoji1
			) {
				message.react(iconAndText1Element.emoji1);
			}

		});


		return ({ saved: true, infoMessage: "Selfrole block erstellt", infoStatus: "Info" })
	}
	async update(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		let messageText = await getMessageText(client, plugin)
		const { channelId, messageId } = await getMessageId(db, plugin.id)
		try {
			let channel = await client.channels.fetch(channelId)
			let message = await channel.messages.fetch(messageId)
			message.edit({ embeds: [messageText] })
		} catch (e) {
			console.log("message konnte nicht bearbeitet werden")
		}


		return ({ saved: true, infoMessage: "Selfrole block geupdatet", infoStatus: "Info" })
	}
	async delete(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		deleteMessage(client, plugin, db)

		return ({ saved: true, infoMessage: "Selfrole Block gelöscht", infoStatus: "Info" })
	}
};
module.exports = new Plugin();


async function getMessageText(client, plugin) {

	let messageText = ""
	
	const exampleEmbed = new EmbedBuilder()
		.setColor('#0099ff')
		.setDescription(plugin['var'].description)
		.setTitle(plugin['var'].title)

	let fieldtext = ""
	plugin['var'].iconAndText1.forEach(iconAndText1Element => {

		if (
			iconAndText1Element.emoji1
		) {
			let emoji = ""

			if (isNaN(iconAndText1Element.emoji1)) {
				emoji = iconAndText1Element.emoji1
			} else {

				emoji = "<:" + client.emojis.cache.get(iconAndText1Element.emoji1).name + ":" + iconAndText1Element.emoji1 + ">"
			}

			fieldtext = fieldtext + emoji + " ➜ <@&" + iconAndText1Element.roles1 + ">\n"
		}

	});

	if(fieldtext){
		exampleEmbed.addFields(
			{ name: 'Optionen', value: fieldtext },
		)
	}

	

	return exampleEmbed
}


async function executeReactionFunction(client, plugin, db, potentialPartialReaction, potentialPartialUser, callback) {


	const { channelId, messageId } = await getMessageId(db, plugin.id)

	if (potentialPartialReaction.message.id === messageId) {
		let channel = await client.channels.cache.get(channelId)

		if (channel) {

			plugin['var'].iconAndText1.forEach(async iconAndText1Element => {

				if (
					iconAndText1Element.emoji1
				) {
					if (
						potentialPartialReaction.emoji.id == iconAndText1Element.emoji1	//for custom emoji
						||
						potentialPartialReaction.emoji.name == iconAndText1Element.emoji1 //for unicode
					) {

						let guild = client.guilds.cache.get(potentialPartialReaction.message.guildId);
						let member = guild.members.cache.get(potentialPartialUser.id);
						let role = guild.roles.cache.get(iconAndText1Element.roles1)

						//message.react(iconAndText1Element.emoji1);

						if (role) {
							callback(member, role)
						}


					}

				}

			})


		}
	}
}


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

var ObjectId = require('mongodb').ObjectId;

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