const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { EmbedBuilder } = require('discord.js');
var CronJob = require('cron').CronJob;

var ObjectId = require('mongodb').ObjectId;
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, ModalBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');

let { getPluginFromDatabase } = require('../../lib/helper.js');
const DatabaseManager = require("../../lib/DatabaseManager.js");

class Plugin {
	
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		//shop reset um 0 Uhr
		if (!plugin.cronJob) plugin.cronJob = []
		plugin.cronJob.push(
			//0 0 0 * * *
			new CronJob('0 * * * * *', async function () {
				
				if (plugin['var'].channelQuestion) {

					let shopChannel = await client.channels.fetch(plugin['var'].channelQuestion)


					
			
					var questionObj = plugin['var'].iconAndText1[Math.floor(Math.random()*plugin['var'].iconAndText1.length)];

			
					const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setDescription(questionObj.question)
					.setTitle("Daily Frage")
			
					await shopChannel.send({
						embeds: [exampleEmbed]
					})
			
				}




			}, null, true)

		)

		plugin.on(client, 'interactionCreate', async interaction => {

			//if (!interaction.isButton()) return;

			if (interaction.customId === 'addQuestion-' + plugin.id) {

				const modal = new ModalBuilder()
					.setCustomId('addQuestionButton-' + plugin.id)
					.setTitle('Frage');

				// Add components to modal

				// Create the text input components
				const firstComponent = new TextInputBuilder()
					.setCustomId('Question')
					// The label is the prompt the user sees for this input
					.setLabel("Wie ist deine Frage")
					// Short means only a single line of text
					.setStyle(TextInputStyle.Short);



				// An action row only holds one text input,
				// so you need one action row per text input.
				const firstActionRow = new ActionRowBuilder().addComponents(firstComponent);

				// Add inputs to the modal
				modal.addComponents(firstActionRow);

				// Show the modal to the user
				await interaction.showModal(modal);
				
			}

			if (!interaction.isModalSubmit()) return;
			if (interaction.customId === 'addQuestionButton-' + plugin.id) {

				getPluginFromDatabase(plugin.id)

				let allQuestions = plugin['var'].iconAndText1

				let newQuestion = interaction.fields.getTextInputValue("Question")

				if(!Array.isArray(allQuestions)) allQuestions = []

				allQuestions.push({ question: newQuestion })

				const collection = db.collection('pluginCollection');


				const filteredDocs = await collection.updateOne(
					{ _id: ObjectId(plugin.id) },
					{
						$set: {
							["var.iconAndText1"]: allQuestions
						}
					}
				);


				await interaction.reply({ content: 'Your submission was received successfully!', ephemeral: true });

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
		try{
			await deleteMessage(client, plugin, db)
		}catch(e){
			console.log("Message kann nicht gelöscht werden, wurde wahrscheinlich per hand gelöscht")
		}
		
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
				.setCustomId('addQuestion-' + plugin.id)
				.setLabel('Frage')
				.setStyle(ButtonStyle.Primary),
		);

		const exampleEmbed = new EmbedBuilder()
		.setColor('#0099ff')
		.setDescription("stelle deine Frage")
		.setTitle("Daily Frage")


		let message = await client.channels.cache.get(plugin['var'].channelAddQuestion).send({ embeds: [exampleEmbed], components: [row] })

		await saveMessage(db, plugin.id, message.channelId, message.id)


		return ({ saved: true, infoMessage: "Block erstellt und Plugin Daten gespeichert", infoStatus: "Info" })
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		return ({ saved: true, infoMessage: "Plugin Daten gespeichert", infoStatus: "Info" })
	}
	async delete(client, plugin, config, db, ownerId) {
		deleteMessage(client, plugin, db)

		return ({ saved: true, infoMessage: "Block gelöscht", infoStatus: "Info" })
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