const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require("../../../discordBot/lib/helper.js")


const System = require("../../../discordBot/lib/system.js");

//berry cost animal
const BERRY_COST = 50

//0,1,2 -> Busch erstellen 3-> create animal
const RANDOM_NUMBER = 150


const Animallist = require("../animals.js")
const ImageCreator = require("../imageCreator.js");

const { date } = require('./date.js');
const WaldCreator = require('../imageCreator/WaldCreator.js');

const ExtensionManager = require('./../ExtensionManager');

module.exports = {

    animal: false,
    userWhoCollectedBeerys: [],
    userWhoCollectedOsterkorb: [],
    userWhoCollectedSweets: [],



    async createAnimal(client, plugin, db) {


        this.userWhoCollectedSweets = []

        this.animal = true;

        var randomKey = function (obj) {
            var keys = Object.keys(obj);
            return keys[keys.length * Math.random() << 0];
        };



        const dateInfo = date();


        // Filtere die Tiere nach Verfügbarkeit
        const filteredAnimals = Object.entries(Animallist).reduce((result, [key, animal]) => {
            const isSeasonMatch = !animal.season || // Keine Einschränkung bei `season`
                (dateInfo.isWinter && animal.season.includes("Winter")) ||
                (dateInfo.isSummer && animal.season.includes("Summer")) ||
                (dateInfo.isSpring && animal.season.includes("Spring")) ||
                (dateInfo.isAutumn && animal.season.includes("Autumn"));

            const isTimeOfDayMatch = !animal.timeOfDay || // Keine Einschränkung bei `timeOfDay`
                (dateInfo.isDay && animal.timeOfDay.includes("Day")) ||
                (dateInfo.isNight && animal.timeOfDay.includes("Night"));

            if (isSeasonMatch && isTimeOfDayMatch) {
                result[key] = animal; // Tier zur gefilterten Liste hinzufügen
            }
            return result;
        }, {});

        let animalId = randomKey(filteredAnimals)

        let channel = await client.channels.fetch(plugin['var'].gameChannel)

        //delete all messages in channel
        let fetched = await channel.messages.fetch({ limit: 100 });

        try {
            await channel.bulkDelete(fetched);
        } catch (error) {
            if (error.code === 50034) {
                console.log("❌ Enthält Nachrichten älter als 14 Tage wird ignoriert");
            } else {
                console.error("Unerwarteter Fehler:", error);
            }
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('catchAnimal-' + animalId)
                    .setLabel('Füttern und Einsammeln (' + BERRY_COST + ' Beeren)')
                    .setStyle(ButtonStyle.Primary),
            );

        const extraButtons = ExtensionManager.getButtonsForEvent(client, plugin, 'createAnimal');
        if (extraButtons.length > 0) {
            row.addComponents(...extraButtons);
        }

        this.addAnleitung(row)

        await ImageCreator.createAnimal(animalId, dateInfo)

        await channel.send({
            files: ['temp/finalpicture.png'],
            components: [row]
        })
    },

    async createBusch(client, plugin, db) {

        this.userWhoCollectedBeerys = []

        let channel = await client.channels.fetch(plugin['var'].gameChannel)

        //delete all messages in channel
        let fetched = await channel.messages.fetch({ limit: 100 });

        try {
            await channel.bulkDelete(fetched);
        } catch (error) {
            if (error.code === 50034) {
                console.log("❌ Enthält Nachrichten älter als 14 Tage wird ignoriert");
            } else {
                console.error("Unerwarteter Fehler:", error);
            }
        }

        const rowBusch = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('collectBerry')
                    .setLabel('Abernten')
                    .setStyle(ButtonStyle.Primary),
            );

        const extraButtons = ExtensionManager.getButtonsForEvent(client, plugin, 'createBusch');
        if (extraButtons.length > 0) {
            rowBusch.addComponents(...extraButtons);
        }

        this.addAnleitung(rowBusch)



        const sharp = require('sharp')

        const dateinfo = date()

        let tag = 'DEFAULT'

        if (dateinfo.isSummer) tag = "SUMMER"
        if (dateinfo.isWinter) tag = "WINTER"
        if (dateinfo.isSpring) tag = "SPRING"
        if (dateinfo.isAutumn) tag = "AUTUMN"

        const waldcreator = new WaldCreator(tag)

        if (dateinfo.isSummer || dateinfo.isSpring || dateinfo.isAutumn) {
            waldcreator.setMergeArray([
                { input: await sharp('plugins/waldspiel/images/beerenbusch.png').toBuffer(), left: 200, top: 140 }
            ])
        }
        if (dateinfo.isWinter) {
            waldcreator.setMergeArray([
                { input: await sharp('plugins/waldspiel/images/beerenbusch-winter.png').toBuffer(), left: 200, top: 140 }
            ])
        }

        await waldcreator.createImage()

        await channel.send({
            files: ['temp/finalpicture.png'],
            //files: ['plugins/waldspiel/images/busch.png'],
            components: [rowBusch]
        })
    },

    async createOsterKorb(client, plugin, db) {
        console.log("createOsterKorb is deprecated in waldspiel.js, usage moved to EasterEvent extension via ExtensionManager.onCreateWald");
    },

    async showMeinStorage(client, plugin, db, user, interaction, animalStorage, animalPlazierungsId, currentPage) {
        let userid = user.id

        let discordUserDatabase = await getUserCurrencyFromDatabase(userid, db)

        // Sicherstellen, dass currentPage ein Integer ist
        currentPage = parseInt(currentPage);
        if (isNaN(currentPage)) {
            currentPage = 0;  // Setze einen Standardwert, falls currentPage kein gültiger Integer ist
        }

        //wurde kein user gefunden nicht ausführen
        if (discordUserDatabase) {

            //const currencyIdKarma = pluginOptions.berry //ändern


            const { ButtonBuilderExtended } = require("../ButtonBuilderExtended.js")

            let numberOfAnimals = animalStorage.length;
            let animalsPerPage = 30;  // Anzahl der Tiere pro Seite
            let totalPages = Math.ceil(numberOfAnimals / animalsPerPage);  // Gesamtzahl der Seiten

            // Sicherstellen, dass die aktuelle Seite nicht außerhalb des Bereichs liegt
            if (currentPage < 0) currentPage = 0;
            if (currentPage >= totalPages) currentPage = totalPages - 1;

            // Die Tiere für die aktuelle Seite extrahieren
            let startIndex = currentPage * animalsPerPage;
            let endIndex = startIndex + animalsPerPage;
            let animalsOnCurrentPage = animalStorage.slice(startIndex, endIndex);

            /* Diese Row soll Pfeile rechts und links haben für die Paginierung und nicht die zwei kopierten */

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`showStorage-${animalPlazierungsId}-${currentPage - 1}`)
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 0),  // Deaktiviert, wenn auf Seite 0
                    new ButtonBuilder()
                        .setCustomId(`showStorage-${animalPlazierungsId}-${currentPage + 1}`)
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === totalPages - 1)  // Deaktiviert, wenn auf der letzten Seite
                );


            let row2 = new ActionRowBuilder()
                .addComponents(
                    this.getZuMeinemWaldButton(),
                    new ButtonBuilderExtended()
                        .setCustomId('selectStorageNumber')
                        .setParameter(animalPlazierungsId)
                        .setLabel('Wähle Nummer')
                        .setStyle(ButtonStyle.Primary)
                );


            await ImageCreator.createMeinStorage(animalStorage, currentPage)

            //if animalPlazierungsId=noedit means no edit
            if (animalPlazierungsId === 'noedit') {
                row2 = new ActionRowBuilder()
                    .addComponents(
                        this.getZuMeinemWaldButton()
                    );
            }

            return await interaction.update({
                files: ['temp/finalpicture.png'],
                components: [row1, row2],
                ephemeral: true
            });


        } else {

            return await interaction.reply({
                content: 'Ein Fehler ist aufgetreten bitte melde das Lowa',
                ephemeral: true
            });

        }
    },

    async showMeinWald(client, plugin, db, user, interaction, shouldUpdate) {

        let userid = user.id

        let discordUserDatabase = await getUserCurrencyFromDatabase(userid, db)

        //wurde kein user gefunden nicht ausführen
        if (discordUserDatabase) {

            //const currencyIdKarma = pluginOptions.berry //ändern


            const { ButtonBuilderExtended } = require("../ButtonBuilderExtended.js")

            ExtensionManager.getButtonsForMeinwald(client, plugin);

            const extraButtons = ExtensionManager.getButtonsForMeinwald(client, plugin); // 🔁 deine Erweiterungen


            let row1;
            let row2;
            if (user.id == interaction.user.id) {
                row1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilderExtended()
                            .setCustomId('editAnimal')
                            .setParameter(1)
                            .setLabel('Platz 1')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('editAnimal-2')
                            .setLabel('Platz 2')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('editAnimal-3')
                            .setLabel('Platz 3')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('editBackground-0')
                            .setLabel('Hintergrund')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('postWald')
                            .setLabel('Wald Posten')
                            .setStyle(ButtonStyle.Primary),
                    );

                row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilderExtended()
                            .setCustomId('showStorageWithoutEdit')
                            .setParameter(1)
                            .setLabel('Box anzeigen')
                            .setStyle(ButtonStyle.Secondary)
                    );
                if (extraButtons.length > 0) {
                    row2.addComponents(...extraButtons);
                }


            }

            const filename = await ImageCreator.createMeinWald(discordUserDatabase)

            if (shouldUpdate) {
                if (user.id == interaction.user.id) {
                    return await interaction.update({
                        files: ['temp/finalpicture.png'],
                        components: [row1, row2],
                        ephemeral: true
                    });
                } else {
                    return await interaction.update({
                        files: ['temp/finalpicture.png'],
                        ephemeral: true
                    });
                }

            } else {
                if (user.id == interaction.user.id) {
                    return await interaction.reply({
                        files: ['temp/finalpicture.png'],
                        components: [row1, row2],
                        ephemeral: true
                    });
                } else {
                    return await interaction.reply({
                        files: ['temp/finalpicture.png'],
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
    },

    async showMeinWaldAnimal(client, plugin, db, user, interaction, shouldUpdate, animalId) {

        let userid = user.id

        let discordUserDatabase = await getUserCurrencyFromDatabase(userid, db)

        //wurde kein user gefunden nicht ausführen
        if (discordUserDatabase) {

            //const currencyIdKarma = pluginOptions.berry //ändern

            const row2 = new ActionRowBuilder()

            let animalObjId = discordUserDatabase["animalId" + animalId].toString()

            if (discordUserDatabase["animalId" + animalId]) {
                row2.addComponents(
                    this.getZuMeinemWaldButton(),
                    new ButtonBuilder()
                        .setCustomId('setCustomization-' + animalObjId + '-0')//setCustomization-idPlazierung-offsetItemliste
                        .setLabel('Tier einkleiden')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('editAnimalName-' + animalObjId)//editAnimalName-animalId
                        .setLabel('Name bearbeiten')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('sendToStorage-' + animalId)//editAnimalName-animalId
                        .setLabel('In Box schieben')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('removeAnimal-' + animalObjId)//editAnimalName-animalId
                        .setLabel('Tier Freilassen')
                        .setStyle(ButtonStyle.Danger),
                )
            } else {
                row2.addComponents(
                    this.getZuMeinemWaldButton(),
                    new ButtonBuilder()
                        .setCustomId('showStorage-' + animalId + '-0')//editAnimalName-animalId
                        .setLabel('Aus Box holen')
                        .setStyle(ButtonStyle.Secondary),
                )
            }





            await ImageCreator.createMeinWaldOneAnimal(discordUserDatabase, animalId)

            if (shouldUpdate) {
                return await interaction.update({
                    files: ['temp/finalpicture.png'],
                    components: [row2],
                    ephemeral: true
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
    },


    async createWald(client, plugin, db, forceRefresh) {

        if (forceRefresh) {
            switch (this.getRandomInt(2)) {
                case 0:
                    await this.createBusch(client, plugin, db)
                    break;
                case 1:
                    await this.createAnimal(client, plugin, db)
                    break;
                default:
                    break;
            }
        }

        switch (this.getRandomInt(RANDOM_NUMBER)) {
            case 0:
            case 1:
            case 2:
                await this.createBusch(client, plugin, db)
                break;
            case 3:
            case 4:
                await this.createAnimal(client, plugin, db)
                break;
            /* Cases 5,6,7 moved to EasterEvent extension */
            /*
            case 5:
            case 6:
            case 7:
                if (plugin['var'].eventOstern) {
                    await this.createOsterKorb(client, plugin, db)
                }
                break;
            */
            default:
                break;
        }

        /* Hook for Extensions to spawn their own events */
        await ExtensionManager.onCreateWald(client, plugin, db);
    },

    getZuMeinemWaldButton() {
        return (
            new ButtonBuilder()
                .setCustomId('meinWald')
                .setLabel('Zu meinem Wald')
                .setStyle(ButtonStyle.Success)
        )
    },

    async createShop(client, plugin, db) {
        if (plugin['var'].gameChannel && plugin['var'].shopChannel) {

            let shopChannel = await client.channels.fetch(plugin['var'].shopChannel)

            //lösche alten shop
            let fetched = await shopChannel.messages.fetch({ limit: 100 });

            try {
                await shopChannel.bulkDelete(fetched);
            } catch (error) {
                if (error.code === 50034) {
                    console.log("❌ Enthält Nachrichten älter als 14 Tage wird ignoriert");
                } else {
                    console.error("Unerwarteter Fehler:", error);
                }
            }


            let thisobj = this

            var createItemShop = async function (itemlist) {
                let shopNormal = thisobj.getShopActionRow(plugin, itemlist)
                await ImageCreator.createItemShop(plugin, shopNormal.itemId1, shopNormal.itemId2, shopNormal.itemId3)
                await shopChannel.send({
                    files: ['temp/finalpicture.png'],
                    components: [shopNormal.actionRow]
                })
            };
            var createBackgroundShop = async function (itemlist) {
                let shopBackgroundNormal = thisobj.getShopBackgroundActionRow(plugin, itemlist)
                await ImageCreator.createBackgroundShop(plugin, shopBackgroundNormal.backgroundId)
                await shopChannel.send({
                    files: ['temp/finalpictureBackground.png'],
                    components: [shopBackgroundNormal.actionRow]
                })
            };

            await ExtensionManager.getShop(client, plugin, shopChannel, createItemShop, createBackgroundShop);


            /* Easter Shop moved to extensions/EasterEvent */
            /*
             //Osternshop
            if (plugin['var'].eventOstern && false) { //TODO: temp ausgebaut
                await shopChannel.send({ files: ['plugins/waldspiel/images/shop/bannerOstern.png'] })
                await createItemShop(require("../itemsOstern.js"), 'E')
                await createBackgroundShop(require("../backgroundsOstern.js"), 'E')
            }
            */

            /* Halloween Shop moved to extensions/HalloweenEvent */
            /*
            if (plugin['var'].eventHalloween && false) { //TODO: temp ausgebaut
                await shopChannel.send({ files: ['plugins/waldspiel/images/shop/bannerHalloween.png'] })
                await createItemShop(require("../itemsHalloween.js"), 'S')
            }
            */

            /* ausgebaut in die erweiterung
            //Weihnachten Shop
            if (plugin['var'].eventWeihnachten) {
                await shopChannel.send({ files: ['plugins/waldspiel/images/shop/bannerWeihnachten.png'] })
                await createItemShop(require("../itemsWeihnachten.js"), 'B')
                await createBackgroundShop(require("../backgroundsWeihnachten.js"), 'B')
            }*/

            //NormalShop
            await shopChannel.send({ files: ['plugins/waldspiel/images/shop/bannerDefault.png'] })
            await createItemShop(require("../items.js"))
            await createBackgroundShop(require("../backgrounds.js"))

        }
    },

    async createCarrotEvent(client, plugin, db) {
        console.log("createCarrotEvent is deprecated in waldspiel.js, usage moved to CarrotEvent extension via ExtensionManager.onDailyTick");
    },

    addAnleitung(row) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("anleitungWaldspiel")
                .setLabel("Wie geht das?")
                .setEmoji('🌳')
                .setStyle(ButtonStyle.Secondary),
        );
    },



    getShopActionRow(plugin, Itemlist) {


        Itemlist = {
            ABBRECHEN: { filename: 'Abbrechen' },
            ...Itemlist
        }

        var randomKey = function (obj) {
            var keys = Object.keys(obj);
            return keys[((keys.length - 1) * Math.random() << 0) + 1];
        };

        let itemId1 = randomKey(Itemlist)
        let itemId2 = null;
        let itemId3 = null;

        let objlength = Object.keys(Itemlist).length

        //Erstellung shop
        const rowShop = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buyItem-' + itemId1)
                    .setLabel('Kaufe "' + Itemlist[itemId1].name + '"')
                    .setStyle(ButtonStyle.Primary)
            );

        //-1 wegen abbrechen im obj
        if ((objlength - 1) >= 2) {

            itemId2 = randomKey(Itemlist)
            while (itemId1 == itemId2) itemId2 = randomKey(Itemlist)

            rowShop.addComponents(
                new ButtonBuilder()
                    .setCustomId('buyItem-' + itemId2)
                    .setLabel('Kaufe "' + Itemlist[itemId2].name + '"')
                    .setStyle(ButtonStyle.Primary)
            );
        }
        //-1 wegen abbrechen im obj
        if ((objlength - 1) >= 2) {

            itemId3 = randomKey(Itemlist)
            while (itemId1 == itemId3 || itemId2 == itemId3) itemId3 = randomKey(Itemlist)

            rowShop.addComponents(
                new ButtonBuilder()
                    .setCustomId('buyItem-' + itemId3)
                    .setLabel('Kaufe "' + Itemlist[itemId3].name + '"')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        return {
            actionRow: rowShop,
            itemId1: itemId1,
            itemId2: itemId2,
            itemId3: itemId3
        }

    },

    getShopBackgroundActionRow(plugin, Backgroundlist) {

        var randomKey = function (obj) {
            var keys = Object.keys(obj).filter(key => key !== 'SUMMER');
            return keys[Math.floor(Math.random() * (keys.length))];
        };

        //create Background Shop
        let backgroundId = randomKey(Backgroundlist)

        //Erstellung shop
        const rowShop = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buyBackground-' + backgroundId)
                    .setLabel('Kaufe Hintergrund "' + Backgroundlist[backgroundId].name + '"')
                    .setStyle(ButtonStyle.Primary)
            );


        return {
            actionRow: rowShop,
            backgroundId: backgroundId
        }

    },

    getFormattedDate() {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0'); // Add leading zero if necessary
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = today.getFullYear();

        // Combine them with separators
        const formattedDate = dd + '.' + mm + '.' + yyyy;
        return formattedDate;
    },

    async insertAnimalInDB(db, discordUserId, type) {
        //erstelle Tier in animal Datenbank
        const collection = db.collection('animals');
        let createdAnimal = await collection.insertOne({
            "ownerDiscordId": discordUserId,
            "type": type,
            "name": '',
            "customization": '',
            'catchDate': this.getFormattedDate()
        })
        return createdAnimal.insertedId

    },

    async catchAnimal(interaction, plugin, animalType, discordUserId, db) {

        let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

        if (this.animal == false) {
            return await interaction.reply({ content: 'Tier wurde bereits eingesammelt', ephemeral: true })
        }

        let berryUser = discordUserDatabase[plugin['var'].berry]
        if (!berryUser) berryUser = 0

        if (berryUser < BERRY_COST) {
            return await interaction.reply({ content: 'Du hast nicht genug Beeren um das Tier zu füttern und einzusammeln', ephemeral: true })
        }

        const collection = db.collection('animals');
        let arrAnimal = await collection.find({ ownerDiscordId: discordUserId }).toArray()
        let aninmalCountInStorage = arrAnimal.length

        if (!discordUserDatabase.animalId1 || discordUserDatabase.animalId1 == 0) {
            this.animal = false
            await updateUserFromDatabase(db, discordUserId, {
                $set: {
                    ["currency." + "animalId1"]: await this.insertAnimalInDB(db, discordUserId, animalType),
                    ["currency." + plugin['var'].berry]: berryUser - BERRY_COST
                }
            })
        }
        else if (!discordUserDatabase.animalId2 || discordUserDatabase.animalId2 == 0) {
            this.animal = false
            await updateUserFromDatabase(db, discordUserId, {
                $set: {
                    ["currency." + "animalId2"]: await this.insertAnimalInDB(db, discordUserId, animalType),
                    ["currency." + plugin['var'].berry]: berryUser - BERRY_COST
                }
            })
        }
        else if (!discordUserDatabase.animalId3 || discordUserDatabase.animalId3 == 0) {
            this.animal = false
            await updateUserFromDatabase(db, discordUserId, {
                $set: {
                    ["currency." + "animalId3"]: await this.insertAnimalInDB(db, discordUserId, animalType),
                    ["currency." + plugin['var'].berry]: berryUser - BERRY_COST
                }
            })
        } else {
            //alle Waldplätze sind voll, teste nun ob es in die Box passt

            System.log(db, System.status.INFO, "[waldspiel]", interaction.user.username + "[" + interaction.user.id + "] hat " + animalType + " gefangen und wurde in die Storage geschoben")
            this.animal = false

            await this.insertAnimalInDB(db, discordUserId, animalType)

            await updateUserFromDatabase(db, interaction.user.id, {
                $set: {
                    ["currency." + plugin['var'].berry]: berryUser - BERRY_COST
                }
            })

        }

        await interaction.update({ files: ['plugins/waldspiel/images/backgrounds/Default.png'] });
        await interaction.followUp({ content: '<@' + interaction.user.id + '> hat das Tier gefangen' });
    },

    async collectBerry(interaction, plugin, db) {

        if (this.userWhoCollectedBeerys.includes(interaction.user.id)) {
            await interaction.reply({ content: 'Du hast diesen Busch bereits abgeerntet', ephemeral: true })
            return
        }

        let userCountWhoCollectedBerrys = this.userWhoCollectedBeerys.length
        this.userWhoCollectedBeerys.push(interaction.user.id)

        let collectedBerrys = 10

        collectedBerrys = collectedBerrys - userCountWhoCollectedBerrys
        if (collectedBerrys < 2) collectedBerrys = 2

        roleBonus = 0
        roleText = ''
        boosterBonus = 0
        boosterText = ''

        if (interaction.member.roles.cache.has(plugin['var'].baerRole)) {
            roleBonus = 3
        }
        if (interaction.member.roles.cache.has(plugin['var'].wildschweinRole)) {
            roleBonus = 3
        }
        if (interaction.member.roles.cache.has(plugin['var'].wolfRole)) {
            roleBonus = 3
        }
        if (interaction.member.roles.cache.has(plugin['var'].hirschRole)) {
            roleBonus = 3
        }
        if (interaction.member.roles.cache.has(plugin['var'].wildkuhRole)) {
            roleBonus = 2
        }
        if (interaction.member.roles.cache.has(plugin['var'].fuchsRole)) {
            roleBonus = 2
        }
        if (interaction.member.roles.cache.has(plugin['var'].euleRole)) {
            roleBonus = 2
        }
        if (interaction.member.roles.cache.has(plugin['var'].waschbaerRole)) {
            roleBonus = 2
        }
        if (interaction.member.roles.cache.has(plugin['var'].eichhoernchenRole)) {
            roleBonus = 1
        }
        if (interaction.member.roles.cache.has(plugin['var'].froschRole)) {
            roleBonus = 1
        }
        if (interaction.member.premiumSinceTimestamp) {
            boosterBonus = 2
            boosterText = ' [+' + boosterBonus + ' Booster]'
        }
        if (roleBonus > 0) {
            roleText = ' [+' + roleBonus + ' Rang]'
        }

        let collectedBerrysWithBonus = collectedBerrys + roleBonus + boosterBonus


        let discordUserId = interaction.user.id
        let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

        let berryUser = discordUserDatabase[plugin['var'].berry]
        if (!berryUser) berryUser = 0

        await updateUserFromDatabase(db, discordUserId, {
            $set: {
                ["currency." + plugin['var'].berry]: berryUser + collectedBerrysWithBonus,
            }
        })

        await interaction.reply({ content: '<@' + interaction.user.id + '> hat ' + collectedBerrys + ' Beeren geerntet' + roleText + boosterText })
    },

    async collectOsterkorb(interaction, plugin, db) {
        console.log("collectOsterkorb is deprecated in waldspiel.js, usage moved to EasterEvent extension");
        await interaction.reply({ content: 'Diese Funktion wird nun von der Oster-Erweiterung verwaltet.', ephemeral: true });
    },

    async collectSweets(interaction, plugin, db) {

        if (this.userWhoCollectedSweets.includes(interaction.user.id)) {
            await interaction.reply({ content: 'Du hast dieses Tier schon nach Süßigkeiten gefragt', ephemeral: true })
            return
        }

        this.userWhoCollectedSweets.push(interaction.user.id)


        let discordUserId = interaction.user.id

        await updateUserFromDatabase(db, discordUserId, {
            $inc: {
                ["currency." + plugin['var'].sweets]: 1,	//add timestamp on last karma add
            }
        })

        await interaction.reply({ content: '<@' + interaction.user.id + '> hat Süßigkeiten erhalten' })
    },

    async sendToStorage(interaction, db, discordId, animalPlazierungsId) {
        let discordUserDatabase = await getUserCurrencyFromDatabase(discordId, db)

        let animalCountInForest = 0
        if (discordUserDatabase.animalId1 || !discordUserDatabase.animalId1 == 0) animalCountInForest++
        if (discordUserDatabase.animalId2 || !discordUserDatabase.animalId2 == 0) animalCountInForest++
        if (discordUserDatabase.animalId3 || !discordUserDatabase.animalId3 == 0) animalCountInForest++

        const collection = db.collection('animals');
        const arrAnimal = await collection.find({ ownerDiscordId: discordId }).toArray()
        const aninmalCountInStorage = arrAnimal.length - animalCountInForest

        await updateUserFromDatabase(db, interaction.user.id, {
            $set: {
                ["currency." + 'animalId' + animalPlazierungsId]: ''
            }
        })
    },

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    },

    getCurrencyIdByPriceChar(plugin, priceEinheit) {
        if (priceEinheit == 'B') {
            return plugin['var'].berry
        }

        if (priceEinheit == 'E') {
            return plugin['var'].eggs
        }

        if (priceEinheit == 'S') {
            return plugin['var'].sweets
        }

        System.log(db, System.status.INFO, "[waldspiel]", "ERROR: undefined PriceChar")
        return false
    },







}
