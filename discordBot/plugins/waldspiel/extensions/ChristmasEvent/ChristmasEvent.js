const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
const CustomId = require('../../../../lib/CustomId.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../../../lib/helper.js')

const {
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js');

const DatabaseManager = require("../../../../lib/DatabaseManager.js");
const VariableManager = require("../../../../lib/VariableManager.js");


class ChristmasExtension {
    // Aktiv im gesamten Dezember
    isExtensionActive() {
        const now = new Date();
        return now.getMonth() === 11; // December
    }

    preExecute(client, plugin) {
        if (!this.isExtensionActive()) return;
        console.log('[weihnachten-Extension] started');

        plugin.on(client, Events.InteractionCreate, async interaction => {
            if (!interaction.isButton()) return;
            if (interaction.customId !== "weihnachten") return;

            const discordUserId = interaction.user.id;
            const db = DatabaseManager.get();
            const userCollection = db.collection("userCollection");

            const now = new Date();
            const tag = now.getDate();

            // User laden
            const userData = await getUserCurrencyFromDatabase(discordUserId, db);

            // Prüfen: hat er heute schon geöffnet?
            const lastOpened = userData.lastChristmasDoorOpenDate;
            const todayString = now.toISOString().split("T")[0];

            if (lastOpened === todayString) {
                return interaction.reply({
                    content: "❌ Du hast heute bereits ein Türchen geöffnet!",
                    ephemeral: true
                });
            }

            // Speichern unter: currency.lastChristmasDoorOpenDate
            const result = await userCollection.updateOne(
                { discordId: discordUserId },
                { $set: { "currency.lastChristmasDoorOpenDate": todayString } },
                { upsert: true }
            );

            // Berrys erhöhen
            await VariableManager.counterAdd(discordUserId, 5, plugin['var'].berry, db, plugin);

            await interaction.reply({
                content: `🎁 Du hast **Türchen ${tag}** geöffnet und 5 Beeren bekommen!`,
                ephemeral: true
            });
        });
    }

    async getShop(client, plugin, shopChannel, createItemShop, createBackgroundShop) {
        if (!this.isExtensionActive()) return;

        //türchen start---------------------------------------
        const day = new Date().getDate();

        // Bild Pfad
        // Updated to use local extension path
        const imagePath = `./plugins/waldspiel/extensions/ChristmasEvent/images/day-${day}.png`;

        // Attachment
        const attachment = new AttachmentBuilder(imagePath, { name: 'tuerchen.png' });

        // Button
        const button = new ButtonBuilder()
            .setCustomId(`weihnachten`)
            .setLabel(`Türchen ${day} öffnen`)
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        // Nur Bild + Button senden (KEIN Embed!)
        await shopChannel.send({
            files: [attachment],
            components: [row]
        });

        //türchen end -----------------------------------

        console.log("erstelle weihnachten")

        await shopChannel.send({ files: ['plugins/waldspiel/images/shop/bannerWeihnachten.png'] })
        await createItemShop(require("./items.js"))
        await createBackgroundShop(require("./backgrounds.js"))

    }

    getItems() {
        return require('./items.js');
    }

    getBackgrounds() {
        return require('./backgrounds.js');
    }
}



function isButton(interaction, buttonId) {
    if (interaction.customId && (interaction.customId == buttonId || interaction.customId.includes(buttonId + "-"))) {
        return true
    }
    return false
}

module.exports = ChristmasExtension;