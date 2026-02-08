const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require("../../../../discordBot/lib/helper.js")

class CarrotEvent {
    // Aktiv vom 27. bis 29. Juni
    isExtensionActive() {
        const now = new Date();
        const m = now.getMonth() + 1; // 1-12
        const d = now.getDate();
        return m === 6 && (d === 27 || d === 28 || d === 29);
    }

    preExecute(client, plugin) {
        if (!this.isExtensionActive()) return;
        console.log('[CarrotEvent] started');
    }

    async onInteraction(interaction, client, plugin, db) {
        if (!this.isExtensionActive()) return;
        if (!interaction.customId) return;

        // Helper inline
        const isButton = (id, target) => id.startsWith(target);
        const getParams = (id) => id.split("-");

        if (isButton(interaction.customId, 'carrotEvent')) {
            let action = getParams(interaction.customId)[1]

            if (action == "aussaht") {

                let discordUserId = interaction.user.id
                let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

                let schonGemacht = discordUserDatabase["carrotEventAussaht"]

                if (schonGemacht) {
                    await interaction.reply({ content: 'Du hast bereits ausgesäht', ephemeral: true })
                    return
                }
                await updateUserFromDatabase(db, discordUserId, {
                    $set: {
                        ["currency.carrotEventAussaht"]: true,
                    }
                })

            }

            if (action == "gießen") {
                let discordUserId = interaction.user.id
                let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

                let schonGemacht = discordUserDatabase["carrotEventGegossen"]

                if (schonGemacht) {
                    await interaction.reply({ content: 'Du hast bereits gegossen', ephemeral: true })
                    return
                }
                await updateUserFromDatabase(db, discordUserId, {
                    $set: {
                        ["currency.carrotEventGegossen"]: true,
                    }
                })

            }

            if (action == "ernten") {
                let discordUserId = interaction.user.id
                let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)

                let schonGemacht = discordUserDatabase["carrotEventGeerntet"]

                if (schonGemacht) {
                    await interaction.reply({ content: 'Du hast die Karotte bereits geerntet', ephemeral: true })
                    return
                }
                await updateUserFromDatabase(db, discordUserId, {
                    $set: {
                        ["currency.carrotEventGeerntet"]: true,
                    }
                })

            }

            let discordUserId = interaction.user.id
            let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db)
            let berryUser = discordUserDatabase[plugin['var'].berry]
            if (!berryUser) berryUser = 0

            let anzahlGeholfen = 0
            if (discordUserDatabase["carrotEventAussaht"]) anzahlGeholfen++
            if (discordUserDatabase["carrotEventGegossen"]) anzahlGeholfen++
            if (discordUserDatabase["carrotEventGeerntet"]) anzahlGeholfen++

            if (anzahlGeholfen == 1) {
                await updateUserFromDatabase(db, discordUserId, {
                    $set: {
                        ["currency." + plugin['var'].berry]: berryUser + 20,
                    }
                })

                await interaction.reply({ content: '<@' + interaction.user.id + '> hat beim Karottenanbau 1 mal geholfen und 20 Beeren erhalten' })
            }
            if (anzahlGeholfen == 2) {
                await updateUserFromDatabase(db, discordUserId, {
                    $set: {
                        ["currency." + plugin['var'].berry]: berryUser + 50,
                    }
                })

                await interaction.reply({ content: '<@' + interaction.user.id + '> hat beim Karottenanbau 2 mal geholfen und 50 Beeren erhalten' })
            }
            if (anzahlGeholfen == 3) {

                let itemlist = discordUserDatabase.itemlist
                if (!itemlist) itemlist = []

                let itemId = 'CARROT_HUT'

                if (itemlist.includes(itemId)) {
                    await interaction.reply({ content: 'Du hast dieses Item bereits', ephemeral: true });
                } else {
                    itemlist.push(itemId)
                    await updateUserFromDatabase(db, discordUserId, {
                        $set: {
                            ["currency." + "itemlist"]: itemlist,
                        }
                    })
                    await interaction.reply({ content: '<@' + interaction.user.id + '> hat beim Karottenanbau 3 mal geholfen und den legendären Karottenhut erhalten!!' })
                }

            }

        }
    }

    async onDailyTick(client, plugin, db) {
        if (!this.isExtensionActive()) return;
        if (plugin['var'].eventChannel) {

            let eventChannel = await client.channels.fetch(plugin['var'].eventChannel)

            let fetched = await eventChannel.messages.fetch({ limit: 100 });
            try {
                await eventChannel.bulkDelete(fetched);
            } catch (error) {
                if (error.code === 50034) {
                    console.log("❌ Enthält Nachrichten älter als 14 Tage wird ignoriert");
                } else {
                    console.error("Unerwarteter Fehler:", error);
                }
            }


            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();

            if (dd == 27 && mm == 6) { //TODO change
                const actionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('carrotEvent-aussaht')
                            .setLabel('Karottensamen aussäen')
                            .setStyle(ButtonStyle.Primary)
                    );

                await eventChannel.send({
                    files: ['./plugins/waldspiel/extensions/CarrotEvent/images/aussaht.png'],
                    components: [actionRow]
                })
            }
            if (dd == 28 && mm == 6) {
                const actionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('carrotEvent-gießen')
                            .setLabel('Karotte gießen')
                            .setStyle(ButtonStyle.Primary)
                    );

                await eventChannel.send({
                    files: ['./plugins/waldspiel/extensions/CarrotEvent/images/gießen.png'],
                    components: [actionRow]
                })
            }
            if (dd == 29 && mm == 6) {
                const actionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('carrotEvent-ernten')
                            .setLabel('Karotte herausziehen')
                            .setStyle(ButtonStyle.Primary)
                    );

                await eventChannel.send({
                    files: ['./plugins/waldspiel/extensions/CarrotEvent/images/ernten.png'],
                    components: [actionRow]
                })
            }
        }
    }

    getItems() {
        return require('./items.js');
    }
}

module.exports = CarrotEvent;
