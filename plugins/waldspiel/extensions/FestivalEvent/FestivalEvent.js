const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, AttachmentBuilder } = require('discord.js');
const UserData = require("../../../../lib/UserData.js");
const DatabaseManager = require("../../../../lib/DatabaseManager.js");
const sharp = require('sharp');
const WebP = require('node-webpmux');
const path = require('path');
const fs = require('fs');

class FestivalEvent {
    constructor() {
        this.imageDir = path.join(__dirname, 'images');
        this.background = path.join(this.imageDir, 'festival_background.png');
        this.wheelInner = path.join(this.imageDir, 'wheel_inner.png');
        this.pointer = path.join(this.imageDir, 'wheel_pointer.png');

        this.wheelIdle = path.join(this.imageDir, 'wheel_idle.webp');
        this.wheelSpinning = path.join(this.imageDir, 'wheel_spinning.webp');

        // Results mapping to 1-16
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
    }

    isExtensionActive() {
        return true;
    }

    async preExecute(client, plugin) {
        if (!this.isExtensionActive()) return;
        console.log('[Festival-Extension] gestartet (16 Segmente)');

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
                console.log("[Festival-Extension] Erstelle Jahrmarkt-Kanal...");
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

            const messages = await channel.messages.fetch({ limit: 5 });
            if (messages.size === 0) {
                await this.sendWelcomeMessage(channel);
            }
        } catch (err) {
            console.warn("[Festival-Extension] Fehler:", err.message);
        }
    }

    async sendWelcomeMessage(target) {
        const attachment = new AttachmentBuilder(this.wheelIdle, { name: 'glücksrad.webp' });
        
        const embed = {
            title: "🎪 Jahrmarkt am Strand",
            description: "Versuche dein Glück am Glücksrad (16 Felder!). Aktuell **gratis zum Testen!**",
            image: { url: 'attachment://glücksrad.webp' },
            color: 0xFFA500
        };

        const button = new ButtonBuilder()
            .setCustomId('festival_spin')
            .setLabel('Am Rad drehen (Gratis zum Testen!)')
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder().addComponents(button);

        await target.send({
            embeds: [embed],
            files: [attachment],
            components: [row]
        });
    }

    async prepareImages() {
        if (!fs.existsSync(this.imageDir)) return;

        const wheelSize = 189;
        const pointerSize = 60;
        const pointerX = 275 - Math.floor(pointerSize / 2);
        const pointerY = 150 - Math.floor(wheelSize / 2) - 10;

        const bgBuf = await sharp(this.background).toBuffer();
        const pntBuf = await sharp(this.pointer).resize(pointerSize).toBuffer();

        // 1. Idle
        if (!fs.existsSync(this.wheelIdle)) {
            const inner = await sharp(this.wheelInner).toBuffer();
            const centerX = 275 - Math.floor(wheelSize / 2);
            const centerY = 150 - Math.floor(wheelSize / 2);
            await sharp(bgBuf)
                .composite([
                    { input: inner, left: centerX, top: centerY },
                    { input: pntBuf, left: pointerX, top: pointerY }
                ])
                .webp()
                .toFile(this.wheelIdle);
        }

        // 2. Spinning Animations (für 16 Resultate!)
        const totalFrames = 70;
        for (let r = 0; r < 16; r++) {
            const spinPath = path.join(this.imageDir, `wheel_spin_${r}.webp`);
            if (!fs.existsSync(spinPath)) {
                console.log(`[Festival-Extension] Generiere flüssige Animation (v2) für Resultat ${r + 1}...`);
                const frameBuffers = [];
                const finalAngle = r * (360 / 16);
                const totalRotation = (360 * 2) + finalAngle;

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

                    const rotatedInnerBuf = await sharp(this.wheelInner)
                        .rotate(-angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .toBuffer();
                    
                    const meta = await sharp(rotatedInnerBuf).metadata();
                    const curLeft = 275 - Math.floor(meta.width / 2);
                    const curTop = 150 - Math.floor(meta.height / 2);

                    const frame = await sharp(bgBuf)
                        .composite([
                            { input: rotatedInnerBuf, left: curLeft, top: curTop },
                            { input: pntBuf, left: pointerX, top: pointerY }
                        ])
                        .webp({ quality: 60 })
                        .toBuffer();
                    
                    let delay;
                    if (t < split) {
                        delay = 100;
                    } else {
                        delay = 100 + Math.pow((t - split) / (1 - split), 2) * 400;
                    }
                    
                    frameBuffers.push(await WebP.Image.generateFrame({ buffer: frame, delay: Math.round(delay), dispose: true, blend: false }));
                }

                // Füge am Ende ein sehr langes Standbild hinzu (20 Sekunden), um Sprung zurück zu verhindern
                const lastFrame = frameBuffers[frameBuffers.length - 1];
                frameBuffers.push({ ...lastFrame, delay: 20000 });

                await WebP.Image.save(spinPath, { width: 550, height: 300, loops: 1, frames: frameBuffers });
            }
        }

        // 3. Results (Statisch)
        for (let i = 0; i < 16; i++) {
            const resultPath = path.join(this.imageDir, `wheel_result_${i}.webp`);
            if (!fs.existsSync(resultPath)) {
                const angle = i * (360 / 16);
                const rotatedInnerBuf = await sharp(this.wheelInner)
                    .rotate(-angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .toBuffer();
                
                const meta = await sharp(rotatedInnerBuf).metadata();
                const curLeft = 275 - Math.floor(meta.width / 2);
                const curTop = 150 - Math.floor(meta.height / 2);

                await sharp(bgBuf)
                    .composite([
                        { input: rotatedInnerBuf, left: curLeft, top: curTop },
                        { input: pntBuf, left: pointerX, top: pointerY }
                    ])
                    .webp()
                    .toFile(resultPath);
            }
        }
    }

    async handleSpin(interaction, client, plugin) {
        const discordUserId = interaction.user.id;
        const userData = await UserData.get(discordUserId);
        const berryId = 'B';

        const resultIdx = Math.floor(Math.random() * 16);
        const outcome = this.outcomes[resultIdx];
        const spinPath = path.join(this.imageDir, `wheel_spin_${resultIdx}.webp`);
        const resultPath = path.join(this.imageDir, `wheel_result_${resultIdx}.webp`);

        const spinAttachment = new AttachmentBuilder(spinPath, { name: 'spinning.webp' });
        
        const spinEmbed = {
            title: "🎡 Das Rad dreht sich...",
            image: { url: 'attachment://spinning.webp' },
            color: 0xFFA500
        };

        await interaction.update({
            embeds: [spinEmbed],
            files: [spinAttachment],
            components: []
        });

        // Einziger Timeout nach 12 Sekunden (wenn Rad sicher steht)
        setTimeout(async () => {
            if (outcome.value > 0) {
                const uData = await UserData.get(discordUserId);
                uData.addCurrency(berryId, outcome.value);
                await uData.save(plugin);
            }

            const resultAttachment = new AttachmentBuilder(resultPath, { name: 'result.webp' });
            
            const resultEmbed = {
                title: "✨ Ergebnis",
                description: `${outcome.msg}\nNeuer Kontostand: **${userData.getCurrency(berryId)} Beeren**`,
                image: { url: 'attachment://result.webp' },
                color: 0x00FF00
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('festival_spin')
                    .setLabel('Nochmal drehen (Gratis!)')
                    .setStyle(ButtonStyle.Success)
            );

            await interaction.editReply({
                embeds: [resultEmbed],
                files: [resultAttachment],
                components: [row]
            });
        }, 12000);
    }

    async getShop(client, plugin, shopChannel) {
        await this.sendWelcomeMessage(shopChannel);
    }
}

module.exports = FestivalEvent;
