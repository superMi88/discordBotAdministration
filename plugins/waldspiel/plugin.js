//const dataManager = require("../../discordBot/lib/dataManager.js")
//const Animallist = require("./animals.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
const helper = require('../../discordBot/lib/helper.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, Events } = require('discord.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../discordBot/lib/helper.js')

const { ObjectId } = require("mongodb");

const PluginManager = require("../../discordBot/lib/PluginManager.js");
const UserData = require("../../discordBot/lib/UserData.js");
const System = require("../../discordBot/lib/system.js");


//custom Id handling
const CustomId = require('../../discordBot/lib/CustomId.js');
const ItemList = require('./obj/ItemList.js');
const Backgroundlist = require('./obj/BackgroundList.js');


const WaldCreator = require("./imageCreator/WaldCreator.js");
const ImageCreator = require("./imageCreator.js");
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");

const waldspiel = require("./lib/waldspiel.js");

const VariableManager = require("../../discordBot/lib/VariableManager.js");
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

				let discordUserData = await UserData.get(user.id);

				//wurde kein user gefunden nicht ausführen
				if (discordUserData) {

					var berryCount = discordUserData.getCurrency(plugin['var'].berry);
					if (!berryCount) berryCount = 0
					berryCount = parseInt(berryCount)

					var eggCount = discordUserData.getCurrency(plugin['var'].eggs);
					if (!eggCount) eggCount = 0
					eggCount = parseInt(eggCount)

					var sweetsCount = discordUserData.getCurrency(plugin['var'].sweets);
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

			if (isButton(interaction, 'waldSettingsDropdown')) {
				let choice = interaction.values[0];
				if (choice === 'editBackground') {
					interaction.customId = 'editBackground-0'; // Route to page 0
				} else {
					interaction.customId = choice; // Route to button logic
				}
			}

			if (isButton(interaction, 'selectBackgroundDropdown')) {
				let choice = interaction.values[0];
				interaction.customId = `setBackgroundCustomization-${choice}`;
			}

			if (isButton(interaction, 'animalSettingsDropdown')) {
				let animalObjId = getButtonParameter(interaction.customId)[1];
				let choice = interaction.values[0];

				if (choice.startsWith('editCustomization-')) {
					let slot = choice.split('-')[1];
					interaction.customId = `setCustomization-${animalObjId}-0-${slot}`;
				} else if (choice === 'editAnimation') {
					interaction.customId = `setAnimation-${animalObjId}-0`;
				} else if (choice === 'editName') {
					interaction.customId = `editAnimalName-${animalObjId}`;
				}
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

				let discordUserData = await UserData.get(user.id);

				if (discordUserData) {
					let filename = await ImageCreator.createMeinWald(discordUserData.currencyData)


					let postChannel = await client.channels.fetch(plugin['var'].postChannel)

					await postChannel.send({
						files: [filename],
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
				let searchQuery = getButtonParameter(interaction.customId)[3] || ""

				let discordUserData = await UserData.get(interaction.user.id);
				let cData = discordUserData.currencyData;

				const collectionAnimal = db.collection('animals');
				const arrAnimal = await collectionAnimal.find({ ownerDiscordId: discordUserId }).sort({ type: 1 }).toArray()

				const arrStorageAnimals = arrAnimal.filter(
					(animal) =>
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) ? (discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) ? (discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) ? (discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3).toString() : "")
				);


				await waldspiel.showMeinStorage(client, plugin, db, interaction.user, interaction, arrStorageAnimals, animalPlazierungsId, currentPage, searchQuery)
			}

			//selectedCustomization-idPlazierung
			if (isButton(interaction, 'showStorage')) {
				let discordUserId = interaction.user.id
				let db = DatabaseManager.get()

				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]
				let currentPage = getButtonParameter(interaction.customId)[2]
				let searchQuery = getButtonParameter(interaction.customId)[3] || ""

				let discordUserData = await UserData.get(interaction.user.id);
				let cData = discordUserData.currencyData;

				const collectionAnimal = db.collection('animals');
				const arrAnimal = await collectionAnimal.find({ ownerDiscordId: discordUserId }).sort({ type: 1 }).toArray()

				const arrStorageAnimals = arrAnimal.filter(
					(animal) =>
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) ? (discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) ? (discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) ? (discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3).toString() : "")
				);

				await waldspiel.showMeinStorage(client, plugin, db, interaction.user, interaction, arrStorageAnimals, animalPlazierungsId, currentPage, searchQuery)
			}

			//selectedCustomization-idPlazierung
			if (isButton(interaction, 'sendToStorage')) {

				let discordId = interaction.user.id
				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]

				await waldspiel.sendToStorage(interaction, plugin, db, discordId, animalPlazierungsId);
				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalPlazierungsId)

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

				let discordUserData = await UserData.get(interaction.user.id);
				let cData = discordUserData.currencyData;
				let animalId = 1;
				if ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1))) animalId = 1;
				else if ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2))) animalId = 2;
				else if ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3))) animalId = 3;

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalId)

			}

			if (isButton(interaction, 'selectedAnimation')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]
				let animationId = getButtonParameter(interaction.customId)[2]

				if (animationId == "ABBRECHEN") animationId = 0

				const collection = db.collection('animals');

				await collection.updateOne(
					{ _id: ObjectId(animalObjId) },
					{ $set: { animation: animationId } }
				);

				let discordUserDatabase = await getUserCurrencyFromDatabase(interaction.user.id, db);
				let animalId = 1;
				if (discordUserDatabase.animalId1 && ObjectId(animalObjId).equals(discordUserDatabase.animalId1)) animalId = 1;
				else if (discordUserDatabase.animalId2 && ObjectId(animalObjId).equals(discordUserDatabase.animalId2)) animalId = 2;
				else if (discordUserDatabase.animalId3 && ObjectId(animalObjId).equals(discordUserDatabase.animalId3)) animalId = 3;

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalId)

			}

			if (isButton(interaction, 'setBackgroundCustomization')) {
				let itemId = getButtonParameter(interaction.customId)[1];

				if (itemId == "ABBRECHEN") itemId = 0;

				let discordUserId = interaction.user.id;
				let discordUserData = await UserData.get(discordUserId);
				let backgroundlistdatabase = discordUserData.getCurrency("backgroundlist") || [];

				// Safety check: is it owned? (DEFAULT and SUMMER are always allowed)
				if (itemId !== 0 && itemId !== "DEFAULT" && itemId !== "SUMMER" && !backgroundlistdatabase.includes(itemId)) {
					return await interaction.reply({ content: "Diesen Hintergrund besitzt du noch nicht!", ephemeral: true });
				}

				discordUserData.setPluginData(plugin, 'background', itemId);
				await discordUserData.save();

				await waldspiel.showMeinWald(client, plugin, db, interaction.user, interaction, true);
			}

			//[1]animalId
			if (isButton(interaction, 'editAnimal')) {
				let animalId = parseInt(getButtonParameter(interaction.customId)[1])

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalId)
			}

			if (isButton(interaction, 'searchBackground')) {
				const modal = new ModalBuilder()
					.setCustomId('submitSearchBackground')
					.setTitle('Hintergründe suchen');

				const searchInput = new TextInputBuilder()
					.setCustomId('searchquery')
					.setLabel("Hintergrund suchen")
					.setPlaceholder("z.B. Sommer, Wald...")
					.setStyle(TextInputStyle.Short);

				const firstActionRow = new ActionRowBuilder().addComponents(searchInput);
				modal.addComponents(firstActionRow);
				await interaction.showModal(modal);
			}

			if (isButton(interaction, 'submitSearchBackground')) {
				let searchQuery = interaction.fields.getTextInputValue("searchquery")
				interaction.customId = `editBackground-0-${searchQuery}`;
				// Trigger the actual handler
				return await handleEditBackground(interaction);
			}

			if (isButton(interaction, 'clearSearchBackground')) {
				interaction.customId = `editBackground-0`;
				// Trigger the actual handler
				return await handleEditBackground(interaction);
			}

			async function handleEditBackground(interaction) {
				let page = parseInt(getButtonParameter(interaction.customId)[1]);
				let searchQuery = getButtonParameter(interaction.customId)[2] || "";

				let discordUserId = interaction.user.id;
				let discordUserData = await UserData.get(discordUserId);
				let cData = discordUserData.currencyData;

				let backgroundlistdatabase = (discordUserData.getPluginData(plugin, 'backgroundlist') ?? cData.backgroundlist) || [];

				// Ensure defaults are present in owned list
				if (!backgroundlistdatabase.includes("DEFAULT")) backgroundlistdatabase.unshift("DEFAULT");
				if (!backgroundlistdatabase.includes("SUMMER")) {
					let idx = backgroundlistdatabase.indexOf("DEFAULT") + 1;
					backgroundlistdatabase.splice(idx, 0, "SUMMER");
				}

				// Get ALL available backgrounds
				let allBgs = new Backgroundlist().getBackgroundListAll();
				let allTags = Object.keys(allBgs).filter(tag => tag !== "ABBRECHEN");

				if (searchQuery) {
					const query = searchQuery.toLowerCase();
					allTags = allTags.filter(tag => allBgs[tag].name.toLowerCase().includes(query));
				}

				const perPage = 9;
				const startIdx = page * perPage;
				const pageItems = allTags.slice(startIdx, startIdx + perPage);

				const selectOptions = [];
				for (let i = 0; i < pageItems.length; i++) {
					const tag = pageItems[i];
					const wc = new WaldCreator(tag);
					const bg = wc.background;
					let isOwned = backgroundlistdatabase.includes(tag);

					let label = isOwned ? `${startIdx + i + 1}. ${bg.name}` : `🔒 ${startIdx + i + 1}. ${bg.name}`;

					selectOptions.push(
						new StringSelectMenuOptionBuilder()
							.setLabel(label)
							.setValue(tag)
					);
				}

				const rowDropdown = new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('selectBackgroundDropdown')
						.setPlaceholder('Hintergrund auswählen...')
						.addOptions(selectOptions)
				);

				const maxPages = Math.ceil(allTags.length / perPage);

				const rowPagination = new ActionRowBuilder().addComponents(
					waldspiel.getZuMeinemWaldButton(),
					new ButtonBuilder()
						.setCustomId('searchBackground')
						.setLabel('🔍 Suchen')
						.setStyle(ButtonStyle.Secondary)
				);

				if (searchQuery) {
					rowPagination.addComponents(
						new ButtonBuilder()
							.setCustomId('clearSearchBackground')
							.setLabel('❌ Suche löschen')
							.setStyle(ButtonStyle.Danger)
					);
				}

				if (maxPages > 1) {
					rowPagination.addComponents(
						new ButtonBuilder()
							.setCustomId(`editBackground-${page - 1}${searchQuery ? '-' + searchQuery : ''}`)
							.setLabel('⬅️')
							.setStyle(ButtonStyle.Primary)
							.setDisabled(page === 0),
						new ButtonBuilder()
							.setCustomId(`editBackground-${page + 1}${searchQuery ? '-' + searchQuery : ''}`)
							.setLabel('➡️')
							.setStyle(ButtonStyle.Primary)
							.setDisabled(page === maxPages - 1)
					);
				}

				const outPath = await ImageCreator.createSetBackground(pageItems, startIdx, backgroundlistdatabase, searchQuery);

				if (interaction.isStringSelectMenu() || interaction.isButton() || interaction.isModalSubmit() || (interaction.message && interaction.message.editable)) {
					await interaction.update({ files: [outPath], components: [rowDropdown, rowPagination] });
				} else {
					await interaction.reply({ files: [outPath], components: [rowDropdown, rowPagination], ephemeral: true });
				}
			}

			if (isButton(interaction, 'editBackground')) {
				await handleEditBackground(interaction);
			}

			if (isButton(interaction, 'selectStorageDropdown')) {
				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]
				let storageId = parseInt(interaction.values[0])

				let discordUserId = interaction.user.id
				let discordUserData = await UserData.get(discordUserId);
				let cData = discordUserData.currencyData;

				const collectionAnimal = db.collection('animals');
				const arrAnimal = await collectionAnimal.find({ ownerDiscordId: discordUserId }).sort({ type: 1 }).toArray()

				const arrStorageAnimals = arrAnimal.filter(
					(animal) =>
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) ? (discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) ? (discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) ? (discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3).toString() : "")
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

				discordUserData.setPluginData(plugin, 'animalId' + animalPlazierungsId, animal._id);
				await discordUserData.save();

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalPlazierungsId)

			}

			if (isButton(interaction, 'searchStorage')) {
				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]

				const modal = new ModalBuilder()
					.setCustomId('submitSearchStorage-' + animalPlazierungsId)
					.setTitle('Tiere suchen');

				const searchInput = new TextInputBuilder()
					.setCustomId('searchquery')
					.setLabel("Nach was suchst du? (Name oder Sorte)")
					.setPlaceholder("z.B. Fuchs, Bello...")
					.setStyle(TextInputStyle.Short);

				const firstActionRow = new ActionRowBuilder().addComponents(searchInput);
				modal.addComponents(firstActionRow);
				await interaction.showModal(modal);
			}

			if (isButton(interaction, 'submitSearchStorage')) {
				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]
				let searchQuery = interaction.fields.getTextInputValue("searchquery")

				let discordUserId = interaction.user.id
				let discordUserData = await UserData.get(discordUserId);
				let cData = discordUserData.currencyData;

				const collectionAnimal = db.collection('animals');
				const arrAnimal = await collectionAnimal.find({ ownerDiscordId: discordUserId }).sort({ type: 1 }).toArray()

				const arrStorageAnimals = arrAnimal.filter(
					(animal) =>
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) ? (discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) ? (discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) ? (discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3).toString() : "")
				);

				await waldspiel.showMeinStorage(client, plugin, db, interaction.user, interaction, arrStorageAnimals, animalPlazierungsId, 0, searchQuery)
			}

			if (isButton(interaction, 'clearSearchStorage')) {
				let animalPlazierungsId = getButtonParameter(interaction.customId)[1]

				let discordUserId = interaction.user.id
				let discordUserData = await UserData.get(discordUserId);
				let cData = discordUserData.currencyData;

				const collectionAnimal = db.collection('animals');
				const arrAnimal = await collectionAnimal.find({ ownerDiscordId: discordUserId }).sort({ type: 1 }).toArray()

				const arrStorageAnimals = arrAnimal.filter(
					(animal) =>
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) ? (discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) ? (discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2).toString() : "") &&
						animal._id.toString() !== ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) ? (discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3).toString() : "")
				);

				await waldspiel.showMeinStorage(client, plugin, db, interaction.user, interaction, arrStorageAnimals, animalPlazierungsId, 0, "")
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

				let discordUserData = await UserData.get(interaction.user.id);
				let cData = discordUserData.currencyData;
				let animalId = 1;
				if ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1).toString())) animalId = 1;
				else if ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2).toString())) animalId = 2;
				else if ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3).toString())) animalId = 3;

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalId)
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
				let discordUserData = await UserData.get(discordUserId)

				let animalId = 1;
				if (ObjectId(animalObjId).equals(discordUserData.getCurrency("animalId1"))) {
					animalId = 1;
					discordUserData.setPluginData(plugin, 'animalId1', "");
					await discordUserData.save();
				}
				else if (ObjectId(animalObjId).equals(discordUserData.getCurrency("animalId2"))) {
					animalId = 2;
					discordUserData.setPluginData(plugin, 'animalId2', "");
					await discordUserData.save();
				}
				else if (ObjectId(animalObjId).equals(discordUserData.getCurrency("animalId3"))) {
					animalId = 3;
					discordUserData.setPluginData(plugin, 'animalId3', "");
					await discordUserData.save();
				}

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalId)
			}


			async function handleSetCustomization(interaction) {
				let animalObjId = getButtonParameter(interaction.customId)[1]
				let page = parseInt(getButtonParameter(interaction.customId)[2]) || 0;
				let slot = getButtonParameter(interaction.customId)[3] || "1";
				let searchQuery = getButtonParameter(interaction.customId)[4] || "";

				let discordUserId = interaction.user.id
				let discordUserData = await UserData.get(discordUserId);
				let cData = discordUserData.currencyData;

				const collectionAnimal = db.collection('animals');
				const animal = await collectionAnimal.findOne({ _id: ObjectId(animalObjId) });
				const animalType = animal ? animal.type : null;

				let ownedItems = (discordUserData.getPluginData(plugin, 'itemlist') ?? cData.itemlist) || []

				const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
				let ItemlistObj = require('./obj/ItemList.js');
				let Itemlist = new ItemlistObj().getListAll();
				let allItems = Object.keys(Itemlist);

				allItems = allItems.filter(a => a !== "ABBRECHEN");

				if (searchQuery) {
					const query = searchQuery.toLowerCase();
					allItems = allItems.filter(itemKey => Itemlist[itemKey].name.toLowerCase().includes(query));
				}

				allItems.unshift("ABBRECHEN");

				const itemsPerPage = 15;
				const maxPages = Math.ceil(allItems.length / itemsPerPage);

				if (page < 0) page = 0;
				if (page >= maxPages) page = maxPages - 1;

				const startIdx = page * itemsPerPage;
				const currentItems = allItems.slice(startIdx, startIdx + itemsPerPage);

				let selectMenu = new StringSelectMenuBuilder()
					.setCustomId('selectCustomizationDropdown-' + animalObjId + '-' + page + '-' + slot + (searchQuery ? '-' + searchQuery : ''))
					.setPlaceholder('Slot ' + slot + ': Wähle eine Dekoration (Seite ' + (page + 1) + '/' + maxPages + ')')
					.setMinValues(1)
					.setMaxValues(1);

				for (let i = 0; i < currentItems.length; i++) {
					let itemKey = currentItems[i];
					let itemName = Itemlist[itemKey] ? Itemlist[itemKey].name : "Unknown";

					let isOwned = itemKey === "ABBRECHEN" || ownedItems.includes(itemKey);
					let label = isOwned ? `${startIdx + i + 1}. ${itemName}` : `🔒 ${startIdx + i + 1}. ${itemName}`;

					selectMenu.addOptions(
						new StringSelectMenuOptionBuilder()
							.setLabel(label)
							.setValue(itemKey)
					);
				}

				const rowDropdown = new ActionRowBuilder().addComponents(selectMenu);
				let buttons = [
					waldspiel.getZuMeinemWaldButton(),
					new ButtonBuilder()
						.setCustomId(`searchCustomization-${animalObjId}-${slot}`)
						.setLabel('🔍 Suchen')
						.setStyle(ButtonStyle.Secondary)
				];

				if (searchQuery) {
					buttons.push(
						new ButtonBuilder()
							.setCustomId(`clearSearchCustomization-${animalObjId}-${slot}`)
							.setLabel('❌ Suche löschen')
							.setStyle(ButtonStyle.Danger)
					);
				}

				if (maxPages > 1) {
					buttons.push(
						new ButtonBuilder()
							.setCustomId('setCustomization-' + animalObjId + '-' + (page - 1) + '-' + slot + (searchQuery ? '-' + searchQuery : ''))
							.setLabel('⬅️')
							.setStyle(ButtonStyle.Primary)
							.setDisabled(page === 0),
						new ButtonBuilder()
							.setCustomId('setCustomization-' + animalObjId + '-' + (page + 1) + '-' + slot + (searchQuery ? '-' + searchQuery : ''))
							.setLabel('➡️')
							.setStyle(ButtonStyle.Primary)
							.setDisabled(page === maxPages - 1)
					);
				}
				const rowButtons = new ActionRowBuilder().addComponents(...buttons);

				const outPath = await ImageCreator.createSetCustomization(currentItems, ownedItems, startIdx, animalType, searchQuery);

				return await interaction.update({
					files: [outPath],
					components: [rowDropdown, rowButtons],
					ephemeral: true
				});
			}

			if (isButton(interaction, 'setCustomization')) {
				await handleSetCustomization(interaction);
			}

			if (isButton(interaction, 'selectCustomizationDropdown')) {
				let animalObjId = getButtonParameter(interaction.customId)[1];
				let page = getButtonParameter(interaction.customId)[2];
				let slot = getButtonParameter(interaction.customId)[3] || "1";
				let searchQuery = getButtonParameter(interaction.customId)[4] || "";
				let itemId = interaction.values[0];

				let discordUserId = interaction.user.id;
				let discordUserData = await UserData.get(discordUserId);
				let cData = discordUserData.currencyData;
				let ownedItems = (discordUserData.getPluginData(plugin, 'itemlist') ?? cData.itemlist) || [];

				if (itemId !== "ABBRECHEN" && !ownedItems.includes(itemId)) {
					return await interaction.reply({ content: "Du hast diese Dekoration noch nicht freigeschaltet!", ephemeral: true });
				}

				if (itemId == "ABBRECHEN") itemId = 0;

				const collection = db.collection('animals');
				let fieldToUpdate = slot === "1" ? "customization1" : (slot === "2" ? "customization2" : "customization3");

				let updateObj = { [fieldToUpdate]: itemId };
				// Also update legacy field if it's slot 1
				if (slot === "1") updateObj.customization = itemId;

				await collection.updateOne(
					{ _id: ObjectId(animalObjId) },
					{ $set: updateObj }
				);

				let animalId = 1;
				if ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1))) animalId = 1;
				else if ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2))) animalId = 2;
				else if ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3))) animalId = 3;

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalId);
			}

			if (isButton(interaction, 'searchCustomization')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]
				let slot = getButtonParameter(interaction.customId)[2]

				const modal = new ModalBuilder()
					.setCustomId(`submitSearchCustomization-${animalObjId}-${slot}`)
					.setTitle('Dekoration suchen');

				const searchInput = new TextInputBuilder()
					.setCustomId('searchquery')
					.setLabel("Dekoration suchen")
					.setPlaceholder("z.B. Hut, Brille...")
					.setStyle(TextInputStyle.Short);

				const firstActionRow = new ActionRowBuilder().addComponents(searchInput);
				modal.addComponents(firstActionRow);
				await interaction.showModal(modal);
			}

			if (isButton(interaction, 'submitSearchCustomization')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]
				let slot = getButtonParameter(interaction.customId)[2]
				let searchQuery = interaction.fields.getTextInputValue("searchquery")
				interaction.customId = `setCustomization-${animalObjId}-0-${slot}-${searchQuery}`;
				return await handleSetCustomization(interaction);
			}

			if (isButton(interaction, 'clearSearchCustomization')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]
				let slot = getButtonParameter(interaction.customId)[2]
				interaction.customId = `setCustomization-${animalObjId}-0-${slot}`;
				return await handleSetCustomization(interaction);
			}


			if (isButton(interaction, 'setAnimation')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]

				let discordUserId = interaction.user.id
				let discordUserData = await UserData.get(discordUserId);
				let cData = discordUserData.currencyData;

				const collectionAnimal = db.collection('animals');
				const animal = await collectionAnimal.findOne({ _id: ObjectId(animalObjId) });
				const animalType = animal ? animal.type : null;

				let ownedAnimations = (discordUserData.getPluginData(plugin, 'animationlist') ?? cData.animationlist) || ["WACKELN"]

				const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
				let AnimationListObj = require('./obj/AnimationList.js');
				let AnimationList = new AnimationListObj().getListAll();
				let allAnimations = Object.keys(AnimationList);

				// Ensure ABBRECHEN is at the start and not duplicated
				allAnimations = allAnimations.filter(a => a !== "ABBRECHEN");
				allAnimations.unshift("ABBRECHEN");

				let selectMenu = new StringSelectMenuBuilder()
					.setCustomId('selectAnimationDropdown-' + animalObjId)
					.setPlaceholder('Wähle eine Animation')
					.setMinValues(1)
					.setMaxValues(1);

				// Show up to 15 animations
				let count = 0;
				for (let i = 0; i < allAnimations.length; i++) {
					if (count >= 15) break;

					let animKey = allAnimations[i];
					let animName = "Aus / Keine";
					if (animKey !== "ABBRECHEN" && AnimationList[animKey]) {
						animName = AnimationList[animKey].name;
					}

					let isOwned = animKey === "ABBRECHEN" || ownedAnimations.includes(animKey);
					let label = isOwned ? `${i + 1}. ${animName}` : `🔒 ${i + 1}. ${animName}`;

					selectMenu.addOptions(
						new StringSelectMenuOptionBuilder()
							.setLabel(label)
							.setValue(animKey)
					);
					count++;
				}

				const rowAnimationlist = new ActionRowBuilder().addComponents(selectMenu);
				const rowBack = new ActionRowBuilder().addComponents(waldspiel.getZuMeinemWaldButton());

				const outPath = await ImageCreator.createSetAnimation(allAnimations, ownedAnimations, animalType);

				return await interaction.update({
					files: [outPath],
					components: [rowAnimationlist, rowBack],
					ephemeral: true
				});
			}

			if (isButton(interaction, 'selectAnimationDropdown')) {
				let animalObjId = getButtonParameter(interaction.customId)[1]
				let animationId = interaction.values[0]

				let discordUserId = interaction.user.id;
				let discordUserData = await UserData.get(discordUserId);
				let cData = discordUserData.currencyData;
				let ownedAnimations = (discordUserData.getPluginData(plugin, 'animationlist') ?? cData.animationlist) || ["WACKELN"];

				if (animationId !== "ABBRECHEN" && !ownedAnimations.includes(animationId)) {
					return await interaction.reply({ content: "Du hast diese Animation noch nicht freigeschaltet!", ephemeral: true });
				}

				if (animationId == "ABBRECHEN") animationId = 0

				const collection = db.collection('animals');

				await collection.updateOne(
					{ _id: ObjectId(animalObjId) },
					{ $set: { animation: animationId } }
				);

				let animalId = 1;
				if ((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId1') ?? cData.animalId1))) animalId = 1;
				else if ((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId2') ?? cData.animalId2))) animalId = 2;
				else if ((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3) && ObjectId(animalObjId).equals((discordUserData.getPluginData(plugin, 'animalId3') ?? cData.animalId3))) animalId = 3;

				await waldspiel.showMeinWaldAnimal(client, plugin, db, interaction.user, interaction, true, animalId)
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
