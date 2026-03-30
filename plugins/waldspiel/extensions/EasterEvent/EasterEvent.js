const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const UserData = require("../../../../lib/UserData.js");
const sharp = require('sharp');
const WaldCreator = require('../../imageCreator/WaldCreator.js');
const { date } = require('../../lib/date.js');
const path = require('path');

class EasterEvent {
    constructor() {
        this.userWhoCollectedOsterkorb = [];
    }

    isExtensionActive() {

        const now = new Date();
        const year = now.getFullYear();
        const easter = this._getEaster(year);

        // Monday before Easter: easter - 6 days
        const start = new Date(easter);
        start.setDate(easter.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        // Easter Monday: easter + 1 day
        const end = new Date(easter);
        end.setDate(easter.getDate() + 1);
        end.setHours(23, 59, 59, 999);

        return now >= start && now <= end;
    }

    _getEaster(year) {
        const f = Math.floor,
            G = year % 19,
            C = f(year / 100),
            H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
            I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
            J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
            L = I - J,
            month = 3 + f((L + 40) / 44),
            day = L + 28 - 31 * f(month / 4);
        return new Date(year, month - 1, day);
    }

    preExecute(client, plugin) {
        if (!this.isExtensionActive()) return;
        console.log('[EasterEvent] started');
    }

    async getShop(client, plugin, shopChannel, createItemShop, createBackgroundShop) {
        if (!this.isExtensionActive()) return;
        await shopChannel.send({ files: ['plugins/waldspiel/images/shop/bannerOstern.png'] })
        await createItemShop(require("./items.js"))
        await createBackgroundShop(require("./backgrounds.js"))
    }

    getItems() {
        return require('./items.js');
    }

    getBackgrounds() {
        return require('./backgrounds.js');
    }

    async onCreateWald(client, plugin, db) {
        // can be used for additional hooks if needed
    }

    async onEventSpawning(client, plugin, db) {
        if (!this.isExtensionActive()) return false;

        // Always spawn if this hook is called (the chance is handled by the caller’s switch)
        await this.spawnOsterKorb(client, plugin, db);
        return true;
    }

    async onInteraction(interaction, client, plugin, db) {
        if (!this.isExtensionActive()) return;
        if (interaction.customId === 'collectOsterkorb') {
            await this.collectOsterkorb(interaction, plugin, db);
        }
    }

    async spawnOsterKorb(client, plugin, db) {
        this.userWhoCollectedOsterkorb = [];

        let channel = await client.channels.fetch(plugin['var'].gameChannel);

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
                    .setCustomId('collectOsterkorb')
                    .setLabel('Einsammeln')
                    .setStyle(ButtonStyle.Primary),
            );

        // Anleitung button
        rowBusch.addComponents(
            new ButtonBuilder()
                .setCustomId("anleitungWaldspiel")
                .setLabel("Wie geht das?")
                .setEmoji('🌳')
                .setStyle(ButtonStyle.Secondary),
        );


        const dateinfo = date()
        let tag = 'DEFAULT'
        if (dateinfo.isSummer) tag = "SUMMER"
        if (dateinfo.isWinter) tag = "WINTER"
        if (dateinfo.isSpring) tag = "SPRING"
        if (dateinfo.isAutumn) tag = "AUTUMN"

        const waldcreator = new WaldCreator(tag)
        const imagePath = path.join(__dirname, 'images/eierkorb.png');
        waldcreator.setMergeArray([
            { input: await sharp(imagePath).resize(250).toBuffer(), left: 100, top: 50 }
        ])

        await waldcreator.createImage()

        await channel.send({
            files: ['temp/finalpicture.png'],
            components: [rowBusch]
        })
    }

    async collectOsterkorb(interaction, plugin, db) {
        if (this.userWhoCollectedOsterkorb.includes(interaction.user.id)) {
            await interaction.reply({ content: 'Du hast von diesem Korb bereits ein Ei genommen', ephemeral: true })
            return
        }

        this.userWhoCollectedOsterkorb.push(interaction.user.id)


        let discordUserId = interaction.user.id
        let discordUserData = await UserData.get(discordUserId)

        discordUserData.addCurrency(plugin['var'].eggs, 1);
        await discordUserData.save(plugin);

        await interaction.reply({ content: '<@' + interaction.user.id + '> hat ein Osterei erhalten' })
    }
}

module.exports = EasterEvent;
