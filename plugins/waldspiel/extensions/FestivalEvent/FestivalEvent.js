const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const UserData = require("../../../../lib/UserData.js");
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

        this.wheelIdle = path.join(this.imageDir, 'wheel_idle.webp');

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

        this.winnersPath = path.join(__dirname, 'winners.json');
        this.winners = this.loadWinners();
        this.mainMessageId = null;
    }

    loadWinners() {
        if (fs.existsSync(this.winnersPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.winnersPath, 'utf8'));
            } catch (e) {
                console.warn("[Festival-Extension] Fehler beim Laden der Gewinner:", e.message);
                return [];
            }
        }
        return [];
    }

    saveWinners() {
        try {
            fs.writeFileSync(this.winnersPath, JSON.stringify(this.winners, null, 2));
        } catch (e) {
            console.warn("[Festival-Extension] Fehler beim Speichern der Gewinner:", e.message);
        }
    }

    addWinner(username, prizeMsg, prizeValue) {
        if (prizeValue <= 0) return; // Only track actual wins
        this.winners.unshift({ user: username, prize: prizeMsg.split('!')[0] || prizeMsg, date: new Date().toISOString() });
        if (this.winners.length > 3) {
            this.winners = this.winners.slice(0, 3);
        }
        this.saveWinners();
    }

    isExtensionActive() {
        return false;
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

        const innerMeta = await sharp(this.wheelInner).metadata();
        const wheelSize = innerMeta.width;
        const pointerSize = 60;

        const pointerX = Math.round(width / 2 - pointerSize / 2);
        const pointerY = Math.round(height / 2 - wheelSize / 2 - 10);

        const bgBuf = await sharp(this.background).toBuffer();
        const pntBuf = await sharp(this.pointer).resize(pointerSize).toBuffer();

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
        const pntW = 60;
        const pntH = canvasPointer.height * (60 / canvasPointer.width);

        const drawFullFrame = (ctx, angle) => {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(canvasBg, 0, 0, width, height);
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(-angle * Math.PI / 180);
            ctx.drawImage(canvasWheel, -wheelW / 2, -wheelH / 2, wheelW, wheelH);
            ctx.restore();
            ctx.drawImage(canvasPointer, width / 2 - pntW / 2, height / 2 - wheelH / 2 - 10, pntW, pntH);
        };

        // 1. Idle
        if (!fs.existsSync(this.wheelIdle)) {
            const cvs = createCanvas(width, height);
            drawFullFrame(cvs.getContext('2d'), 0);
            const webpIdle = await sharp(cvs.toBuffer('image/png')).webp().toBuffer();
            fs.writeFileSync(this.wheelIdle, webpIdle);
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
        const berryId = 'B';

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
            if (outcome.value > 0) {
                const uData = await UserData.get(discordUserId);
                uData.addCurrency(berryId, outcome.value);
                await uData.save(plugin);

                this.addWinner(interaction.user.username, outcome.msg, outcome.value);
                await this.updateMainMessage(interaction.channel);
            }

            // Update only TEXT
            await interaction.editReply({
                content: `✨ **${outcome.msg}**\n\n💰 Neuer Kontostand: **${userData.getCurrency(berryId)} Beeren**\n\n*(Nachricht schließt sich gleich)*`,
            });

            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (e) { }
            }, 5000);

        }, 11000);
    }

    async updateMainMessage(channel) {
        if (!channel) return;

        const dynamicIdlePath = path.join(this.imageDir, 'wheel_main_dynamic.png');
        await this.generateDynamicMainImage(dynamicIdlePath);

        const attachment = new AttachmentBuilder(dynamicIdlePath, { name: `glücksrad_${Date.now()}.png` });

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

    async generateDynamicMainImage(outputPath) {
        const width = 800;
        const height = 300;
        const wheelWidth = 550;

        const bgBuf = await sharp(this.background).resize(width, height, { fit: 'fill' }).toBuffer();

        const innerMeta = await sharp(this.wheelInner).metadata();
        const wheelSize = innerMeta.width;
        const pointerSize = 60;

        const centerX = Math.round(wheelWidth / 2 - wheelSize / 2);
        const centerY = Math.round(height / 2 - wheelSize / 2);
        const pointerX = Math.round(wheelWidth / 2 - pointerSize / 2);
        const pointerY = Math.round(height / 2 - wheelSize / 2 - 10);

        const innerBuf = await sharp(this.wheelInner).toBuffer();
        const pointerBuf = await sharp(this.pointer).resize(pointerSize).toBuffer();

        // Prepare winners section
        let overlays = [
            { input: innerBuf, left: centerX, top: centerY },
            { input: pointerBuf, left: pointerX, top: pointerY }
        ];

        // Draw sidebar background
        const sidebarBg = await sharp({
            create: {
                width: 250,
                height: 280,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0.6 }
            }
        }).png().toBuffer();

        overlays.push({ input: sidebarBg, left: 540, top: 10 });

        // Prize Icon
        const prizeIconPath = path.join(this.imageDir, 'berry_prize.png');
        let prizeIconBuf = null;
        if (fs.existsSync(prizeIconPath)) {
            prizeIconBuf = await sharp(prizeIconPath).resize(30, 30).toBuffer();
        }

        // Generate SVG for winners text
        let winnersSvg = `
        <svg width="250" height="280">
            <style>
                .title { fill: #ffcc00; font-size: 20px; font-weight: bold; font-family: Arial; }
                .winner { fill: #ffffff; font-size: 14px; font-weight: bold; font-family: Arial; }
                .prize { fill: #eeeeee; font-size: 12px; font-family: Arial; }
            </style>
            <text x="10" y="30" class="title">🏆 Letzte Gewinner</text>
        `;

        if (this.winners.length === 0) {
            winnersSvg += `<text x="10" y="70" class="winner">Noch keine Gewinner...</text>`;
        } else {
            for (let i = 0; i < this.winners.length; i++) {
                const w = this.winners[i];
                const y = 80 + (i * 65);
                const name = w.user.length > 15 ? w.user.substring(0, 13) + ".." : w.user;

                winnersSvg += `
                    <text x="10" y="${y}" class="winner">${i + 1}. ${name}</text>
                    <text x="45" y="${y + 20}" class="prize">${w.prize}</text>
                `;

                if (prizeIconBuf) {
                    overlays.push({ input: prizeIconBuf, left: 540 + 10, top: 10 + y - 5 });
                }
            }
        }

        winnersSvg += `</svg>`;
        overlays.push({ input: Buffer.from(winnersSvg), left: 540, top: 10 });

        await sharp(bgBuf)
            .composite(overlays)
            .png()
            .toFile(outputPath);
    }

    async getShop(client, plugin, shopChannel) {
        await this.updateMainMessage(shopChannel);
    }
}

module.exports = FestivalEvent;
