const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const UserData = require("../../../../discordBot/lib/UserData.js");

class EasterEvent {
    constructor() {
        this.userWhoCollectedOsterkorb = [];
    }

    // Aktiv von 1 Woche vor Ostern bis 3 Tage danach
    isExtensionActive() {
        const now = new Date();
        const year = now.getFullYear();
        // 1 week before until 3 days after
        const easter = this._getEaster(year);
        const start = new Date(easter);
        start.setDate(easter.getDate() - 7);
        const end = new Date(easter);
        end.setDate(easter.getDate() + 4); // 3 days after (exclusive)
        return now >= start && now < end;
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
        if (plugin['var'].eventOstern) {
            await shopChannel.send({ files: ['plugins/waldspiel/images/shop/bannerOstern.png'] })
            await createItemShop(require("./items.js"))
            await createBackgroundShop(require("./backgrounds.js"))
        }
    }

    getItems() {
        return require('./items.js');
    }

    getBackgrounds() {
        return require('./backgrounds.js');
    }

    async onCreateWald(client, plugin, db) {
        if (!this.isExtensionActive()) return;
        if (plugin['var'].eventOstern) {
            if (Math.floor(Math.random() * 150) === 5 ||
                Math.floor(Math.random() * 150) === 6 ||
                Math.floor(Math.random() * 150) === 7) {

                await this.spawnOsterKorb(client, plugin, db);
            }
        }
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
                    .setLabel('Abernten')
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


        await channel.send({
            files: ['./plugins/waldspiel/extensions/EasterEvent/images/osterkorb.png'],
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

        let eggs = discordUserData.getCurrency(plugin['var'].eggs) || 0;
        discordUserData.setCurrency(plugin['var'].eggs, eggs + 1);
        await discordUserData.save();

        await interaction.reply({ content: '<@' + interaction.user.id + '> hat ein Osterei erhalten' })
    }
}

module.exports = EasterEvent;
