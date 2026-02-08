//const dataManager = require("../../lib/dataManager.js")
//const Animallist = require("./animals.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
const helper = require('../../lib/helper.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../lib/helper.js')

const { ObjectId } = require("mongodb");

const PluginManager = require("../../lib/PluginManager.js");

const System = require("../../lib/system.js");


//custom Id handling
const CustomId = require('../../lib/CustomId.js');
const ItemList = require('./obj/ItemList.js');
const Backgroundlist = require('./obj/BackgroundList.js');


const ImageCreator = require("./imageCreator.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");

const waldspiel = require("./lib/waldspiel.js");

const VariableManager = require("../../lib/VariableManager.js");
const WaldspielUser = require('./waldspieluser.js');

//status code for stuff that happens :)
const statusCode = require("./statusCode.js");

const ExtensionManager = require('./ExtensionManager');


class Plugin {

	lastUpdateTimestamp = 5

	constructor() {
		console.log("created Plugin Waldspiel")
	}

	async execute(client, plugin) {
		let db = DatabaseManager.get()

		ExtensionManager.loadExtensions();

		ExtensionManager.preExecute(client, plugin);


		plugin.on(client, Events.MessageCreate, async interaction => {

			//keine bot interactionen
			if (interaction.author.bot) return

			//test if message is from the correct server and no private message
			if (plugin['var'].server != interaction.guildId) return

			await waldspiel.createWald(client, plugin, db)
		})


		//shop reset um 0 Uhr
		if (!plugin.cronJob) plugin.cronJob = []
		plugin.cronJob.push(
			//0 0 0 * * *
			new CronJob('0 0 0 * * *', async function () {
				await waldspiel.createShop(client, plugin, db)

				await ExtensionManager.onDailyTick(client, plugin, db)

			}, null, true)

		)

		plugin.cronJob.push(
			//0 0 0 * * *
			new CronJob('0 * * * * *', async function () {

				// timestamp in milliseconds
				let currentTimestamp = Date.now();

				//if test if min 30 min um since last update
				console.log("last update")
				console.log(Math.floor(currentTimestamp / 1000 / 60) + " > " + Math.floor((this.lastUpdateTimestamp / 1000 / 60) + 120))

				if (Math.floor(currentTimestamp / 1000 / 60) > Math.floor((this.lastUpdateTimestamp / 1000 / 60) + 120)) {

					console.log("neuer Wald wird erstellt")
					this.lastUpdateTimestamp = currentTimestamp

					switch (waldspiel.getRandomInt(7)) {
						case 0:
						case 1:
						case 2:
							await waldspiel.createBusch(client, plugin, db)
							break;
						case 3:
						case 4:
							await waldspiel.createAnimal(client, plugin, db)
							break;
						case 5:
						case 6:
						case 7:
							if (plugin['var'].eventOstern) {
								await waldspiel.createOsterKorb(client, plugin, db)
							}
							break;
						default:
							break;
					}

				}


			}.bind(this), null, true)

		)

		/*all carrotevent events (moved to extension) and other interactions*/
		plugin.on(client, Events.InteractionCreate, async interaction => {

			let customId = new CustomId(interaction)

			/* carrotEvent interactions moved to CarrotEvent extension */

			if (interaction.commandName == plugin['var'].nameRecrateShop) {
				await interaction.reply({
					content: 'Versuche Shop neu zu erstellen...',
					ephemeral: true
				});
				await waldspiel.createShop(client, plugin, db)
				return await interaction.editReply({
					content: 'Shop neu wurde erstellt',
					ephemeral: true
				});
			}
			if (interaction.commandName == plugin['var'].nameRecrateWald) {
				await waldspiel.createWald(client, plugin, db, true)
				return await interaction.reply({
					content: 'Wald neu wurde erstellt',
					ephemeral: true
				});
			}

			//backpacks mit berrys usw anzeigen
			if (interaction.commandName == plugin['var'].showBackpack) {


				let user = interaction.options.getUser('user')
				if (!user) {
					user = interaction.user
				}
				if (user.bot) {
					return await interaction.reply({
						content: 'Der Bot hat kein Backpack :D',
						ephemeral: true
					});
				}

				let discordUserDatabase = await getUserCurrencyFromDatabase(user.id, db)

				//wurde kein user gefunden nicht ausführen
				if (discordUserDatabase) {

					var berryCount = discordUserDatabase[plugin['var'].berry]
					if (!berryCount) berryCount = 0
					berryCount = parseInt(berryCount)

					var eggCount = discordUserDatabase[plugin['var'].eggs]
					if (!eggCount) eggCount = 0
					eggCount = parseInt(eggCount)

					var sweetsCount = discordUserDatabase[plugin['var'].sweets]
					if (!sweetsCount) sweetsCount = 0
					sweetsCount = parseInt(sweetsCount)


					let imageAndCountArray = []

					if (berryCount > 0) {
						imageAndCountArray.push(
							{
								filename: 'berry.png',
								count: berryCount
							},
						)
					}
					if (eggCount > 0) {
						imageAndCountArray.push(
							{
								filename: 'ostereier.png',
								count: eggCount
							},
						)
					}

					if (sweetsCount > 0) {
						imageAndCountArray.push(
							{
								filename: 'sweets.png',
								count: sweetsCount
							},
						)
					}

					return await interaction.reply({
						files: [await ImageCreator.showBackpack(plugin, imageAndCountArray)],
						/*content: 'berry: ' + (berry).toFixed(0),*/
						ephemeral: true
					});

				} else {

					return await interaction.reply({
						content: 'Fehler beim Backpack anzeigen',
						ephemeral: true
					});

				}
			}

			if (customId.is('meinWald') /*isButton(interaction, 'meinWald')*/) {
				await waldspiel.showMeinWald(client, plugin, db, interaction.user, interaction, true)
			}

			//Tiere anzeigen
			if (interaction.commandName == plugin['var'].name2) {

				let user = interaction.options.getUser('user')
				if (!user) {
					user = interaction.user
				}
				if (user.bot) {
					return await interaction.reply({
						content: 'Bots leben alleine sie haben keinen Wald :(',
						ephemeral: true
					});
				}

				await waldspiel.showMeinWald(client, plugin, db, user, interaction, false)
			}

			if (interaction.customId == 'anleitungWaldspiel') {


				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setDescription(`
				**🌳Beeren und Tiere sammeln**
				In <#1109197289177747597> tauchen ab und an Beerenbüsche und Tiere auf die eingesammelt werden können.
				-> Beerenbüsche geben Beeren
				-> Tiere kann man mit 50 Beeren einsammeln (max.3 Tiere passen in den eigenen Wald)
				
				**🌳Tierdekoration kaufen**
				in <#1109197315694141540> gibt es jeden Tag um 2 Uhr neue Angebote für Tierkleidung mit denen du deine Tiere ankleiden kannst.
				
				**🌳Eigenen Wald anschauen und bearbeiten**
				mit dem Befehl /meinwald [user] kannst du deinen oder den Wald von anderen anschauen und bearbeiten.
				
				mit dem Befehl /backpack [user] kannst du sehen wie viel Beeren du oder ein anderer User hat
				
				*Viel Spaß!! Für Verbesserungsvorschläge oder Bugmeldungen gerne im Forum server Rückmeldung geben oder <@216604763003813888> privat schreiben*
				`)
					.setTitle("Waldspiel-Anleitung")

				return await interaction.reply({
					embeds: [exampleEmbed],
					ephemeral: true
				});
			}

			if (interaction.customId == 'postWald') {

				let user = interaction.user

				let discordUserDatabase = await getUserCurrencyFromDatabase(user.id, db)

				if (discordUserDatabase) {
					await ImageCreator.createMeinWald(discordUserDatabase)


					let postChannel = await client.channels.fetch(plugin['var'].postChannel)

					await postChannel.send({
						files: ['temp/finalpicture.png'],
						content: "Wald von <@" + user.id + ">"
					})

					//silent update
					await interaction.update({})
				}

			}

			if (interaction.customId === 'collectBerry') {
				await waldspiel.collectBerry(interaction, plugin, db)
			}

			if (interaction.customId === 'collectSweets') {
				await waldspiel.collectSweets(interaction, plugin, db)
			}

			await ExtensionManager.onInteraction(interaction, client, plugin, db);
			/* Moved to ExtensionManager hook
			if (interaction.customId === 'collectOsterkorb') {
				await waldspiel.collectOsterkorb(interaction, plugin, db)
			}
			*/

			//selectedCustomization-idPlazierung
			if (isButton(interaction, 'showStorageWithoutEdit')) {
				let discordUserId = interaction.user.id
				let db = DatabaseManager.get()

				//-1 means no edit
				let animalPlazierungsId = 'noedit'
				let currentPage = getButtonParameter(interaction.customId)[2]

				let discordUserDatabase = await getUserCurrencyFromDatabase(interaction.user.id, db)

				const collectionAnimal = db.collection('animals');
				const arrAnimal = await collectionAnimal.find({ ownerDiscordId: discordUserId }).sort({ type: 1 }).toArray()

				const arrStorageAnimals = arrAnimal.filter(
					(animal) =>
						animal._id.toString() !== (discordUserDatabase.animalId1 ? discordUserDatabase.animalId1.toString() : "") &&
						animal._id.toString() !== (discordUserDatabase.animalId2 ? discordUserDatabase.animalId2.toString() : "") &&
						animal._id.toString() !== (discordUserDatabase.animalId3 ? discordUserDatabase.animalId3.toString() : "")
				);


				await waldspiel.showMeinStorage(client, plugin, db, interaction.user, interaction, arrStorageAnimals, animalPlazierungsId, currentPage)
			}

			//selectedCustomization-idPlazierung
			if (isButton(interaction, 'showStorage')) {
				let discordUserId = interaction.user.id
				let db = DatabaseManager.get()

				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]
				let currentPage = getButtonParameter(interaction.customId)[2]

				let discordUserDatabase = await getUserCurrencyFromDatabase(interaction.user.id, db)

				const collectionAnimal = db.collection('animals');
				const arrAnimal = await collectionAnimal.find({ ownerDiscordId: discordUserId }).sort({ type: 1 }).toArray()

				const arrStorageAnimals = arrAnimal.filter(
					(animal) =>
						animal._id.toString() !== (discordUserDatabase.animalId1 ? discordUserDatabase.animalId1.toString() : "") &&
						animal._id.toString() !== (discordUserDatabase.animalId2 ? discordUserDatabase.animalId2.toString() : "") &&
						animal._id.toString() !== (discordUserDatabase.animalId3 ? discordUserDatabase.animalId3.toString() : "")
				);

				await waldspiel.showMeinStorage(client, plugin, db, interaction.user, interaction, arrStorageAnimals, animalPlazierungsId, currentPage)
			}

			//selectedCustomization-idPlazierung
			if (isButton(interaction, 'sendToStorage')) {

				let discordId = interaction.user.id
				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]

				await waldspiel.sendToStorage(interaction, db, discordId, animalPlazierungsId);
				await waldspiel.showMeinWald(client, plugin, db, interaction.user, interaction, true)

			}

			//selectedCustomization-idPlazierung-itemId
			if (isButton(interaction, 'selectedCustomization')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]
				let itemId = getButtonParameter(interaction.customId)[2]

				if (itemId == "ABBRECHEN") itemId = 0

				const collection = db.collection('animals');

				await collection.updateOne(
					{ _id: ObjectId(animalObjId) },
					{ $set: { customization: itemId } }
				);

				await waldspiel.showMeinWald(client, plugin, db, interaction.user, interaction, true)

			}

			if (isButton(interaction, 'setBackgroundCustomization')) {
				let itemId = getButtonParameter(interaction.customId)[1]

				if (itemId == "ABBRECHEN") itemId = 0

				let discordUserId = interaction.user.id

				await updateUserFromDatabase(db, discordUserId, {
					$set: {
						["currency." + "background"]: itemId,
					}
				})

				await waldspiel.showMeinWald(client, plugin, db, interaction.user, interaction, true)
			}

			//[1]animalId
			if (isButton(interaction, 'editAnimal')) {
				let animalId = parseInt(getButtonParameter(interaction.customId)[1])

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalId)
			}

			if (isButton(interaction, 'editBackground')) {
				let offset = parseInt(getButtonParameter(interaction.customId)[1])


				let discordUserId = interaction.user.id
				let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

				let backgroundlistdatabase = discordUserDatabase["backgroundlist"]
				if (!backgroundlistdatabase) backgroundlistdatabase = []

				//Add Both default values for the Background
				backgroundlistdatabase.unshift("SUMMER")
				backgroundlistdatabase.unshift("DEFAULT")

				let button1offset = offset - 1
				if (button1offset < 0) button1offset = backgroundlistdatabase.length - 1

				let button2offset = offset + 1
				if (button2offset >= backgroundlistdatabase.length) button2offset = 0

				const rowItemliste = new ActionRowBuilder()
					.addComponents(
						waldspiel.getZuMeinemWaldButton(),
						new ButtonBuilder()
							.setCustomId('Button1editBackground-' + button1offset)
							.setLabel('<-')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('setBackgroundCustomization-' + backgroundlistdatabase[offset]) //hier wieder back zu meinem wald mit dme entsprechenden ausgewälten ding da 
							.setLabel('Auswählen')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('Button2editBackground-' + button2offset)
							.setLabel('->')
							.setStyle(ButtonStyle.Primary),
					);

				await ImageCreator.createEditBackground(discordUserDatabase, backgroundlistdatabase, offset)

				return await interaction.update({
					files: ['temp/finalpicture.png'],
					components: [rowItemliste],
					ephemeral: true
				});
			}

			if (isButton(interaction, 'selectStorageNumber')) {
				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]

				// Create the modal
				const modal = new ModalBuilder()
					.setCustomId('getFromStorage-' + animalPlazierungsId)
					.setTitle('Boxnummer');

				// Add components to modal

				// Create the text input components
				const nameInput = new TextInputBuilder()
					.setCustomId('storageid')
					// The label is the prompt the user sees for this input
					.setLabel("Wie ist die Boxnummer des Tieres?")
					// Short means only a single line of text
					.setStyle(TextInputStyle.Short);

				// An action row only holds one text input,
				// so you need one action row per text input.
				const firstActionRow = new ActionRowBuilder().addComponents(
					nameInput
				);

				// Add inputs to the modal
				modal.addComponents(firstActionRow);

				// Show the modal to the user
				await interaction.showModal(modal);
			}

			if (isButton(interaction, 'getFromStorage')) {
				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]
				let storageId = interaction.fields.getTextInputValue("storageid")
				storageId = parseInt(storageId)
				storageId--

				let discordUserId = interaction.user.id
				let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

				const collectionAnimal = db.collection('animals');
				const arrAnimal = await collectionAnimal.find({ ownerDiscordId: discordUserId }).sort({ type: 1 }).toArray()

				const arrStorageAnimals = arrAnimal.filter(
					(animal) =>
						animal._id.toString() !== (discordUserDatabase.animalId1 ? discordUserDatabase.animalId1.toString() : "") &&
						animal._id.toString() !== (discordUserDatabase.animalId2 ? discordUserDatabase.animalId2.toString() : "") &&
						animal._id.toString() !== (discordUserDatabase.animalId3 ? discordUserDatabase.animalId3.toString() : "")
				);

				if (isNaN(storageId) || storageId >= arrStorageAnimals.length || storageId < 0) {
					return await interaction.reply({
						content: 'ungültige Eingabe',
						ephemeral: true
					});
				}

				let animal = arrStorageAnimals[storageId]

				const collection = db.collection('userCollection');
				System.log(db, System.status.INFO, "[waldspiel]", interaction.user.username + "[" + interaction.user.id + "] holt Tier von storageId id:" + storageId)


				await collection.update({ discordId: interaction.user.id }, [
					{
						$set: {
							["currency." + "animalId" + animalPlazierungsId]: animal._id
						}
					}
				]);


				await waldspiel.showMeinWald(client, plugin, db, interaction.user, interaction, true)

				//return await interaction.deferUpdate()

			}

			//editAnimalName-animalObjId
			if (isButton(interaction, 'editAnimalName')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]

				// Create the modal
				const modal = new ModalBuilder()
					.setCustomId('changeName-' + animalObjId)
					.setTitle('Name Ändern');

				// Add components to modal

				// Create the text input components
				const nameInput = new TextInputBuilder()
					.setCustomId('name')
					// The label is the prompt the user sees for this input
					.setLabel("Wie soll dein Tier heißen? ('-' = kein name)")
					// Short means only a single line of text
					.setStyle(TextInputStyle.Short);

				// An action row only holds one text input,
				// so you need one action row per text input.
				const firstActionRow = new ActionRowBuilder().addComponents(
					nameInput
				);

				// Add inputs to the modal
				modal.addComponents(firstActionRow);

				// Show the modal to the user
				await interaction.showModal(modal);
			}

			//changeName-animalObjId-CHANNELID-MESSAGEID
			if (isButton(interaction, 'changeName')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]

				let newName = interaction.fields.getTextInputValue("name")
				if (newName == "-") {
					newName = ""
				}

				const collection = db.collection('animals');

				await collection.updateOne(
					{ _id: ObjectId(animalObjId) },
					{ $set: { name: newName } }
				);

				await waldspiel.showMeinWald(client, plugin, db, interaction.user, interaction, true)
			}

			if (isButton(interaction, 'removeAnimal')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]

				const collection = db.collection('animals');

				let animal = await collection.findOne(
					{ _id: ObjectId(animalObjId) }
				);

				await collection.updateOne(
					{ _id: ObjectId(animalObjId) },
					{ $set: { ownerDiscordId: animal.ownerDiscordId + "-DELETED" } }
				);

				let discordUserId = interaction.user.id
				let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

				if (ObjectId(animalObjId).equals(discordUserDatabase.animalId1)) {
					await updateUserFromDatabase(db, interaction.user.id, {
						$set: {
							["currency." + "animalId1"]: ""
						}
					})
				}
				if (ObjectId(animalObjId).equals(discordUserDatabase.animalId2)) {
					await updateUserFromDatabase(db, interaction.user.id, {
						$set: {
							["currency." + "animalId2"]: ""
						}
					})
				}
				if (ObjectId(animalObjId).equals(discordUserDatabase.animalId3)) {
					await updateUserFromDatabase(db, interaction.user.id, {
						$set: {
							["currency." + "animalId3"]: ""
						}
					})
				}

				await waldspiel.showMeinWald(client, plugin, db, interaction.user, interaction, true)
			}

			//setCustomization-idPlazierung-offsetItemliste
			if (isButton(interaction, 'setCustomization')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]
				let offset = parseInt(getButtonParameter(interaction.customId)[2])


				let discordUserId = interaction.user.id
				let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

				let itemliste = discordUserDatabase["itemlist"]
				if (!itemliste) itemliste = []

				itemliste.unshift("ABBRECHEN")//add item ABBRECHEN first of the array, item 0 means no item


				const sharp = require('sharp')


				let button1offset = offset - 1
				if (button1offset < 0) button1offset = itemliste.length - 1

				let button2offset = offset + 1
				if (button2offset >= itemliste.length) button2offset = 0

				const rowItemliste = new ActionRowBuilder()
					.addComponents(
						waldspiel.getZuMeinemWaldButton(),
						new ButtonBuilder()
							.setCustomId('Button1setCustomization-' + animalObjId + '-' + button1offset)
							.setLabel('<-')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('selectedCustomization-' + animalObjId + '-' + itemliste[offset]) //hier wieder back zu meinem wald mit dme entsprechenden ausgewälten ding da 
							.setLabel('Auswählen')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('Button2setCustomization-' + animalObjId + '-' + button2offset)
							.setLabel('->')
							.setStyle(ButtonStyle.Primary),
					);

				//.resize(80)

				await ImageCreator.createSetCustomization(itemliste, offset)

				return await interaction.update({
					files: ['temp/finalpicture.png'],
					components: [rowItemliste],
					ephemeral: true
				});


			}

			if (isButton(interaction, 'buyItem')) {
				let itemId = getButtonParameter(interaction.customId)[1]

				const itemlistObj = new ItemList()
				const item = itemlistObj.getListAll()[itemId]

				if (!item) {
					return await interaction.reply({ content: 'Item nicht gefunden', ephemeral: true });
				}

				let price = item.price
				let priceEinheit = item.currency

				let discordUserId = interaction.user.id
				let currencyId = waldspiel.getCurrencyIdByPriceChar(plugin, priceEinheit);

				if (!currencyId) {
					return await interaction.reply({ content: 'Ein Fehler ist aufgetreten', ephemeral: true });
				}

				let waldspieluser = new WaldspielUser(discordUserId)
				let status = await waldspieluser.buyItem(itemId, price, currencyId)

				switch (status.statusCode) {
					case statusCode.SUCCESS:
						await interaction.reply({ content: 'Item gekauft', ephemeral: true });
						break;
					case statusCode.NOT_ENOUGH_MONEY:
						await interaction.reply({ content: 'Zu teuer du hast nur ' + status.currencyCount, ephemeral: true });
						break;
					case statusCode.ALREADY_HAS_ITEM:
						await interaction.reply({ content: 'Du hast dieses Item bereits', ephemeral: true });
						break;
				}
			}

			if (isButton(interaction, 'buyBackground')) {
				let backgroundId = getButtonParameter(interaction.customId)[1]

				const backgroundlistObj = new Backgroundlist()
				const background = backgroundlistObj.getBackgroundListAll()[backgroundId]

				if (!background) {
					return await interaction.reply({ content: 'Hintergrund nicht gefunden', ephemeral: true });
				}

				let price = background.price
				let priceEinheit = background.currency

				let discordUserId = interaction.user.id
				let currencyId = waldspiel.getCurrencyIdByPriceChar(plugin, priceEinheit);

				if (!currencyId) {
					return await interaction.reply({ content: 'Ein Fehler ist aufgetreten', ephemeral: true });
				}

				let waldspieluser = new WaldspielUser(discordUserId)
				let status = await waldspieluser.buyBackground(backgroundId, price, currencyId)

				switch (status.statusCode) {
					case statusCode.SUCCESS:
						await interaction.reply({ content: 'Background gekauft', ephemeral: true });
						break;
					case statusCode.NOT_ENOUGH_MONEY:
						await interaction.reply({ content: 'Zu teuer du hast nur ' + status.currencyCount, ephemeral: true });
						break;
					case statusCode.ALREADY_HAS_ITEM:
						await interaction.reply({ content: 'Du hast diesen Hintergrund bereits', ephemeral: true });
						break;
				}

			}

			if (isButton(interaction, 'catchAnimal')) {
				let animalType = getButtonParameter(interaction.customId)[1]
				let discordUserId = interaction.user.id

				await waldspiel.catchAnimal(interaction, plugin, animalType, discordUserId, db)
			}
		});
	}

	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if (!status.saved) {
			return status
		}

		return ({ saved: true, infoMessage: "Einstellungen gespeichert", infoStatus: "Info" })
	}

	async addEvents(plugin, eventsArray) {

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Trigger,
				variable: plugin['var'].berry,
				message: "löst den trigger aus berry"
			},
		)
	}

	async addCommands(plugin, commandMap) {

		if (!commandMap) return

		if (!(plugin['var'].server &&
			plugin['var'].name2 &&
			plugin['var'].description2 &&
			plugin['var'].nameRecrateShop &&
			plugin['var'].descriptionRecrateShop &&
			plugin['var'].nameRecrateWald &&
			plugin['var'].descriptionRecrateWald
		)) return []


		//TODO: benutzen in er Zukunft oder abändern
		const commandArray = []

		if (plugin['var'].showBackpack) {

			helper.addToCommandMap(commandMap, plugin['var'].server,
				new SlashCommandBuilder()
					.setName(plugin['var'].showBackpack)
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
				.setName(plugin['var'].name2)
				.setDescription(plugin['var'].description2)
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('The user')
						.setRequired(false)
				)
		)


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].nameRecrateShop)
				.setDescription(plugin['var'].descriptionRecrateShop)
		)

		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].nameRecrateWald)
				.setDescription(plugin['var'].descriptionRecrateWald)
		)

	}


};

module.exports = new Plugin();



function isButton(interaction, buttonId) {
	if (interaction.customId && (interaction.customId == buttonId || interaction.customId.includes(buttonId + "-"))) {
		return true
	}
	return false
}

function getButtonParameter(customId) {
	return customId.split("-")
}