const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, UserSelectMenuBuilder, ButtonStyle, Events, ChannelType } = require('discord.js');
const CustomId = require("../../../../discordBot/lib/CustomId.js");
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require("../../../../discordBot/lib/helper.js");
const sharp = require('sharp');
const axios = require('axios');

class FriendshipEvent {
    isExtensionActive() {
        return true; // Testweise immer aktiv
    }

    async preExecute(client, plugin) {
        if (!this.isExtensionActive()) return;
        console.log('[FriendshipEvent-Extension] started');
        await this.initEventChannel(client, plugin);
    }

    async onDailyTick(client, plugin, db) {
        if (!this.isExtensionActive()) return;
        await this.initEventChannel(client, plugin);
    }

    async initEventChannel(client, plugin) {
        // 0 Uhr oder Bot-Start Channel checken/erstellen
        let guildId = plugin['var'].server;
        if (!guildId) return;

        let guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        let channelName = "freundschaftsevent";
        let channel = guild.channels.cache.find(c => c.name === channelName);

        if (!channel) {
            try {
                // Finde Parent ID vom Postchannel
                let postChannelId = plugin['var'].postChannel;
                let postChannel = guild.channels.cache.get(postChannelId);
                let parentId = postChannel ? postChannel.parentId : null;

                channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: parentId
                });
            } catch (err) {
                console.error("Fehler beim Erstellen des Freundschaftsevent Channels:", err);
                return;
            }
        }

        // Alle nachrichten löschen
        try {
            let fetched = await channel.messages.fetch({ limit: 100 });
            await channel.bulkDelete(fetched);
        } catch (error) {
            if (error.code !== 50034) {
                console.error("Unerwarteter Fehler beim Löschen:", error);
            }
        }

        // Bild erstellen
        let mergeArray = [];
        try {
            let emptyAnimal = await sharp('plugins/waldspiel/images/tiere/Empty.png').resize(200).toBuffer();
            mergeArray.push({ input: emptyAnimal, left: 100, top: 50 });

            // Item, fangen falls es nicht existiert (wird später implementiert/auf dem server abgelegt)
            try {
                let itemImage = await sharp('./plugins/waldspiel/extensions/FriendshipEvent/images/friendship_item.png').resize(200).toBuffer();
                mergeArray.push({ input: itemImage, left: 100, top: 50 });
            } catch (ignore) { }

            await sharp('plugins/waldspiel/images/itemBackground.png') // ein background
                .resize(400, 300)
                .composite(mergeArray)
                .toFile('temp/friendshipevent.png');

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('freundschaftsevent-open')
                        .setLabel('🎯 Fortschritt anzeigen')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('freundschaftsevent-anleitung')
                        .setLabel('Wie geht das Event?')
                        .setStyle(ButtonStyle.Secondary)
                );

            const userSelectRow = new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId('freundschaftsevent-setfriend')
                    .setPlaceholder('Wähle (oder wechsle) deinen Event-Partner!')
                    .setMinValues(1)
                    .setMaxValues(1)
            );

            await channel.send({
                files: ['temp/friendshipevent.png'],
                components: [userSelectRow, actionRow]
            });

        } catch (err) {
            console.error("Fehler beim Erstellen des Freundschaftsbilds:", err);
        }
    }

    async onInteraction(interaction, client, plugin, db) {
        if (!this.isExtensionActive()) return;

        const isButton = (customId, target) => customId === target || customId.startsWith(target + "-");

        if (interaction.customId === 'freundschaftsevent-anleitung') {
            await interaction.reply({
                content: '**❤️ Freundschaftsevent**\nWähle einen anderen Spieler aus. Wenn du Beeren sammelst, erhält dein Freund ebenfalls die gleiche Anzahl an Beeren! Gleichzeitig sammelst du Punkte für dieses Event. Sammle 200 Punkte, um eine besondere Belohnung zu erhalten!',
                ephemeral: true
            });
            return;
        }

        if (interaction.customId === 'freundschaftsevent-open') {
            let discordUserDatabase = await getUserCurrencyFromDatabase(interaction.user.id, db);
            if (!discordUserDatabase) {
                await interaction.reply({ content: 'Fehler: User nicht in Datenbank', ephemeral: true });
                return;
            }

            let friendId = discordUserDatabase["friendshipSelectedFriend"];
            if (friendId) {
                // Zeige Progress Bar in ephemeral picture using sharp
                let currentPoints = discordUserDatabase["friendshipEventPoints"] || 0;
                let maxPoints = 200;
                let percent = Math.min(100, (currentPoints / maxPoints) * 100);

                let friendUser = await interaction.client.users.fetch(friendId).catch(() => null);
                let friendName = friendUser ? friendUser.username : "Unbekannt";

                let roundedAvatar;
                try {
                    let avatarUrl = friendUser ? friendUser.displayAvatarURL({ extension: 'png', size: 64 }) : null;
                    if (avatarUrl) {
                        let avatarRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
                        roundedAvatar = await sharp(Buffer.from(avatarRes.data))
                            .resize(50, 50)
                            .composite([{
                                input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="25" fill="white" /></svg>'),
                                blend: 'dest-in'
                            }])
                            .png()
                            .toBuffer();
                    }
                } catch (e) {
                    roundedAvatar = null;
                }

                let svg = `<svg width="550" height="130" xmlns="http://www.w3.org/2000/svg">
                    <text x="${roundedAvatar ? 85 : 20}" y="42" fill="#ffffff" font-size="20" font-family="Arial" font-weight="bold">Event-Partner: ${friendName}</text>
                    <!-- Foreground bar (progress) mapped to 530px maximum width -->
                    <rect x="10" y="90" width="${5.3 * percent}" height="30" fill="#E84545" rx="10"/>
                    <text x="275" y="111" fill="#ffffff" font-size="16" font-family="Arial" text-anchor="middle" font-weight="bold">${currentPoints} / ${maxPoints}</text>
                </svg>`;

                let compositeArr = [
                    { input: './plugins/waldspiel/extensions/FriendshipEvent/images/background_progressbar.png', left: 0, top: 80 }
                ];

                if (roundedAvatar) {
                    compositeArr.push({ input: roundedAvatar, left: 20, top: 15 });
                }

                compositeArr.push({ input: Buffer.from(svg), left: 0, top: 0 });

                await sharp({
                    create: {
                        width: 550,
                        height: 140, // Platz nach unten und oben
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    }
                })
                    .composite(compositeArr)
                    .toFile('temp/friendshipprogress.png');

                await interaction.reply({
                    files: ['temp/friendshipprogress.png'],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'Bitte wähle zuerst einen Freund aus dem Dropdown-Menü über den Buttons aus!',
                    ephemeral: true
                });
            }
        }

        if (interaction.customId === 'freundschaftsevent-setfriend') {
            let friendId = interaction.values[0];
            // Basic validation
            if (friendId === interaction.user.id) {
                await interaction.reply({ content: 'Du kannst nicht dich selbst auswählen!', ephemeral: true });
                return;
            }

            await updateUserFromDatabase(db, interaction.user.id, {
                $set: {
                    ["currency.friendshipSelectedFriend"]: friendId,
                    ["currency.friendshipEventPoints"]: 0
                }
            });

            await interaction.reply({ content: `Du hast <@${friendId}> erfolgreich als Freund für das Event ausgewählt! Sammle Beeren im Wald, um Ressourcen zu teilen.`, ephemeral: true });
        }
    }

    async onBerryCollected(client, plugin, interaction, db, discordUserId, amount) {
        if (!this.isExtensionActive()) return;

        let discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db);
        if (!discordUserDatabase) return;

        let friendId = discordUserDatabase["friendshipSelectedFriend"];
        if (friendId) {
            // Give berries to friend
            let friendDb = await getUserCurrencyFromDatabase(friendId, db);
            if (friendDb) {
                let friendBerry = friendDb[plugin['var'].berry];
                if (!friendBerry) friendBerry = 0;

                await updateUserFromDatabase(db, friendId, {
                    $set: { ["currency." + plugin['var'].berry]: friendBerry + amount }
                });
            }

            let currentEventPoints = discordUserDatabase["friendshipEventPoints"];
            if (!currentEventPoints) currentEventPoints = 0;

            let newPoints = currentEventPoints + amount;

            await updateUserFromDatabase(db, discordUserId, {
                $set: { ["currency.friendshipEventPoints"]: newPoints }
            });

            // Grant item if reaching 200
            if (currentEventPoints < 200 && newPoints >= 200) {
                let itemlist = discordUserDatabase.itemlist;
                if (!itemlist) itemlist = [];

                let itemId = 'FRIENDSHIP_CROWN'; // Wichtig: Dieses Item sollte existieren

                if (!itemlist.includes(itemId)) {
                    itemlist.push(itemId);
                    await updateUserFromDatabase(db, discordUserId, {
                        $set: { ["currency.itemlist"]: itemlist }
                    });

                    try {
                        let userOption = await client.users.fetch(discordUserId);
                        userOption.send("Du hast 200 Punkte beim Freundschaftsevent erreicht und ein neues Kleidungsstück erhalten!");
                    } catch (ignore) { }
                }
            }
        }
    }

    getItems() {
        return require('./items.js');
    }
}

module.exports = FriendshipEvent;
