const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, AttachmentBuilder } = require('discord.js');
const UserData = require("../../../../lib/UserData.js");
const ImageCreator = require('../../imageCreator.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class FestivalEvent {
    constructor() {
        this.imageDir = path.join(__dirname, 'images');
        this.background = path.join(this.imageDir, 'festival_background.png');
        this.wheelInner = path.join(this.imageDir, 'wheel_inner.png');
        this.pointer = path.join(this.imageDir, 'wheel_pointer.png');
        this.wheelIdle = path.join(this.imageDir, 'wheel_idle.png');
        this.berryPrize = path.join(__dirname, '../../images/sprites/berry.png');

        this.mainMessageId = null;
    }

    getItems() {
        return require('./items.js');
    }

    /**
     * Ermittelt das Datum des letzten Sonntags im angegebenen Monat (0-11).
     */
    getLastSundayOfMonth(year, month) {
        const lastDay = new Date(year, month + 1, 0); // Letzter Tag des Monats
        const dayOfWeek = lastDay.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
        const lastSundayDate = lastDay.getDate() - dayOfWeek;
        return new Date(year, month, lastSundayDate);
    }

    /**
     * Prüft, ob das FestivalEvent aktuell aktiv ist.
     * Das Event läuft am letzten Wochenende des Monats:
     * Start: Samstag 00:00:00 Uhr (vor dem letzten Sonntag)
     * Ende: Letzter Sonntag 23:59:59.999 Uhr
     */
    isExtensionActive(plugin) {
        if (plugin && plugin['var'] && plugin['var'].eventFestival === false) {
            return false;
        }

        const now = new Date();
        const lastSunday = this.getLastSundayOfMonth(now.getFullYear(), now.getMonth());

        // Samstag 00:00:00.000 Uhr
        const start = new Date(lastSunday.getFullYear(), lastSunday.getMonth(), lastSunday.getDate() - 1, 0, 0, 0, 0);
        // Sonntag 23:59:59.999 Uhr
        const end = new Date(lastSunday.getFullYear(), lastSunday.getMonth(), lastSunday.getDate(), 23, 59, 59, 999);

        return now >= start && now <= end;
    }

    /**
     * Wird beim Bot-/Plugin-Start ausgeführt.
     */
    async preExecute(client, plugin) {
        console.log('[Festival-Extension] gestartet & prüfe Event-Status...');
        await this.checkAndHandleEventChannel(client, plugin);
    }

    /**
     * Wird vom täglichen Mitternachts-Cronjob (00:00 Uhr) aufgerufen.
     */
    async onDailyTick(client, plugin, db) {
        console.log('[Festival-Extension] Daily-Tick empfangen, aktualisiere Channel-Status...');
        await this.checkAndHandleEventChannel(client, plugin);
    }

    /**
     * Hook für Interaktionen vom ExtensionManager.
     */
    async onInteraction(interaction, client, plugin, db) {
        if (!this.isExtensionActive(plugin)) return;
        if (!interaction.isButton()) return;
        if (interaction.customId === 'festival_spin') {
            await this.handleSpin(interaction, client, plugin);
        }
    }

    /**
     * Überprüft und steuert das Vorhandensein des Event-Channels je nach Aktivitätsstatus.
     */
    async checkAndHandleEventChannel(client, plugin) {
        const guildId = plugin?.['var']?.server;
        if (!guildId) return;

        let guild = client.guilds.cache.get(guildId);
        if (!guild) {
            try {
                guild = await client.guilds.fetch(guildId);
            } catch (e) {
                console.warn('[Festival-Extension] Guild konnte nicht geladen werden:', e.message);
                return;
            }
        }
        if (!guild) return;

        const channelName = '🎪-jahrmarkt';
        const existingChannel = guild.channels.cache.find(c => c.name === channelName || c.name.includes('jahrmarkt') || c.name.includes('festplatz'));

        if (!this.isExtensionActive(plugin)) {
            if (existingChannel) {
                try {
                    await existingChannel.delete('Festival-Event beendet.');
                    console.log('[Festival-Extension] Event nicht aktiv/beendet. Jahrmarkt-Channel gelöscht.');
                    this.mainMessageId = null;
                } catch (err) {
                    console.error('[Festival-Extension] Fehler beim Löschen des Event-Channels:', err);
                }
            }
            return;
        }

        // Event ist aktiv!
        console.log('[Festival-Extension] Event ist AKTIV! Bereite Jahrmarkt vor...');
        await this.prepareImages();
        await this.initFestivalChannel(client, plugin, guild, existingChannel);
    }

    /**
     * Erstellt oder aktualisiert den Event-Channel und die Hauptnachricht mit dem Glücksrad.
     */
    async initFestivalChannel(client, plugin, guild, existingChannel) {
        try {
            if (!guild) {
                const guildId = plugin['var'].server;
                guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
            }
            if (!guild) return;

            const categoryId = plugin['var']?.eventCategory || (plugin['var']?.postChannel ? guild.channels.cache.get(plugin['var'].postChannel)?.parentId : null);
            const channelName = '🎪-jahrmarkt';

            let channel = existingChannel || guild.channels.cache.find(c => c.name === channelName || c.name.includes('jahrmarkt') || c.name.includes('festplatz'));

            if (!channel) {
                channel = await guild.channels.create({
                    name: channelName,
                    type: 0, // GuildText
                    parent: categoryId || undefined,
                    topic: "🎡 Willkommen auf dem Jahrmarkt! Viel Glück am Glücksrad!",
                    reason: "Festival Event Extension Start"
                });
            } else if (categoryId && channel.parentId !== categoryId) {
                try {
                    await channel.setParent(categoryId);
                } catch (e) {
                    console.warn("[Festival-Extension] Kategoriefehler:", e.message);
                }
            }

            // Nach bestehender Hauptnachricht suchen
            const messages = await channel.messages.fetch({ limit: 50 });
            const mainMsg = messages.find(m => m.author.id === client.user.id && m.content.includes("Willkommen auf dem Jahrmarkt"));

            if (mainMsg) {
                this.mainMessageId = mainMsg.id;
            }

            await this.updateMainMessage(channel);
        } catch (err) {
            console.warn("[Festival-Extension] Fehler in initFestivalChannel:", err.message);
        }
    }

    async prepareImages() {
        if (!fs.existsSync(this.imageDir)) return;

        // Ensure 8-field wheel image exists as wheel_inner.png
        const gluckWheelPath = path.join(this.imageDir, 'glücksrad-inneres.png');
        if (fs.existsSync(gluckWheelPath)) {
            try {
                fs.copyFileSync(gluckWheelPath, this.wheelInner);
            } catch (e) {}
        }

        const WebP = require('node-webpmux');
        const { createCanvas, loadImage } = require('canvas');

        const width = 550;
        const height = 300;

        let canvasBg = null;
        let canvasWheel = null;
        let canvasPointer = null;

        const loadBaseCanvas = async () => {
            if (!canvasBg) canvasBg = await loadImage(fs.readFileSync(this.background));
            if (!canvasWheel) canvasWheel = await loadImage(fs.readFileSync(this.wheelInner));
            if (!canvasPointer) canvasPointer = await loadImage(fs.readFileSync(this.pointer));
        };

        const drawFullFrame = (ctx, angle) => {
            const wheelW = canvasWheel.width;
            const wheelH = canvasWheel.height;
            const pntW = canvasPointer.width;
            const pntH = canvasPointer.height;

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(canvasBg, 0, 0, width, height);
            ctx.save();
            ctx.translate(width / 2, height / 2 + 5);
            // Positive angle = CLOCKWISE rotation in Canvas 2D
            ctx.rotate(angle * Math.PI / 180);
            ctx.drawImage(canvasWheel, -wheelW / 2, -wheelH / 2, wheelW, wheelH);
            ctx.restore();
            ctx.drawImage(canvasPointer, width / 2 - pntW / 2, height / 2 + 5 - wheelH / 2 - 33, pntW, pntH);
        };

        // 1. Idle image (centered on yellow Hauptpreis field at phi = 337.5°, clockwise rotation = 22.5°)
        if (!fs.existsSync(this.wheelIdle)) {
            await loadBaseCanvas();
            const cvsIdle = createCanvas(width, height);
            drawFullFrame(cvsIdle.getContext('2d'), 22.5);
            fs.writeFileSync(this.wheelIdle, cvsIdle.toBuffer('image/png'));
        }

        // Helper to generate a spin animation with popup (Clockwise)
        const generateSpinAnimation = async ({ itemImage, titleText, type = 'item', outputPath, phiDeg = 337.5 }) => {
            if (fs.existsSync(outputPath)) return; // Bereits generiert!

            await loadBaseCanvas();

            const itmW = itemImage ? itemImage.width : 0;
            const itmH = itemImage ? itemImage.height : 0;

            const cvs = createCanvas(width, height);
            const ctx = cvs.getContext('2d');

            const spinFrames = 36;
            // Clockwise rotation to bring phiDeg to 12 o'clock (0 deg)
            const targetOffset = (360 - phiDeg) % 360;
            const totalRotation = (360 * 3) + targetOffset; // 3 full clockwise turns + target offset
            const frameObjects = [];

            // 1. Spinning Phase (~2.8s, Clockwise)
            for (let i = 0; i < spinFrames; i++) {
                const t = i / (spinFrames - 1);
                const progress = 1 - Math.pow(1 - t, 2.5);
                const angle = progress * totalRotation;

                drawFullFrame(ctx, angle);

                const webpBuf = await sharp(cvs.toBuffer('image/png')).webp().toBuffer();
                const delay = Math.round(50 + Math.pow(t, 2) * 130);
                const frame = await WebP.Image.generateFrame({ buffer: webpBuf, delay });
                frameObjects.push(frame);
            }

            const sparkles = [
                { angle: 0.2, dist: 80, size: 6, color: '#ffd700' },
                { angle: 0.8, dist: 95, size: 5, color: '#ff6b6b' },
                { angle: 1.5, dist: 75, size: 7, color: '#4ecdc4' },
                { angle: 2.2, dist: 90, size: 6, color: '#ffe66d' },
                { angle: 2.9, dist: 85, size: 5, color: '#ff9ff3' },
                { angle: 3.6, dist: 95, size: 7, color: '#54a0ff' },
                { angle: 4.3, dist: 80, size: 6, color: '#1dd1a1' },
                { angle: 5.1, dist: 90, size: 5, color: '#feca57' },
                { angle: 5.8, dist: 85, size: 6, color: '#ff6b6b' }
            ];

            const drawStar = (x, y, r, color, alpha = 1) => {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = color;
                ctx.beginPath();
                for (let s = 0; s < 4; s++) {
                    const a = (s * Math.PI / 2);
                    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
                    const aInner = a + Math.PI / 4;
                    ctx.lineTo(x + Math.cos(aInner) * (r * 0.3), y + Math.sin(aInner) * (r * 0.3));
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            };

            const drawPopup = (scale, floatY = 0, popProgress = 1) => {
                ctx.save();
                const centerX = width / 2;
                const centerY = height / 2 + 5 + floatY;
                ctx.translate(centerX, centerY);

                if (type !== 'nichts') {
                    const glowRadius = 90 * scale;
                    if (glowRadius > 5) {
                        const glow = ctx.createRadialGradient(0, -5, 10 * scale, 0, -5, glowRadius);
                        glow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
                        glow.addColorStop(0.4, type === 'berry' ? 'rgba(255, 100, 100, 0.45)' : 'rgba(255, 215, 0, 0.45)');
                        glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
                        ctx.fillStyle = glow;
                        ctx.beginPath();
                        ctx.arc(0, -5, glowRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    if (popProgress > 0) {
                        for (const sp of sparkles) {
                            const curDist = sp.dist * Math.min(1.2, popProgress * 1.3);
                            const spX = Math.cos(sp.angle) * curDist;
                            const spY = Math.sin(sp.angle) * curDist - 5;
                            const spAlpha = Math.max(0, Math.min(1, (1 - popProgress * 0.3) * scale));
                            drawStar(spX, spY, sp.size * scale, sp.color, spAlpha);
                        }
                    }
                } else {
                    const glowRadius = 70 * scale;
                    if (glowRadius > 5) {
                        const glow = ctx.createRadialGradient(0, -5, 10 * scale, 0, -5, glowRadius);
                        glow.addColorStop(0, 'rgba(200, 200, 220, 0.5)');
                        glow.addColorStop(1, 'rgba(200, 200, 220, 0)');
                        ctx.fillStyle = glow;
                        ctx.beginPath();
                        ctx.arc(0, -5, glowRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                ctx.scale(scale, scale);

                if (itemImage) {
                    const targetDim = 125;
                    const itmW = itemImage.width;
                    const itmH = itemImage.height;
                    const itmScale = Math.min(1, targetDim / Math.max(itmW, itmH));
                    const drawW = itmW * itmScale;
                    const drawH = itmH * itmScale;
                    ctx.drawImage(itemImage, -drawW / 2, -drawH / 2 - 10, drawW, drawH);
                } else if (type === 'nichts') {
                    ctx.save();
                    ctx.font = '54px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('💨', 0, -15);
                    ctx.restore();
                }

                if (scale > 0.7 && titleText) {
                    const textAlpha = Math.min(1, (scale - 0.7) / 0.3);
                    ctx.save();
                    ctx.globalAlpha = textAlpha;

                    ctx.font = 'bold 15px sans-serif';
                    const metrics = ctx.measureText(titleText);
                    const textW = metrics.width;
                    const padX = 14;
                    const badgeW = textW + padX * 2;
                    const badgeH = 24;
                    const badgeX = -badgeW / 2;
                    const badgeY = itemImage ? 55 : 20;

                    ctx.fillStyle = type === 'nichts' ? 'rgba(40, 40, 50, 0.85)' : 'rgba(20, 20, 25, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
                    ctx.fill();

                    ctx.strokeStyle = type === 'nichts' ? '#a0a0b0' : (type === 'berry' ? '#ff6b6b' : '#ffcc00');
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(titleText, 0, badgeY + badgeH / 2);
                    ctx.restore();
                }

                ctx.restore();
            };

            // 2. Pop-up Phase (14 frames, ~1.0s)
            const popFrames = 14;
            for (let i = 0; i < popFrames; i++) {
                const t = (i + 1) / popFrames;
                let scale;
                if (t < 0.65) {
                    const st = t / 0.65;
                    scale = Math.sin(st * Math.PI / 2) * 1.22;
                } else {
                    const st = (t - 0.65) / 0.35;
                    scale = 1.22 - Math.sin(st * Math.PI / 2) * 0.22;
                }

                drawFullFrame(ctx, totalRotation);
                drawPopup(scale, 0, t);

                const webpBuf = await sharp(cvs.toBuffer('image/png')).webp().toBuffer();
                const frame = await WebP.Image.generateFrame({ buffer: webpBuf, delay: 70 });
                frameObjects.push(frame);
            }

            // 3. Hold & Float Phase (10 frames, ~2.5s)
            const holdFrames = 10;
            for (let i = 0; i < holdFrames; i++) {
                const t = i / (holdFrames - 1);
                const floatY = Math.sin(t * Math.PI * 2) * 3;

                drawFullFrame(ctx, totalRotation);
                drawPopup(1.0, floatY, 1.0);

                const webpBuf = await sharp(cvs.toBuffer('image/png')).webp().toBuffer();
                const delay = (i === holdFrames - 1) ? 2500 : 100;
                const frame = await WebP.Image.generateFrame({ buffer: webpBuf, delay });
                frameObjects.push(frame);
            }

            await WebP.Image.save(outputPath, { frames: frameObjects, width, height, loops: 1 });
            console.log(`[Festival-Extension] Animation generiert: ${outputPath}`);
        };

        // 2. Generate animations for all festival items (Hauptpreis: Slice 7 at phi = 337.5°)
        const items = this.getItems();
        for (const [itemId, itemData] of Object.entries(items)) {
            const animPath = path.join(this.imageDir, `wheel_spin_${itemId}.webp`);
            if (!fs.existsSync(animPath)) {
                console.log(`[Festival-Extension] Generiere Spin-Animation für ${itemId}...`);
                const itemImgPath = path.join(this.imageDir, path.basename(itemData.filename) + '.png');
                if (fs.existsSync(itemImgPath)) {
                    const canvasItem = await loadImage(fs.readFileSync(itemImgPath));
                    await generateSpinAnimation({
                        itemImage: canvasItem,
                        titleText: itemData.name,
                        type: 'item',
                        outputPath: animPath,
                        phiDeg: 337.5
                    });
                }
            }
        }

        // Berry Jackpot for Hauptpreis when all balloons collected (+350 Beeren, Slice 7)
        let canvasBerry = null;
        const loadBerryCanvas = async () => {
            if (!canvasBerry && fs.existsSync(this.berryPrize)) {
                const upscaledBerryBuf = await sharp(this.berryPrize)
                    .resize(115, 115, { kernel: 'nearest' })
                    .png()
                    .toBuffer();
                canvasBerry = await loadImage(upscaledBerryBuf);
            }
            return canvasBerry;
        };

        const jackpotPath = path.join(this.imageDir, 'wheel_spin_BERRIES_JACKPOT.webp');
        if (!fs.existsSync(jackpotPath)) {
            const cBerry = await loadBerryCanvas();
            if (cBerry) {
                await generateSpinAnimation({
                    itemImage: cBerry,
                    titleText: '+350 Beeren (Jackpot!)',
                    type: 'berry',
                    outputPath: jackpotPath,
                    phiDeg: 337.5
                });
            }
        }

        // 3. Generate individual animations for all 3 Red Beeren Slices (Slices 1, 3, 5: +150 Beeren)
        const berrySlices = [
            { slice: 1, phi: 67.5 },
            { slice: 3, phi: 157.5 },
            { slice: 5, phi: 247.5 }
        ];

        for (const bs of berrySlices) {
            const berrySlicePath = path.join(this.imageDir, `wheel_spin_slice_${bs.slice}.webp`);
            if (!fs.existsSync(berrySlicePath)) {
                const cBerry = await loadBerryCanvas();
                if (cBerry) {
                    console.log(`[Festival-Extension] Generiere Spin-Animation für Beeren-Feld ${bs.slice}...`);
                    await generateSpinAnimation({
                        itemImage: cBerry,
                        titleText: '+150 Beeren!',
                        type: 'berry',
                        outputPath: berrySlicePath,
                        phiDeg: bs.phi
                    });
                }
            }
        }

        // 4. Generate individual animations for all 4 White Nichts Slices (Slices 0, 2, 4, 6)
        const nichtsSlices = [
            { slice: 0, phi: 22.5 },
            { slice: 2, phi: 112.5 },
            { slice: 4, phi: 202.5 },
            { slice: 6, phi: 292.5 }
        ];

        for (const ns of nichtsSlices) {
            const nichtsSlicePath = path.join(this.imageDir, `wheel_spin_slice_${ns.slice}.webp`);
            if (!fs.existsSync(nichtsSlicePath)) {
                console.log(`[Festival-Extension] Generiere Spin-Animation für Nieten-Feld ${ns.slice}...`);
                await generateSpinAnimation({
                    itemImage: null,
                    titleText: 'Leider nichts...',
                    type: 'nichts',
                    outputPath: nichtsSlicePath,
                    phiDeg: ns.phi
                });
            }
        }
    }

    async handleSpin(interaction, client, plugin) {
        const discordUserId = interaction.user.id;
        const berryId = plugin['var'].berry;
        const spinCost = 100;

        const userData = await UserData.get(discordUserId);
        const currentBerries = userData.getCurrency(berryId) || 0;

        if (currentBerries < spinCost) {
            return await interaction.reply({
                content: `❌ Du benötigst mindestens **${spinCost} Beeren**, um am Glücksrad zu drehen! (Du hast: ${currentBerries} 🍓)`,
                ephemeral: true
            });
        }

        // Deduct spin cost
        userData.removeCurrency(berryId, spinCost);

        const items = this.getItems();
        const allBalloonKeys = Object.keys(items).filter(k => items[k].isBalloon);

        let itemlist = userData.getPluginData(plugin, 'itemlist') ?? userData.currencyData?.itemlist ?? [];
        if (!Array.isArray(itemlist)) itemlist = [];

        const missingBalloons = allBalloonKeys.filter(id => !itemlist.includes(id));

        // 8 slices on the wheel with EQUAL 1/8 (12.5%) probability:
        // Slice 7: Hauptpreis (Gelb, phi = 337.5°) -> Ballon / 350 Beeren Jackpot
        // Slices 1, 3, 5: Beeren (Rot, phi = 67.5°, 157.5°, 247.5°) -> +150 Beeren
        // Slices 0, 2, 4, 6: Nichts (Weiß, phi = 22.5°, 112.5°, 202.5°, 292.5°) -> Leider nichts
        const chosenSlice = Math.floor(Math.random() * 8);

        let wonBalloon = null;
        let wonBalloonId = null;
        let spinPath = null;
        let replyContent = "🎡 **Viel Glück! Das Rad dreht sich...**";

        if (chosenSlice === 7) {
            // HAUPTPREIS (Slice 7)
            if (missingBalloons.length > 0) {
                wonBalloonId = missingBalloons[Math.floor(Math.random() * missingBalloons.length)];
                wonBalloon = items[wonBalloonId];
                itemlist.push(wonBalloonId);
                userData.setPluginData(plugin, 'itemlist', itemlist);
                await userData.save(plugin);
                spinPath = path.join(this.imageDir, `wheel_spin_${wonBalloonId}.webp`);
            } else {
                // Bereits alle Ballons gesammelt -> 350 Beeren Jackpot
                const jackpotAmount = 350;
                userData.addCurrency(berryId, jackpotAmount);
                await userData.save(plugin);
                spinPath = path.join(this.imageDir, 'wheel_spin_BERRIES_JACKPOT.webp');
            }
        } else if (chosenSlice === 1 || chosenSlice === 3 || chosenSlice === 5) {
            // BEEREN (Slices 1, 3, 5: +150 Beeren)
            const berryWinAmount = 150;
            userData.addCurrency(berryId, berryWinAmount);
            await userData.save(plugin);
            spinPath = path.join(this.imageDir, `wheel_spin_slice_${chosenSlice}.webp`);
        } else {
            // NICHTS (Slices 0, 2, 4, 6)
            await userData.save(plugin);
            spinPath = path.join(this.imageDir, `wheel_spin_slice_${chosenSlice}.webp`);
        }

        if (!fs.existsSync(spinPath)) {
            spinPath = this.wheelIdle;
        }

        const spinAttachment = new AttachmentBuilder(spinPath, { name: `spinning_${Date.now()}.webp` });

        await interaction.reply({
            content: replyContent,
            files: [spinAttachment],
            ephemeral: true
        });

        // Delete ephemeral message after animation completes + short viewing pause (~9.0s)
        setTimeout(async () => {
            try {
                await interaction.deleteReply();
            } catch (e) {
                console.warn("[Festival-Extension] Fehler beim Löschen der Antwort:", e.message);
            }

            // If a balloon was won, send the public celebration announcement in the channel
            if (wonBalloon) {
                try {
                    const balloonImgPath = path.join(this.imageDir, path.basename(wonBalloon.filename) + '.png');
                    const generatedImagePath = await ImageCreator.createCatchBalloonImage(interaction.member, wonBalloon.name, balloonImgPath);
                    const balloonAttachment = new AttachmentBuilder(generatedImagePath, { name: path.basename(balloonImgPath) });
                    await interaction.channel.send({
                        content: `<@${interaction.user.id}>`,
                        files: [balloonAttachment]
                    });
                } catch (e) {
                    console.warn("[Festival-Extension] Fehler beim Senden der Gewinn-Nachricht:", e.message);
                }
            }
        }, 9000);
    }

    async updateMainMessage(channel) {
        if (!channel) return;

        const attachment = new AttachmentBuilder(this.wheelIdle, { name: `glücksrad_${Date.now()}.png` });

        const button = new ButtonBuilder()
            .setCustomId('festival_spin')
            .setLabel('Am Rad drehen (100 🍓)')
            .setEmoji('🎡')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const content = "🎪 **Willkommen auf dem Jahrmarkt am Strand!** 🎡\nVersuche dein Glück am Glücksrad (Einsatz: 100 🍓)!";

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

        const newMsg = await channel.send({
            content: content,
            files: [attachment],
            components: [row]
        });
        this.mainMessageId = newMsg.id;
    }

    async getShop(client, plugin, shopChannel) {
        if (!this.isExtensionActive(plugin)) return;
        await this.updateMainMessage(shopChannel);
    }
}

module.exports = FestivalEvent;
