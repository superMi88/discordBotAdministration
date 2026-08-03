const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const UserData = require("../../../../lib/UserData.js");
const ImageCreator = require('../../imageCreator.js');
const sharp = require('sharp');
const GIFEncoder = require('gifencoder');
const path = require('path');
const fs = require('fs');

class FestivalEvent {
    constructor() {
        this.imageDir = path.join(__dirname, 'images');
        this.background = path.join(this.imageDir, 'festival_background.png');
        this.wheelInner = path.join(this.imageDir, 'wheel_inner.png');
        this.pointer = path.join(this.imageDir, 'wheel_pointer.png');

        this.wheelIdle = path.join(this.imageDir, 'wheel_idle.png');

        this.outcomes = [
            { label: "1", value: 10, msg: "Nr 1! Einsatz zurück!" },
            { label: "2", value: 20, msg: "Nr 2! Doppelter Gewinn!" },
            { label: "3", value: 0, msg: "Nr 3... Niete." },
            { label: "4", value: 5, msg: "Nr 4! Immerhin 5 Beeren." },
            { label: "5", value: 15, msg: "Nr 5! Ein kleiner Profit!" },
            { label: "6", value: 50, msg: "Nr 6! FAST-JACKPOT! 50 Beeren!" },
            { label: "7", value: 0, msg: "Nr 7... Leider nichts." },
            { label: "8", value: 10, msg: "Nr 8! Einsatz zurück." },
            { label: "9", value: 25, msg: "Nr 9! Super Gewinn!" },
            { label: "10", value: 0, msg: "Nr 10... Knapp daneben." },
            { label: "11", value: 30, msg: "Nr 11! Stolze 30 Beeren!" },
            { label: "12", value: 5, msg: "Nr 12! Besser als nichts." },
            { label: "13", value: 100, msg: "Nr 13!!! MEGA-JACKPOT! 100 BEEREN!" },
            { label: "14", value: 0, msg: "Nr 14... Kein Glück." },
            { label: "15", value: 12, msg: "Nr 15! Ein kleiner Bonus." },
            { label: "16", value: 0, msg: "Nr 16... Endstation." }
        ];

        this.mainMessageId = null;
    }

    getItems() {
        return require('./items.js');
    }

    isExtensionActive() {
        return true;
    }

    async preExecute(client, plugin) {
        if (!this.isExtensionActive()) return;
        console.log('[Festival-Extension] gestartet (GIF Animation)');

        await this.prepareImages();

        client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isButton()) return;
            if (interaction.customId === 'festival_spin') {
                await this.handleSpin(interaction, client, plugin);
            }
        });

        await this.initFestivalChannel(client, plugin);
    }

    async initFestivalChannel(client, plugin) {
        try {
            const guildId = plugin['var'].server;
            const guild = await client.guilds.fetch(guildId);
            if (!guild) return;

            const categoryId = plugin['var'].eventCategory;
            const channelName = '🎪-jahrmarkt';

            let channel = guild.channels.cache.find(c => c.name === channelName || c.name.includes('jahrmarkt') || c.name.includes('festplatz'));

            if (!channel) {
                channel = await guild.channels.create({
                    name: channelName,
                    type: 0,
                    parent: categoryId,
                    topic: "🎡 Willkommen auf dem Jahrmarkt! Viel Glück am Glücksrad!",
                    reason: "Festival Event Extension Initialization"
                });
            } else if (categoryId && channel.parentId !== categoryId) {
                try {
                    await channel.setParent(categoryId);
                } catch (e) {
                    console.warn("[Festival-Extension] Kategoriefehler:", e.message);
                }
            }

            // Find the main message if it exists
            const messages = await channel.messages.fetch({ limit: 20 });
            const mainMsg = messages.find(m => m.author.id === client.user.id && m.content.includes("Willkommen auf dem Jahrmarkt"));

            if (mainMsg) {
                this.mainMessageId = mainMsg.id;
            }

            await this.updateMainMessage(channel);
        } catch (err) {
            console.warn("[Festival-Extension] Fehler:", err.message);
        }
    }


    async prepareImages() {
        if (!fs.existsSync(this.imageDir)) return;

        const width = 550;
        const height = 300;

        // 2. Spinning Animations (als WebP!)
        const WebP = require('node-webpmux');
        const { createCanvas, loadImage } = require('canvas');
        const totalFrames = 60;

        // Load images for canvas once
        const canvasBg = await loadImage(this.background);
        const canvasWheel = await loadImage(this.wheelInner);
        const canvasPointer = await loadImage(this.pointer);

        const wheelW = canvasWheel.width;
        const wheelH = canvasWheel.height;
        const pntW = canvasPointer.width;
        const pntH = canvasPointer.height;

        const drawFullFrame = (ctx, angle) => {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(canvasBg, 0, 0, width, height);
            ctx.save();
            ctx.translate(width / 2, height / 2 + 5);
            ctx.rotate(-angle * Math.PI / 180);
            ctx.drawImage(canvasWheel, -wheelW / 2, -wheelH / 2, wheelW, wheelH);
            ctx.restore();
            ctx.drawImage(canvasPointer, width / 2 - pntW / 2, height / 2 + 5 - wheelH / 2 - 33, pntW, pntH);
        };

        // 1. Idle
        if (!fs.existsSync(this.wheelIdle)) {
            const cvs = createCanvas(width, height);
            drawFullFrame(cvs.getContext('2d'), 0);
            fs.writeFileSync(this.wheelIdle, cvs.toBuffer('image/png'));
        }

        // 2. Animations
        for (let r = 0; r < 16; r++) {
            const spinPath = path.join(this.imageDir, `wheel_spin_${r}.webp`);
            if (!fs.existsSync(spinPath)) {
                console.log(`[Festival-Extension] Generiere WebP (Canvas) für Resultat ${r + 1}...`);
                const finalResultAngle = r * (360 / 16);
                const totalRotation = (360 * 2) + finalResultAngle;
                const frameObjects = [];

                const cvs = createCanvas(width, height);
                const ctx = cvs.getContext('2d');

                for (let i = 0; i < totalFrames; i++) {
                    const t = i / (totalFrames - 1);
                    const split = 0.6;
                    let progress;
                    if (t < split) {
                        const S = split;
                        const a = 3 / (1 + 2 * S);
                        progress = a * t;
                    } else {
                        const S = split;
                        const a = 3 / (1 + 2 * S);
                        const b = (1 - a * S) / Math.pow(1 - S, 3);
                        progress = 1 - b * Math.pow(1 - t, 3);
                    }

                    const angle = progress * totalRotation;
                    drawFullFrame(ctx, angle);

                    const webpBuf = await sharp(cvs.toBuffer('image/png')).webp().toBuffer();

                    let delayTime;
                    if (t < split) {
                        delayTime = 100;
                    } else {
                        delayTime = 100 + Math.pow((t - split) / (1 - split), 2) * 400;
                    }

                    const frame = await WebP.Image.generateFrame({ buffer: webpBuf, delay: Math.round(delayTime) });
                    frameObjects.push(frame);
                }

                // Letzter Frame (Sicherstellung, dass er exakt auf dem Ergebnis steht)
                drawFullFrame(ctx, totalRotation);
                const lastFrameWebp = await sharp(cvs.toBuffer('image/png')).webp().toBuffer();
                const lastFrame = await WebP.Image.generateFrame({ buffer: lastFrameWebp, delay: 10000 });
                frameObjects.push(lastFrame);

                await WebP.Image.save(spinPath, { frames: frameObjects, width, height, loops: 0 });
            }
        }

        // 3. Results (PNGs für andere Zwecke)
        for (let i = 0; i < 16; i++) {
            const resultPath = path.join(this.imageDir, `wheel_result_${i}.png`);
            if (!fs.existsSync(resultPath)) {
                const cvs = createCanvas(width, height);
                drawFullFrame(cvs.getContext('2d'), i * (360 / 16));
                fs.writeFileSync(resultPath, cvs.toBuffer('image/png'));
            }
        }
    }

    async handleSpin(interaction, client, plugin) {
        const discordUserId = interaction.user.id;
        const berryId = plugin['var'].berry;

        const resultIdx = Math.floor(Math.random() * 16);
        const outcome = this.outcomes[resultIdx];
        const spinPath = path.join(this.imageDir, `wheel_spin_${resultIdx}.webp`);

        const spinAttachment = new AttachmentBuilder(spinPath, { name: `spinning_${Date.now()}.webp` });

        // Use regular message as requested
        await interaction.reply({
            content: "🎡 **Viel Glück! Das Rad dreht sich...**",
            files: [spinAttachment],
            ephemeral: true
        });

        setTimeout(async () => {
            const userData = await UserData.get(discordUserId);
            let dataChanged = false;

            if (outcome.value > 0) {
                userData.addCurrency(berryId, outcome.value);
                dataChanged = true;
            }

            // Ballon Gewinn-Logik (10% Chance, falls noch nicht alle 4 Ballons gesammelt wurden)
            const balloonMap = {
                'FESTIVAL_BALLON_BLAU': { name: 'blauen Ballon', file: 'ballon-blau.png' },
                'FESTIVAL_BALLON_GELB': { name: 'gelben Ballon', file: 'ballon-gelb.png' },
                'FESTIVAL_BALLON_GRUEN': { name: 'grünen Ballon', file: 'ballon-grün.png' },
                'FESTIVAL_BALLON_ROT': { name: 'roten Ballon', file: 'ballon-rot.png' }
            };

            let itemlist = userData.getPluginData(plugin, 'itemlist');
            if (!itemlist) itemlist = [];

            const missingBalloons = Object.keys(balloonMap).filter(id => !itemlist.includes(id));
            let wonBalloon = null;

            if (missingBalloons.length > 0 && Math.random() < 0.90) {
                const randomId = missingBalloons[Math.floor(Math.random() * missingBalloons.length)];
                itemlist.push(randomId);
                userData.setPluginData(plugin, 'itemlist', itemlist);
                wonBalloon = balloonMap[randomId];
                dataChanged = true;
            }

            if (dataChanged) {
                await userData.save(plugin);
            }



            // Falls ein Ballon gewonnen wurde, wird dies wie beim Beerenpflücken öffentlich angekündigt (nur Ping + Bild)
            if (wonBalloon) {
                const balloonPath = path.join(this.imageDir, wonBalloon.file);
                const generatedImagePath = await ImageCreator.createCatchBalloonImage(interaction.member, wonBalloon.name, balloonPath);
                const balloonAttachment = new AttachmentBuilder(generatedImagePath, { name: wonBalloon.file });
                await interaction.channel.send({
                    content: `<@${interaction.user.id}>`,
                    files: [balloonAttachment]
                });
            }

            // Löschen der Ephemeral-Nachricht nach 5 Sekunden
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (e) { }
            }, 5000);

        }, 11000);
    }

    async updateMainMessage(channel) {
        if (!channel) return;

        const attachment = new AttachmentBuilder(this.wheelIdle, { name: `glücksrad_${Date.now()}.png` });

        const button = new ButtonBuilder()
            .setCustomId('festival_spin')
            .setLabel('Am Rad drehen (Gratis!)')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const content = "🎪 **Willkommen auf dem Jahrmarkt am Strand!** 🎡\nVersuche dein Glück am Glücksrad (16 Felder!).";

        if (this.mainMessageId) {
            try {
                const msg = await channel.messages.fetch(this.mainMessageId);
                await msg.edit({
                    content: content,
                    files: [attachment],
                    components: [row]
                });
                return;
            } catch (e) {
                console.warn("[Festival-Extension] Hauptnachricht nicht gefunden, sende neu.");
            }
        }

        // Send new message if ID is missing or message deleted
        const newMsg = await channel.send({
            content: content,
            files: [attachment],
            components: [row]
        });
        this.mainMessageId = newMsg.id;
    }

    async getShop(client, plugin, shopChannel) {
        if (!this.isExtensionActive()) return;
        await this.updateMainMessage(shopChannel);
    }

}

module.exports = FestivalEvent;
