const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionResponse} = require('discord.js');
var ObjectId = require('mongodb').ObjectId;
var CronJob = require('cron').CronJob;

let userMap = new Map()

//TODO this plugin is currently not active

class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		//create Map for each Plugin
		userMap.set(plugin.id, new Map())

		let channel = await client.channels.cache.get(plugin['var'].channel1)

				if (channel) {
					let message = await channel.messages.fetch(plugin['var'].messageId)

					if(!plugin.cronJob) plugin.cronJob = []
					plugin.cronJob.push(
						new CronJob('* * * * * *', async function () {

							userList = userMap.get(plugin.id)

							userList.forEach( async (timer, userid) => {
								if(timer > 0){
									userList.set(userid, timer-1)
								}else{
									userList.delete(userid)
									
									const { channelId, messageId } = await getMessageId(db, plugin.id)
									if (channelId && messageId) {
										let channel = await client.channels.fetch(channelId)
										let message = await channel.messages.fetch(messageId)
										updateEmbedMessage2(message, plugin, plugin.id)
									}

								}
								
							});
						}, null, true)
					)

					const collector = channel.createMessageComponentCollector()
					
					collector.on('collect', async interaction => {

						userList = userMap.get(plugin.id)

						if(interaction.customId === plugin.id+'-AddUser'){
							userList.set(interaction.user.id, 360) //(6 stunden) zeit in minuten wie lange ein user angezeigt werden soll in der liste
							updateEmbedMessage(interaction, plugin, plugin.id)
							
						}
						if(interaction.customId === plugin.id+'-RemoveUser'){

							if(userList.has(interaction.user.id)){
								userList.delete(interaction.user.id)
							}
							updateEmbedMessage(interaction, plugin, plugin.id)

						}
						
					});
					
					updateEmbedMessage2(message, plugin, plugin.id)
				}
	}
	async save(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}
		
		await deleteMessage(client, plugin, db)

		var channel = await client.channels.cache.get(plugin['var'].channel1)

		let message = await channel.send({ embeds: [await getEmbed(plugin, plugin.id)] , components: [getRow(plugin.id)] })

		await saveMessage(db, plugin.id, message.channelId, message.id)

		return ({ miau: "123" })
	}
	async update(client, plugin, config, db, ownerId) {
		console.log("update dont work currently")
	}
	async delete(client, plugin, config, db, ownerId) {
		deleteMessage(client, plugin, db)
	}
};

module.exports = new Plugin();


async function updateEmbedMessage(interaction, plugin, pluginId) {
	
	await interaction.update({ embeds: [await getEmbed(plugin, pluginId)] , components: [getRow(pluginId)] })
}

async function updateEmbedMessage2(message, plugin, pluginId) {
	
	if(message.edit){
		await message.edit({ embeds: [await getEmbed(plugin, pluginId)] , components: [getRow(pluginId)] })
	}
	
}

function getRow(pluginId) {
	return (
		new ActionRowBuilder()
		.addComponents(
		new ButtonBuilder()
			.setCustomId(pluginId+'-AddUser')
			.setLabel('Mich hinzufügen')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId(pluginId+'-RemoveUser')
			.setLabel('Mich entfernen')
			.setStyle(ButtonStyle.Danger)
		)
	)
}

async function getEmbed(plugin, pluginId) {

	let fieldtext = ""
	userList = userMap.get(pluginId.toString())
	if(!userList || userList.size <= 0){
		fieldtext = "noch keine User"
	}else{
		userList.forEach((timer, userid) => {
			fieldtext = fieldtext + "<@"+userid+">\n"
		});
	}

	const responseEmbed = new EmbedBuilder()
		.setColor('#0099ff')
		.setDescription(plugin['var'].description)
		.setTitle(plugin['var'].title)
		.setThumbnail("https://storage.googleapis.com/"+plugin['var'].image1)
		.addFields(
			{ name: "Mitspieler:", value: fieldtext }
		)
	return responseEmbed
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
