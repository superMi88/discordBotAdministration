const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, UserSelectMenuBuilder, ButtonStyle, Events, ChannelType } = require('discord.js');
const CustomId = require("../../../../discordBot/lib/CustomId.js");
const UserData = require("../../../../lib/UserData.js");
const sharp = require('sharp');
const axios = require('axios');

class FriendshipEvent {
    isExtensionActive(plugin) {
        if (plugin && plugin['var'] && plugin['var'].eventFreundschaft === false) {
            return false;
        }

        const now = new Date();
        const month = now.getMonth(); // 0-indexed, 2 = März
        const date = now.getDate(); // 1-31

        // Event läuft nur im März (2) zwischen dem 1. und 7. Tag der ersten Woche
        return month === 2 && date >= 1 && date <= 8;
    }

    async preExecute(client, plugin) {
        console.log('[FriendshipEvent-Extension] checked event channel');
        await this.checkAndHandleEventChannel(client, plugin);
    }

    async onDailyTick(client, plugin, db) {
        await this.checkAndHandleEventChannel(client, plugin);
    }

    async checkAndHandleEventChannel(client, plugin) {
        if (!this.isExtensionActive(plugin)) {
            let guildId = plugin['var'].server;
            if (!guildId) return;

            let guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            let channelName = "freundschaftsevent";
            let channel = guild.channels.cache.find(c => c.name === channelName);

            if (channel) {
                try {
                    await channel.delete();
                    console.log("[FriendshipEvent] Event beendet. Channel gelöscht.");
                } catch (err) {
                    console.error("Fehler beim Löschen des Freundschaftsevent Channels:", err);
                }
            }
            return;
        }
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
                // Finde Parent ID von der Event Kategorie oder Fallback vom Postchannel
                let parentId = null;
                if (plugin['var'].eventCategory) {
                    parentId = plugin['var'].eventCategory;
                } else {
                    let postChannelId = plugin['var'].postChannel;
                    let postChannel = guild.channels.cache.get(postChannelId);
                    parentId = postChannel ? postChannel.parentId : null;
                }

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
            let emptyAnimal = await sharp('plugins/waldspiel/images/tiere/Empty.png').resize(160).toBuffer();

            // Linkes Tier (Yin)
            mergeArray.push({ input: emptyAnimal, left: 45, top: 60 });
            try {
                let itemImageYin = await sharp('./plugins/waldspiel/extensions/FriendshipEvent/images/friendship_item_yin.png').resize(160).toBuffer();
                mergeArray.push({ input: itemImageYin, left: 45, top: 60 });
            } catch (ignore) { }

            // Rechtes Tier (Yang)
            mergeArray.push({ input: emptyAnimal, left: 195, top: 60 });
            try {
                let itemImageYang = await sharp('./plugins/waldspiel/extensions/FriendshipEvent/images/friendship_item_yang.png').resize(160).toBuffer();
                mergeArray.push({ input: itemImageYang, left: 195, top: 60 });
            } catch (ignore) { }

            await sharp('./plugins/waldspiel/extensions/FriendshipEvent/images/friendship_background.png') // ein background
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
        if (!this.isExtensionActive(plugin)) return;

        const isButton = (customId, target) => customId === target || customId.startsWith(target + "-");

        if (interaction.customId === 'freundschaftsevent-anleitung') {
            await interaction.reply({
                content: '**❤️ Freundschaftsevent**\nWähle einen anderen Spieler aus. Wenn du Beeren sammelst, erhält dein Freund ebenfalls die gleiche Anzahl an Beeren! Gleichzeitig sammelst du Punkte für dieses Event. Sammle 200 Punkte, um eine besondere Belohnung zu erhalten!',
                ephemeral: true
            });
            return;
        }

        if (interaction.customId === 'freundschaftsevent-open') {
            let discordUserData = await UserData.get(interaction.user.id);
            if (!discordUserData) {
                await interaction.reply({ content: 'Fehler: User nicht in Datenbank', ephemeral: true });
                return;
            }

            let friendId = discordUserData.getCurrency("friendshipSelectedFriend");
            if (friendId) {
                // Zeige Progress Bar in ephemeral picture using sharp
                let currentPoints = discordUserData.getCurrency("friendshipEventPoints") || 0;
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
                            .resize(24, 24)
                            .composite([{
                                input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="12" fill="white" /></svg>'),
                                blend: 'dest-in'
                            }])
                            .png()
                            .toBuffer();
                    }
                } catch (e) {
                    roundedAvatar = null;
                }

                let progressSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
                    <!-- Foreground bar (progress) mapped to 380px maximum width -->
                    <rect x="10" y="60" width="${3.8 * percent}" height="30" fill="#E84545"/>
                </svg>`;

                let textSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
                    <text x="15" y="24" fill="#ffffff" font-size="14" font-family="Arial" font-weight="bold">Event Partner</text>
                    <text x="${roundedAvatar ? 150 : 120}" y="24" fill="#ffffff" font-size="14" font-family="Arial" font-weight="bold">${friendName}</text>
                    <text x="15" y="48" fill="#ffffff" font-size="14" font-family="Arial" font-weight="normal">Geteilte Beeren mit einem Freund</text>
                    <text x="200" y="81" fill="#ffffff" font-size="16" font-family="Arial" text-anchor="middle" font-weight="bold">${currentPoints} / ${maxPoints}</text>
                </svg>`;

                let compositeArr = [];

                // 1. Progress Bar Balken (ohne Rundungen)
                compositeArr.push({ input: Buffer.from(progressSvg), left: 0, top: 0 });

                // 2. Overlay Bild
                const overlayPath = './plugins/waldspiel/extensions/FriendshipEvent/images/background_progressbar_overlay.png';
                if (require('fs').existsSync(overlayPath)) {
                    let overlayBuffer = await sharp(overlayPath).resize(400, 100, { fit: 'fill' }).png().toBuffer();
                    compositeArr.push({ input: overlayBuffer, left: 0, top: 0 });
                }

                // 3. Profilbild
                if (roundedAvatar) {
                    compositeArr.push({ input: roundedAvatar, left: 120, top: 8 });
                }

                // 4. Texte (Name und Punkte)
                compositeArr.push({ input: Buffer.from(textSvg), left: 0, top: 0 });

                await sharp('./plugins/waldspiel/extensions/FriendshipEvent/images/background_progressbar.png')
                    .resize(400, 100, { fit: 'fill' })
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

            let discordUserData = await UserData.get(interaction.user.id);
            discordUserData.setCurrency("friendshipSelectedFriend", friendId);
            await discordUserData.save();

            await interaction.reply({ content: `Du hast <@${friendId}> erfolgreich als Freund für das Event ausgewählt! Sammle Beeren im Wald, um Ressourcen zu teilen.`, ephemeral: true });
        }
    }

    async onBerryCollected(client, plugin, interaction, db, discordUserId, amount) {
        if (!this.isExtensionActive(plugin)) return;

        let discordUserData = await UserData.get(discordUserId);
        if (!discordUserData) return;

        let friendId = discordUserData.getCurrency("friendshipSelectedFriend");
        if (friendId) {
            // Give berries to friend
            let friendData = await UserData.get(friendId);
            if (friendData) {
                let friendBerry = friendData.getCurrency(plugin['var'].berry);
                if (!friendBerry) friendBerry = 0;

                friendData.setCurrency(plugin['var'].berry, friendBerry + amount);
                await friendData.save();
            }

            let currentEventPoints = discordUserData.getCurrency("friendshipEventPoints");
            if (!currentEventPoints) currentEventPoints = 0;

            let newPoints = currentEventPoints + amount;

            discordUserData.setCurrency("friendshipEventPoints", newPoints);
            await discordUserData.save();

            // Grant items if reaching 200
            if (currentEventPoints < 200 && newPoints >= 200) {
                let itemlist = discordUserData.getCurrency("itemlist");
                if (!itemlist) itemlist = [];

                let itemIdYin = 'FRIENDSHIP_YIN';
                let itemIdYang = 'FRIENDSHIP_YANG';
                let updated = false;

                if (!itemlist.includes(itemIdYin)) {
                    itemlist.push(itemIdYin);
                    updated = true;
                }
                if (!itemlist.includes(itemIdYang)) {
                    itemlist.push(itemIdYang);
                    updated = true;
                }

                if (updated) {
                    discordUserData.setCurrency("itemlist", itemlist);
                    await discordUserData.save();

                    try {
                        let userOption = await client.users.fetch(discordUserId);
                        userOption.send("Du hast 200 Punkte beim Freundschaftsevent erreicht und ZWEI neue Kleidungsstücke erhalten (Yin & Yang)!");
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
