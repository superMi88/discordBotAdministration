const dataManager = require("../../lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
const helper = require('../../lib/helper.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../lib/helper.js')


const PluginManager = require("../../lib/PluginManager.js");

const System = require("../../lib/system.js");

//0,1,2 -> Busch erstellen 3-> create animal
const RANDOM_NUMBER = 150

//berry cost animal
const STAR_COST = 50


const ImageCreator = require("./imageCreator.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");

class Plugin {
	userWhoCollectedStars = []

	async execute(client, plugin) {
		let db = DatabaseManager.get()

		plugin.on(client, Events.MessageCreate, async interaction => {

			//keine bot interactionen
			if (interaction.author.bot) return

			//test if message is from the correct server and no private message
			if(plugin['var'].server != interaction.guildId) return 

			await createStarsMaybe(client, plugin, db, this, RANDOM_NUMBER)
		})


		//shop reset um 0 Uhr
		if (!plugin.cronJob) plugin.cronJob = []
		plugin.cronJob.push(
			//0 0 0 * * *
			new CronJob('0 0 0 * * *', async function () {
				await createShop(client, plugin, db)
			}, null, true)

		)

		plugin.on(client, 'interactionCreate', async interaction => {

			if (interaction.commandName == plugin['var'].nameRecreateShop) {
				await createShop(client, plugin, db)
				return await interaction.reply({
					content: 'Shop neu erstellt',
					ephemeral: true
				});
			}

			if (interaction.commandName == plugin['var'].nameRecreateStar) {
				await createStars(client, plugin, db, this)
				return await interaction.reply({
					content: 'Stars neu erstellt',
					ephemeral: true
				});
			}

			if (interaction.commandName == plugin['var'].showSammelheft) {
				await showSammelheft(client, plugin, db, interaction.user, interaction, false)
			}

			//stars anzeigen
			if (interaction.commandName == plugin['var'].showStars) {

				let user = interaction.options.getUser('user')
				if (!user) {
					user = interaction.user
				}
				if (user.bot) {
					return await interaction.reply({
						content: 'Bots haben keine Sterne :O',
						ephemeral: true
					});
				}

				let discordUserDatabase = await getUserCurrencyFromDatabase(user.id, db)


				//await createShop(client, plugin, db)

				//wurde kein user gefunden nicht ausführen
				if (discordUserDatabase) {

					var stars = discordUserDatabase[plugin['var'].stars ]
					if (!stars) stars = 0

					stars = parseInt(stars)

					return await interaction.reply({
						content: 'Anzahl Sterne: ' + (stars).toFixed(0),
						ephemeral: true
					});

				} else {

					return await interaction.reply({
						content: 'Fehler beim Sterne anzeigen',
						ephemeral: true
					});

				}
			}

		})

		plugin.on(client, 'interactionCreate', async interaction => {

			if (interaction.customId == 'anleitung-waldspiel') {

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setDescription(`
				**Sammle Sterne*
				Sammle Sterne mit denen du Karten kaufen kannst

				**Kaufe Karten**
				Kaufe karten im Shop, so kannst du alle Kartensets vervollständigen
		
				`)
					.setTitle("Kartenspiel-Anleitung")

				return await interaction.reply({
					embeds: [exampleEmbed],
					ephemeral: true
				});
			}


			if (interaction.customId === 'collectStars') {

				if (this.userWhoCollectedStars.includes(interaction.user.id)) {
					await interaction.reply({ content: 'Du hast bereits Sterne gesammelt', ephemeral: true })
					return
				}

				let userCountWhoCollectedStars = this.userWhoCollectedStars.length
				this.userWhoCollectedStars.push(interaction.user.id)

				let collectedStars = 10

				collectedStars = collectedStars - userCountWhoCollectedStars
				if (collectedStars < 2) collectedStars = 2



				let discordUserId = interaction.user.id
				let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

				let starsUser = discordUserDatabase[plugin['var'].stars]
				if (!starsUser) starsUser = 0

				await updateUserFromDatabase(db, discordUserId, {
					$set: {
						["currency." + plugin['var'].berry]: starsUser + collectedStars,
					}
				})

				await interaction.reply({ content: '<@' + interaction.user.id + '> hat ' + collectedStars + ' Sterne gesammelt' })

			}

			if (isButton(interaction, 'buyCard')) {

				let cartType = getButtonParameter(interaction.customId)[1]
				let cartKey = getButtonParameter(interaction.customId)[2]


				let cardList = require("./cards-"+cartType+".js");
				let card = cardList[cartKey]

				let discordUserId = interaction.user.id
				let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

				let cardlist = discordUserDatabase["cardlist-"+cartType]
				if (!cardlist) cardlist = []

				currencyId = plugin['var'].stars

				let currencyCount = discordUserDatabase[currencyId]
				if (!currencyCount) currencyCount = 0
				if(!currencyId) return await interaction.reply({ content: 'Ein Fehler ist aufgetreten', ephemeral: true });

				if (cardlist.includes(cartKey)) {
					await interaction.reply({ content: 'Du hast diese Karte bereits', ephemeral: true });
				} else {
					if (currencyCount >= card.price) {

						cardlist.push(cartKey)
						await updateUserFromDatabase(db, discordUserId, {
							$set: {
								["currency." + currencyId]: currencyCount - card.price,
								["currency." + "cardlist-"+cartType]: cardlist,
							}
						})
						await interaction.reply({ content: 'Karte gekauft', ephemeral: true });
					} else {
						await interaction.reply({ content: 'Zu teuer du hast nur ' + currencyCount , ephemeral: true });
					}
				}
			}

			if (isButton(interaction, 'openSammelheft')) {

				let sammelheftType = getButtonParameter(interaction.customId)[1]
				let page = getButtonParameter(interaction.customId)[2]
				openSammelheft(client, plugin, db, interaction.user, interaction, true, sammelheftType, page)
			}
			
		});


	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		return ({ saved: true, infoMessage: "Einstellungen gespeichert", infoStatus: "Info" })
	}

	async addCommands(plugin, commandMap) {

		if (!commandMap) return

		if (!(plugin['var'].showStars && 
			plugin['var'].server &&
			plugin['var'].showSammelheft &&
			plugin['var'].descriptionShowSammelheft &&
			plugin['var'].nameRecreateShop &&
			plugin['var'].descriptionRecreateShop &&
			plugin['var'].nameRecreateStar &&
			plugin['var'].descriptionRecreateStar
		)) return []


		//TODO: benutzen in er Zukunft oder abändern
		const commandArray = []

		if (plugin['var'].showStars) {

			helper.addToCommandMap(commandMap, plugin['var'].server,
				new SlashCommandBuilder()
					.setName(plugin['var'].showStars)
					.setDescription('Zeige dein Backpack oder eines anderen Users')
					.addUserOption(option =>
						option
							.setName('user')
							.setDescription('The user')
							.setRequired(false)
					)
			)
		}

		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].showSammelheft)
				.setDescription(plugin['var'].descriptionShowSammelheft)
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('The user')
						.setRequired(false)
				)
		)


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].nameRecreateShop)
				.setDescription(plugin['var'].descriptionRecreateShop)
		)

		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].nameRecreateStar)
				.setDescription(plugin['var'].descriptionRecreateStar)
		)
	}

};

module.exports = new Plugin();

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}


async function createStars(client, plugin, db, thisObject) {

	thisObject.userWhoCollectedStars = []

	let channel = await client.channels.fetch(plugin['var'].gameChannel)

	//delete all messages in channel
	let fetched = await channel.messages.fetch({ limit: 100 });
	channel.bulkDelete(fetched);

	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('collectStars')
				.setLabel('Einsammeln')
				.setStyle(ButtonStyle.Primary),
		);

	addAnleitung(row)


	await channel.send({
		files: ['plugins/kartenspiel/images/backgrounds/sternenhimmel.png'],
		components: [row]
	})
}


async function showSammelheft(client, plugin, db, user, interaction, shouldUpdate) {

	let userid = user.id
	let discordUserDatabase = await getUserCurrencyFromDatabase(userid, db)

	//wurde kein user gefunden nicht ausführen
	if (discordUserDatabase) {

		//const currencyIdKarma = pluginOptions.berry //ändern
		const { ButtonBuilderExtended } = require("./ButtonBuilderExtended.js")

		let row1;
		if (user.id == interaction.user.id) {
			row1 = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilderExtended()
						.setCustomId('openSammelheft-pokemon-0')
						.setParameter(1)
						.setLabel('Pokemon')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('openSammelheft-disney-0')
						.setLabel('Disney')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('openSammelheft-yugioh-0')
						.setLabel('Yugioh')
						.setStyle(ButtonStyle.Primary)
				);
		}

		//await ImageCreator.createMeinWald(discordUserDatabase)

		if (shouldUpdate) {
			if (user.id == interaction.user.id) {
				return await interaction.update({
					files: ['plugins/kartenspiel/images/backgrounds/sternenhimmel.png'],
					components: [row1],
					ephemeral: true
				});
			} else {
				return await interaction.update({
					files: ['plugins/kartenspiel/images/backgrounds/sternenhimmel.png'],
					ephemeral: true
				});
			}

		} else {
			if (user.id == interaction.user.id) {
				return await interaction.reply({
					files: ['plugins/kartenspiel/images/backgrounds/sternenhimmel.png'],
					components: [row1],
					ephemeral: true
				});
			} else {
				return await interaction.reply({
					files: ['plugins/kartenspiel/images/backgrounds/sternenhimmel.png'],
					ephemeral: true
				});
			}
		}


	} else {

		return await interaction.reply({
			content: 'Ein Fehler ist aufgetreten bitte melde das Lowa',
			ephemeral: true
		});

	}
}




//type pokemon, yugioh, disney
async function openSammelheft(client, plugin, db, user, interaction, shouldUpdate, type, page) {

	let userid = user.id
	let discordUserDatabase = await getUserCurrencyFromDatabase(userid, db)

	//wurde kein user gefunden nicht ausführen
	if (discordUserDatabase) {

		const sharp = require('sharp')
		//const currencyIdKarma = pluginOptions.berry //ändern

		const row2 = new ActionRowBuilder()

		row2.addComponents(
			new ButtonBuilder()
				.setCustomId('openSammelheft-' + type + '-0')//setCustomization-idPlazierung-offsetItemliste
				.setLabel('<-')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId('openSammelheft-' + type + '-1')//editAnimalName-animalId
				.setLabel('->')
				.setStyle(ButtonStyle.Primary)
		)


		await ImageCreator.createSammelheft(discordUserDatabase, type, page)

		if (shouldUpdate) {

			return await interaction.update({
				files: ['temp/finalpicture.png'],
				components: [row2]
			});
		} else {
			return await interaction.reply({
				files: ['temp/finalpicture.png'],
				components: [row2],
				ephemeral: true
			});
		}

	} else {

		return await interaction.reply({
			content: 'Ein Fehler ist aufgetreten bitte melde das Lowa',
			ephemeral: true
		});

	}
}

function isButton(interaction, buttonId) {
	if (interaction.customId && (interaction.customId == buttonId || interaction.customId.includes(buttonId + "-"))) {
		return true
	}
	return false
}

function getButtonParameter(customId) {
	return customId.split("-")
}



async function createStarsMaybe(client, plugin, db, thisObj, randomNumber) {

	switch (getRandomInt(randomNumber)) {
		case 0:
		case 1:
		case 2:
			await createStars(client, plugin, db, thisObj)
			break;
		case 3:
		case 4:
			await createAnimal(client, plugin, db, thisObj)
			break;
		case 5:
		case 6:
		case 7:
			if(plugin['var'].eventOstern){
				await createOsterKorb(client, plugin, db, thisObj)
			}
			break;
		default:
			break;
	}
}

function getZuMeinemWaldButton() {
	return (
		new ButtonBuilder()
			.setCustomId('meinWald')
			.setLabel('Zu meinem Wald')
			.setStyle(ButtonStyle.Success)
	)
}


async function createShop(client, plugin, db) {
	if (plugin['var'].gameChannel && plugin['var'].shopChannel) {

		let shopChannel = await client.channels.fetch(plugin['var'].shopChannel)

		let fetched = await shopChannel.messages.fetch({ limit: 100 });
		shopChannel.bulkDelete(fetched);

		//random number 3

		arrCollections = ["disney", "yugioh", "pokemon"]


		let randomCollectonNumber = getRandomInt(arrCollections.length)
		let cardObj = require("./cards-"+arrCollections[randomCollectonNumber]+".js");

		var randomKey = function (obj) {
			var keys = Object.keys(obj);
			return keys[((keys.length - 1) * Math.random() << 0) + 1];
		};
	
		//create Background Shop
		let randomCardKey = randomKey(cardObj)


		objCard1 = {
			type: arrCollections[randomCollectonNumber],
			cardKey: randomCardKey
		}
		
		await ImageCreator.createShop(objCard1, objCard1, objCard1)
		

		//Erstellung shop
		const rowShop = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('buyCard-' + objCard1.type + '-' + randomCardKey)
				.setLabel('Kaufe "' + cardObj[randomCardKey].name + '"')
				.setStyle(ButtonStyle.Primary)
		);


		await shopChannel.send({
			files: ['temp/finalpicture.png'],
			components: [rowShop]
		})
		
	}
}





function addAnleitung(row) {
	row.addComponents(
		new ButtonBuilder()
			.setCustomId("anleitung-waldspiel")
			.setLabel("Wie geht das?")
			.setEmoji('✨')
			.setStyle(ButtonStyle.Secondary),
	);
}



function getShopBackgroundActionRow(plugin, Backgroundlist, einheit) {

	Backgroundlist = {
		ABBRECHEN: { name: "Default", filename: "Abbrechen" },
		...Backgroundlist
	}

	var randomKey = function (obj) {
		var keys = Object.keys(obj);
		return keys[((keys.length - 1) * Math.random() << 0) + 1];
	};

	//create Background Shop
	let backgroundId = randomKey(Backgroundlist)

	//Erstellung shop
	const rowShop = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('buyBackground-' + backgroundId + '-' + Backgroundlist[backgroundId].price+einheit)
				.setLabel('Kaufe Hintergrund "' + Backgroundlist[backgroundId].name + '"')
				.setStyle(ButtonStyle.Primary)
		);


	return {
		actionRow: rowShop,
		backgroundId: backgroundId
	}


	if (plugin['var'].eventWeihnachten) {
		return {
			...itemObj,
			...require("./backgroundsWeihnachten.js"),
		}
	}

	return {
		...itemObj,
		...require("./backgrounds.js"),
	}

}


function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}