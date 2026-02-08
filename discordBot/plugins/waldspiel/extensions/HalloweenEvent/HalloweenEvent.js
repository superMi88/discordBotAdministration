const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../../../lib/helper.js')

class HalloweenEvent {
    constructor() {
        this.userWhoCollectedSweets = [];
    }

    // Aktiv von Halloween-Woche bis 3 Tage danach (24. Okt - 3. Nov)
    isExtensionActive() {
        const now = new Date();
        const year = now.getFullYear();
        // 1 week before (Oct 24) until 3 days after (Nov 3)
        const start = new Date(year, 9, 24);
        const end = new Date(year, 10, 4); // Nov 4 00:00 (exclusive)
        return now >= start && now < end;
    }

    preExecute(client, plugin) {
        if (!this.isExtensionActive()) return;
        console.log('[HalloweenEvent] started');
    }

    async onInteraction(interaction, client, plugin, db) {
        if (!this.isExtensionActive()) return;
        if (interaction.customId === 'collectSweets') {
            await this.collectSweets(interaction, plugin, db);
        }
    }

    getButtonsForEvent(client, plugin, eventType) {
        if (!this.isExtensionActive()) return [];
        if (!plugin['var'].eventHalloween) return [];

        if (eventType === 'createAnimal') {
            return [
                new ButtonBuilder()
                    .setCustomId("collectSweets")
                    .setLabel("Süßes oder Saures!")
                    .setEmoji('🎃')
                    .setStyle(ButtonStyle.Primary)
            ];
        }
        return [];
    }

    async collectSweets(interaction, plugin, db) {
        if (this.userWhoCollectedSweets.includes(interaction.user.id)) {
            await interaction.reply({ content: 'Du hast dieses Tier schon nach Süßigkeiten gefragt', ephemeral: true })
            return
        }

        this.userWhoCollectedSweets.push(interaction.user.id)
        let discordUserId = interaction.user.id

        await updateUserFromDatabase(db, discordUserId, {
            $inc: {
                ["currency." + plugin['var'].sweets]: 1,
            }
        })

        await interaction.reply({ content: '<@' + interaction.user.id + '> hat Süßigkeiten erhalten' })
    }

    async getShop(client, plugin, shopChannel, createItemShop, createBackgroundShop) {
        if (!this.isExtensionActive()) return;
        if (plugin['var'].eventHalloween) {
            await shopChannel.send({ files: ['plugins/waldspiel/images/shop/bannerHalloween.png'] })
            await createItemShop(require("./items.js"))
        }
    }

    getItems() {
        return require('./items.js');
    }
}

module.exports = HalloweenEvent;
