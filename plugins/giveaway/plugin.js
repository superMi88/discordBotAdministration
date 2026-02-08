const dataManager = require("../../discordBot/lib/dataManager.js")

const { EmbedBuilder } = require('discord.js');
var ObjectId = require('mongodb').ObjectId;
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../discordBot/lib/helper.js');
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isButton()) return;
			if (interaction.customId === 'giveaway-' + plugin.id) {


				let discordUserId = interaction.user.id
				let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

				let giveawayBool = discordUserDatabase["giveaway_" + plugin.id]
				if (giveawayBool) {
					await interaction.reply({ content: 'Du bist dem Giveaway schon beigetreten', ephemeral: true });

				} else {
					await updateUserFromDatabase(db, discordUserId, {
						$set: {
							["currency." + "giveaway_" + plugin.id]: true,
						}
					})
					await interaction.reply({ content: 'Giveway beigetreten', ephemeral: true });
				}

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

		const schedule = require('node-schedule');

		const dateToSchedule = getDate(plugin['var'].date)

		//if the giveaway is still running set new end date
		if (schedule.scheduledJobs["AnnouncementGiveawayEnd" + plugin.id]) {
			schedule.scheduledJobs["AnnouncementGiveawayEnd" + plugin.id].reschedule(dateToSchedule)
			console.log("update old")
		} else {
			schedule.scheduleJob("AnnouncementGiveawayEnd" + plugin.id, dateToSchedule, async function () {

				await endGiveaway(client, plugin, db)
			});
		}

		//delete old Message if exist
		await deleteMessage(client, plugin, db)

		let messageText = await getMessageText(client, plugin, plugin['var'].title)

		let channel = await client.channels.cache.get(plugin['var'].giveawayChannel)
		if (channel && channel.send) {

			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('giveaway-' + plugin.id)
						.setLabel('Am Giveaway teilnehmen')
						.setStyle(ButtonStyle.Primary),
				);


			let message = ""

			if (plugin['var'].pingRole) {
				message = await channel.send({ content: "<@&" + plugin['var'].pingRole + ">", embeds: [messageText], components: [row] })
			} else {
				message = await channel.send({ embeds: [messageText], components: [row] })
			}




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

		let messageText = await getMessageText(client, plugin, plugin['var'].title)
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

async function getMessageText(client, plugin, title) {

	const exampleEmbed = new EmbedBuilder()
		.setColor('#0099ff')
		.setDescription(plugin['var'].description)
		.setTitle(title)
	//.setImage('https://media.discordapp.net/attachments/938083998377320482/938200180476477440/cake.png?width=529&height=653')

	return exampleEmbed
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

function getDate(datebasePluginString) {
	let date = datebasePluginString.split("T")[0]
	let time = datebasePluginString.split("T")[1]

	let year = parseInt(date.split("-")[0])
	let month = parseInt(date.split("-")[1] - 1) //-1 because we need the month index from date that is 0-11
	let day = parseInt(date.split("-")[2])
	let hour = parseInt(time.split(":")[0])
	let minute = parseInt(time.split(":")[1])


	console.log(year + " " + month + " " + day + " " + hour + " " + minute + " 0")

	return new Date(year, month, day, hour, minute, 0);
}

async function endGiveaway(client, plugin, db) {
	console.log("end giveaway")
	const pluginCollection = db.collection('pluginCollection');
	//const selectedPlugin = await pluginCollection.findOne({ _id: ObjectId(plugin.selectedPluginId) })

	const collection = db.collection('userCollection');

	const allUsersEntered = await collection.find({ ["currency." + "giveaway_" + plugin.id]: true }).toArray()

	let channel = await client.channels.fetch(plugin['var'].giveawayChannel)
	let guild = await client.guilds.fetch(channel.guild.id);

	userGiveawayArray = []

	for (let i = 0; i < allUsersEntered.length; i++) {
		const userDatabase = allUsersEntered[i];


		let votingDistributionArray = plugin['var'].votingDistribution
		for (i = 0; i < votingDistributionArray.length; i++) {
			let votingDistributionObj = votingDistributionArray[i]

			let user = await guild.members.fetch(userDatabase.discordId)
			let rolesMap = await user.roles.cache

			let foundObj = rolesMap.find(role => role.id === votingDistributionObj.role)

			if (foundObj) {
				parseInt(votingDistributionObj.value)
				for (let i = 0; i < votingDistributionObj.value; i++) {
					userGiveawayArray.push(user.id)
				}
			}
		}
	}

	let messageText = await getMessageText(client, plugin, plugin['var'].titleAfterEnd)
	const { channelId, messageId } = await getMessageId(db, plugin.id)
	try {
		let channel = await client.channels.fetch(channelId)
		let message = await channel.messages.fetch(messageId)
		message.edit({ embeds: [messageText], components: [] })
	} catch (e) {
		console.log("message konnte nicht bearbeitet werden")
	}

	if (userGiveawayArray.length > 0) {
		userIdWon = userGiveawayArray[getRandomInt(userGiveawayArray.length)]

		console.log(userIdWon)

		let descriptionWinner = plugin['var'].descriptionWinner

		descriptionWinner = descriptionWinner.replace('<@userWinner>', "<@" + userIdWon + ">");

		let channel = await client.channels.cache.get(plugin['var'].giveawayChannel)
		if (channel && channel.send) {

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setDescription(descriptionWinner)
				.setTitle(plugin['var'].titleWinner)

			await channel.send({ embeds: [embed] })

		}
	} else {
		let channel = await client.channels.cache.get(plugin['var'].giveawayChannel)
		if (channel && channel.send) {

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setDescription("Niemand hat am Giveaway teilgenommen")
				.setTitle(plugin['var'].titleWinner)

			await channel.send({ embeds: [embed] })

		}
	}
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}
