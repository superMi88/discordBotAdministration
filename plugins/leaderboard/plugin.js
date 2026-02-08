
const dataManager = require("../../discordBot/lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');


let { getUserFromDatabase, getPluginFromDatabase } = require('../../discordBot/lib/helper.js')
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');

const PluginManager = require("../../discordBot/lib/PluginManager.js");
const helper = require("../../discordBot/lib/helper.js");
const VariableManager = require("../../discordBot/lib/VariableManager.js");
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");

class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		plugin.on(client, 'interactionCreate', async interaction => {


			for (let i = 0; i < plugin['var'].iconAndText1.length; i++) {
				const obj = plugin['var'].iconAndText1[i];


				if (interaction.customId && interaction.customId.startsWith(plugin.id + '-' + obj.currency1)) {

					const myArray = interaction.customId.split("-");
					var userId = myArray[2]
					var currencyId = myArray[1]

					//bekomme Titel von currencyId 
					let title = "Leerer Titel"

					for (let i = 0; i < plugin['var'].iconAndText1.length; i++) {
						const obj = plugin['var'].iconAndText1[i];
	
						console.log(obj.currency1+" == "+currencyId)

						if (obj.currency1 == currencyId) {
							currencyId = obj.currency1
	
							if (obj.title) title = obj.title
						}
	
					}

					let erfolgreich = await showLeaderboard(db, interaction, currencyId, userId, title)
					if(erfolgreich){
						return await interaction.update({
							content: "",
							files: ['temp/finalpicture.png'],
							ephemeral: true
						})
					}else{
						return await interaction.update({
							content: 'Ein Fehler ist aufgetreten',
							ephemeral: true
						});
					}

				}


			}

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].name1) {

				let eingabeType = interaction.options.getString('type')

				let currencyId = false

				//bekommen titel von name
				let title = "Leerer Titel"

				for (let i = 0; i < plugin['var'].iconAndText1.length; i++) {
					const obj = plugin['var'].iconAndText1[i];

					if (obj.name1 == eingabeType) {
						currencyId = obj.currency1

						if (obj.title) title = obj.title
					}

				}


				//get User by eingabe oder der der es ausgeführt hat bei keiner eingabe
				let discordUser = interaction.options.getUser('user')
				let discordUserId = ""
				if (discordUser) {
					discordUserId = discordUser.id
				} else {
					discordUserId = interaction.user.id
				}

				const row = new ActionRowBuilder()

					for (let i = 0; i < plugin['var'].iconAndText1.length; i++) {
						const obj = plugin['var'].iconAndText1[i];

						row.addComponents(
							new ButtonBuilder()
								.setCustomId(plugin.id + "-" + obj.currency1 + "-" + discordUserId)
								.setLabel(obj.name1)
								.setStyle(ButtonStyle.Secondary),
						);
					}

				//konnte keine currencyId gefunden werden war die eingabe Falsch
				if (!currencyId) {
					return await interaction.reply({
						content: 'ungültige Eingabe versuche eins der folgenden',
						components: [row],
						ephemeral: true
					});
				}


				let erfolgreich = await showLeaderboard(db, interaction, currencyId, discordUserId, title)
				if(erfolgreich){
					return await interaction.reply({
						files: ['temp/finalpicture.png'],
						components: [row],
						ephemeral: true
					})
				}else{
					return await interaction.reply({
						content: 'Ein Fehler ist aufgetreten',
						ephemeral: true
					});
				}
				

			}

		});


	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		await PluginManager.reloadSlashCommands()
		await PluginManager.reloadEvents()

		return ({ saved: true, infoMessage: "Leaderboard geupdatet", infoStatus: "Info" })
	}
	async addCommands(plugin, commandMap) {

		if (!(
			plugin['var'].name1 &&
			plugin['var'].description1 &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].name1)
				.setDescription(plugin['var'].description1)
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('The user')
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('type')
						.setDescription('gebe ein: voice, chat oder berry')
						.setRequired(false)
				)
		)

	}
};

module.exports = new Plugin();

function getTextBuffer(text, x, y, anchor, fontsize) {


	if (!fontsize) fontsize = 14

	return Buffer.from(
		`<svg width="260" height="350">
			<style>
				.Rrrrr {
					font-size:${fontsize}px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="${anchor}">${text}</text>
			

		  </svg>`
	)
}


function getUsername(user) {



	
	//let str = user.username
	let str = user.globalName

	if (!str) str = "unbekannt"

	if (str.length > 10) str = str.substring(0, 10) + "..";

	return str
}

function getValue(user, currencyId) {
	let value = 0

	if (user.currency && user.currency[currencyId]) {
		value = user.currency[currencyId]
	}



	return value
}

function getIndex(gleichUserArray, discordId) {
	for (let i = 0; i < gleichUserArray.length; i++) {
		const element = gleichUserArray[i];
		if (discordId == element.discordId) {
			return i
		}
	}
}



async function showLeaderboard(db, interaction, currencyId, discordUserId, title) {
	let discordUserDatabase = await getUserFromDatabase(discordUserId, db)

	//wurde kein user gefunden nicht ausführen
	if (discordUserDatabase) {

		var chatActivity = discordUserDatabase['currency'][currencyId]
		if (!chatActivity) chatActivity = 0
		chatActivity = parseInt(chatActivity)

		/**/

		let DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
		let db = DatabaseManager.get()

		var ObjectId = require('mongodb').ObjectId;
		const collection = db.collection('userCollection');

		let top10 = await collection.find().sort({ ["currency." + currencyId]: -1, discordId: 1 }).limit(10).toArray();

		//get user eins ueber wert
		let ueberUserArray = await collection.find({ ["currency." + currencyId]: { $gt: chatActivity } }).sort({ ["currency." + currencyId]: 1, discordId: 1 }).limit(1).toArray();
		let ueberUser = ueberUserArray[0]

		$searchObj = {["currency." + currencyId]: chatActivity}
		
		if(chatActivity == 0){
			$searchObj = {$or: [
				{["currency." + currencyId]: {$exists: false}},
				{["currency." + currencyId]: chatActivity}]
			}
		}

		//get all user gleich dem wert da ist natührlich auch der user dabei um den es geht
		let gleichUserArray = await collection.find($searchObj).sort({ ["currency." + currencyId]: 1, discordId: 1 }).toArray();


		//get user eins ueber wert

		let searchObj = {["currency." + currencyId]: { $lt: chatActivity }}

		if(chatActivity == 0){
			searchObj = {$or: [
				{["currency." + currencyId]: {$exists: false}},
				{["currency." + currencyId]: { $lt: chatActivity }}]
			}
		}

		let kleinerUserArray = await collection.find(searchObj).sort({ ["currency." + currencyId]: -1, discordId: 1 }).limit(1).toArray();
		let kleinerUser = kleinerUserArray[0]

		let index = getIndex(gleichUserArray, discordUserDatabase.discordId)

		//jemand ist drüber
		if (index > 0) {
			ueberUser = gleichUserArray[index - 1]
		}

		//jemand ist drüber
		if (index + 1 < gleichUserArray.length) {
			kleinerUser = gleichUserArray[index + 1]
		}





		let count = await collection.countDocuments({ ["currency." + currencyId]: { $gt: chatActivity } });

		//rechne wie viele mit dem glechen wert drüber sind abhand des indexes
		count = count + index

		/**/

		const sharp = require('sharp')

		let mergeArray = []

		const SPACE_RANK = 50
		const SPACE_USERNAME = 55
		const SPACE_NUMBER = 230

		const SPACE_RANKLIST_TOP = 70

		mergeArray.push({ input: getTextBuffer(title, 130, 30, "middle", 20), left: 0, top: 0 })

		for (let i = 0; i < 10 && i < top10.length; i++) {
			if (top10[i].discordId == discordUserDatabase.discordId) {
				let imageBackground = await sharp('plugins/leaderboard/images/highlight.png').toBuffer()
				mergeArray.push({ input: imageBackground, left: 25, top: (SPACE_RANKLIST_TOP + i * 20) - 16 })
			}

			mergeArray.push({ input: getTextBuffer((i + 1) + ".", SPACE_RANK, SPACE_RANKLIST_TOP + i * 20, "end"), left: 0, top: 0 })
			mergeArray.push({ input: getTextBuffer(getUsername(top10[i]), SPACE_USERNAME, SPACE_RANKLIST_TOP + i * 20, "start"), left: 0, top: 0 })
			mergeArray.push({ input: getTextBuffer(getValue(top10[i], currencyId), SPACE_NUMBER, SPACE_RANKLIST_TOP + i * 20, "end"), left: 0, top: 0 })
		}

		if (count >= 10) {
			mergeArray.push({ input: getTextBuffer((count) + ".", SPACE_RANK, 290, "end"), left: 0, top: 0 })
			mergeArray.push({ input: getTextBuffer(getUsername(ueberUser), SPACE_USERNAME, 290, "start"), left: 0, top: 0 })
			mergeArray.push({ input: getTextBuffer(getValue(ueberUser, currencyId), SPACE_NUMBER, 290, "end"), left: 0, top: 0 })

			let imageBackground = await sharp('plugins/leaderboard/images/highlight.png').toBuffer()
			mergeArray.push({ input: imageBackground, left: 25, top: 310 - 18 })

			mergeArray.push({ input: getTextBuffer((count + 1) + ".", SPACE_RANK, 310, "end"), left: 0, top: 0 })
			mergeArray.push({ input: getTextBuffer(getUsername(discordUserDatabase), SPACE_USERNAME, 310, "start"), left: 0, top: 0 })
			mergeArray.push({ input: getTextBuffer(getValue(discordUserDatabase, currencyId), SPACE_NUMBER, 310, "end"), left: 0, top: 0 })

			if (kleinerUser) {
				mergeArray.push({ input: getTextBuffer((count + 2) + ".", SPACE_RANK, 330, "end"), left: 0, top: 0 })
				mergeArray.push({ input: getTextBuffer(getUsername(kleinerUser), SPACE_USERNAME, 330, "start"), left: 0, top: 0 })
				mergeArray.push({ input: getTextBuffer(getValue(kleinerUser, currencyId), SPACE_NUMBER, 330, "end"), left: 0, top: 0 })
			}

			await sharp('plugins/leaderboard/images/background2.png')
			.composite(mergeArray)
			.toFile('temp/finalpicture.png')

		}else{
			await sharp('plugins/leaderboard/images/background.png')
			.composite(mergeArray)
			.toFile('temp/finalpicture.png')
			
		}



			/*
		return await interaction.reply({
			files: ['temp/finalpicture.png'],
			ephemeral: true
		})*/

		return true

	} else {

		return false

	}
}
