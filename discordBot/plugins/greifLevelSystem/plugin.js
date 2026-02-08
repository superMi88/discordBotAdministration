
const dataManager = require("../../lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

const { v4: uuidv4 } = require('uuid');

var CronJob = require('cron').CronJob;

let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../lib/helper.js')
const { interactionSlashCommand } = require('../../lib/helper.js');

const PluginManager = require("../../lib/PluginManager.js");
const helper = require("../../lib/helper.js");
const VariableManager = require("../../lib/VariableManager.js");

const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
const DatabaseManager = require("../../lib/DatabaseManager.js");


class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].name1) {

				//get User by eingabe oder der der es ausgeführt hat bei keiner eingabe
				let discordUser = interaction.options.getUser('user')
				let discordId = ""
				if (discordUser) {
					discordId = discordUser.id
				} else {
					discordId = interaction.user.id
				}


				let discordUserDatabase = await getUserCurrencyFromDatabase(discordId, db)

				//wurde kein user gefunden nicht ausführen
				if (discordUserDatabase) {

					var voiceActivity = discordUserDatabase[plugin['var'].voiceActivity]
					if (!voiceActivity) voiceActivity = 0
					voiceActivity = parseInt(voiceActivity)

					var voiceLevel = discordUserDatabase[plugin['var'].voiceLevel]
					if (!voiceLevel) voiceLevel = 0
					voiceLevel = parseInt(voiceLevel)

					var chatActivity = discordUserDatabase[plugin['var'].chatActivity]
					if (!chatActivity) chatActivity = 0
					chatActivity = parseInt(chatActivity)

					var chatLevel = discordUserDatabase[plugin['var'].chatLevel]
					if (!chatLevel) chatLevel = 0
					chatLevel = parseInt(chatLevel)

					var barheight = 276

					var activityMaxValueChat = 200 + (5 * chatLevel )
					var chatActivityNew = Math.round(chatActivity / activityMaxValueChat * barheight)

					var activityMaxValueVoice = 200 + (5 * voiceLevel )
					var voiceActivityNew = Math.round(voiceActivity / activityMaxValueVoice * barheight)

					const sharp = require('sharp')

					let mergeArray = []

					if (chatActivityNew != 0) {
						let bufferChat = Buffer.from(
							`<svg>
								<style>
									.Rrrrr {
										font-size:24px;
										fill: #fff;
									}
									.backgroundColor {
										fill: #9090d2;
										
									}
									
								</style>
								<rect x="0" y="0" width="${chatActivityNew}" height="${16}" class="backgroundColor" />
					
							</svg>`
						)
						let sharpBuffer = await sharp(bufferChat).toBuffer()
						mergeArray.push({ input: sharpBuffer, left: 102, top: 162 })
					}

					if (voiceActivityNew != 0) {
						let bufferVoice = Buffer.from(
							`<svg>
								<style>
									.Rrrrr {
										font-size:24px;
										fill: #fff;
									}
									.backgroundColor {
										fill: #fd8480;
										
									}
									
								</style>
								<rect x="0" y="0" width="${voiceActivityNew}" height="${16}" class="backgroundColor" />
					
							</svg>
							`
						)
						let sharpBuffer2 = await sharp(bufferVoice).toBuffer()
						mergeArray.push({ input: sharpBuffer2, left: 102, top: 115})
					}

					const guild = await client.guilds.fetch(plugin['var'].server)

					let discordUser = await guild.members.resolve(discordId);

					let nameToShow = discordUser.nickname
					if(!nameToShow) nameToShow = discordUser.user.globalName


					let background = await sharp('plugins/greifLevelSystem/images/'+'background.png').toBuffer()
					mergeArray.push({ input: background, left: 0, top: 0 })


					mergeArray.push({ input: getTextBufferLeft(nameToShow, 100, 52), left: 0, top: 0 })

					//chat Level
					mergeArray.push({ input: getTextBufferLeft("Level "+chatLevel, 100, 150), left: 0, top: 0 })
					mergeArray.push({ input: getTextBufferRight(chatActivity+"/"+activityMaxValueChat, 380, 150), left: 0, top: 0 })

					//voice Level
					mergeArray.push({ input: getTextBufferLeft("Level "+voiceLevel, 100, 100), left: 0, top: 0 })
					mergeArray.push({ input: getTextBufferRight(voiceActivity+"/"+activityMaxValueVoice, 380, 100), left: 0, top: 0 })


					//download function
					function downloadImage(url, filepath) {
						return new Promise((resolve, reject) => {
							require('https').get(url, (res) => {
								if (res.statusCode === 200) {
									res.pipe(fs.createWriteStream(filepath))
										.on('error', reject)
										.once('close', () => resolve(filepath));
								} else {
									// Consume response data to free up memory
									res.resume();
									reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

								}
							});
						});
					}


					const fs = require('fs');

					//needed to fix lock bug and I cant unlink
					sharp.cache(false);

					let size = 64

					//create rounded Buffer Svg to make Image round later
					const roundedCorners = Buffer.from(
						`<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size}" ry="${size}"/></svg>`
					);

					var uuid = uuidv4()

					//download Image and save them in temp folder
					await downloadImage(discordUser.displayAvatarURL(), './temp/profileImage-' + discordUser.user.id + '-'+uuid+'.webp')
					let profileImage = await sharp('temp/profileImage-' + discordUser.user.id + '-'+uuid+'.webp').resize(size).composite([
						{ input: roundedCorners, blend: "dest-in" }
					]).png().toBuffer()


					mergeArray.push({ input: profileImage, left: 20, top: 20 })


					

					let backgroundFilename = 'backgroundLayer.png'
					
					
					await sharp('plugins/greifLevelSystem/images/'+backgroundFilename)
						.composite(mergeArray)
						.toFile('temp/finalpicture.png')



					await interaction.reply({
						files: ['temp/finalpicture.png'],
						ephemeral: true
					})

					/*
					await interaction.reply({
						files: ['temp/finalpicture.png'],
						ephemeral: true
					})*/

					
					fs.unlink('./temp/finalpicture.png', function (err, result) {
						if (err) console.log('error', err);
					})
					fs.unlink('./temp/profileImage-' + discordUser.user.id + '-'+uuid+'.webp', function (err, result) {
						if (err) console.log('error', err);
					})

					return 


				} else {

					return await interaction.reply({
						content: 'Fehler beim anzeigen',
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

		return ({ saved: true, infoMessage: "System geupdatet", infoStatus: "Info" })
	}
	async addEvents(plugin, eventsArray){

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Event,
				variable: plugin['var'].chatActivity,
				message: "benachrichte mich wenn chat erhört wird"
			},
		)
		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Event,
				variable: plugin['var'].voiceActivity,
				message: "benachrichte mich wenn voice erhört wird"
			},
		)

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Trigger,
				variable: plugin['var'].chatActivity,
				message: "löst den trigger aus chat"
			},
		)

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Trigger,
				variable: plugin['var'].chatLevel,
				message: "löst den trigger aus chat"
			},
		)

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Trigger,
				variable: plugin['var'].voiceActivity,
				message: "löst den trigger aus voice"
			},
		)

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Trigger,
				variable: plugin['var'].voiceLevel,
				message: "löst den trigger aus voice"
			},
		)

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Trigger,
				variable: plugin['var'].coins,
				message: "erhöht den coin betrag um 5 beim level up"
			},
		)

	}
	async addCommands(plugin, commandMap) {

		//if(!commandMap) return

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
		)

	}
	async triggerEvent(client, plugin, db, discordUserId, currencyId, oldValue, newValue){

		messageCounterAdd(plugin, client, discordUserId, currencyId, oldValue, newValue, db)
	}
	

};

module.exports = new Plugin();

//gebe einer Person Karma 
//logFixed -> nachkommastellen in der log ausgabe
async function messageCounterAdd(plugin, client, discordUserId, currencyId, oldActivityValue, newActivityValue, db) {

	if (isNaN(oldActivityValue) || isNaN(newActivityValue) ) return

	let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

	if (discordUserDatabase) {

		let nextLevelXpChat = 200 + (5 * discordUserDatabase[plugin['var'].chatLevel] )

		if(currencyId == plugin['var'].chatActivity && newActivityValue >= nextLevelXpChat){
			console.log("reg")
			console.log(plugin['var'].coins)
			//erhöhe Level um 1
			await VariableManager.counterAdd(discordUserId, 1, plugin['var'].chatLevel, db, plugin)
			//verringere Activity um 200
			await VariableManager.counterAdd(discordUserId, -nextLevelXpChat, plugin['var'].chatActivity, db, plugin)
		}



		let nextLevelXpVoice = 200 + (5 * discordUserDatabase[plugin['var'].voiceLevel] )

		if(currencyId == plugin['var'].voiceActivity && newActivityValue >= nextLevelXpVoice){

			//erhöhe coins um 5
			console.log("reg")
			console.log(plugin['var'].coins)
			await VariableManager.counterAdd(discordUserId, 5, plugin['var'].coins, db, plugin)
			//erhöhe Level um 1
			await VariableManager.counterAdd(discordUserId, 1, plugin['var'].voiceLevel, db, plugin)
			//verringere Activity um 200
			await VariableManager.counterAdd(discordUserId, -nextLevelXpVoice, plugin['var'].voiceActivity, db, plugin)
		}

	}
}





function getTextBuffer(text, x, y, fontsizeInPixel) {

	if(!fontsizeInPixel) fontsizeInPixel = 14

	return Buffer.from(
		`<svg width="393" height="280">
			<style>
				.Rrrrr {
					font-size:${fontsizeInPixel}px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">${text}</text>
			

		  </svg>`
	)
}

function getTextBufferLeft(text, x, y, fontsizeInPixel) {

	if(!fontsizeInPixel) fontsizeInPixel = 14

	return Buffer.from(
		`<svg width="393" height="280">
			<style>
				.Rrrrr {
					font-size:${fontsizeInPixel}px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="start">${text}</text>
			

		  </svg>`
	)
}

function getTextBufferRight(text, x, y, fontsizeInPixel) {

	if(!fontsizeInPixel) fontsizeInPixel = 14

	return Buffer.from(
		`<svg width="393" height="280">
			<style>
				.Rrrrr {
					font-size:${fontsizeInPixel}px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="end">${text}</text>
			

		  </svg>`
	)
}


function isButton(interaction, buttonId) {
	if(interaction.customId && ( interaction.customId == buttonId || interaction.customId.includes(buttonId+"-"))){
		return true
	}
	return false
}

function getButtonParameter(customId) {
	return customId.split("-")
}