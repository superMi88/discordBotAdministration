const fs = require('fs');
const path = require('path');

class TicketManager {
    constructor() {
        this.ticketsDir = path.resolve(__dirname, '../../../../Tickets');
        this.ensureDir(this.ticketsDir);
    }

    ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            try {
                fs.mkdirSync(dirPath, { recursive: true });
            } catch (err) {
                console.error('[TicketManager] Fehler beim Erstellen des Verzeichnisses ' + dirPath + ':', err);
            }
        }
    }

    getTicketFilePath(ticketId) {
        const safeId = String(ticketId).replace(/[^a-zA-Z0-9_-]/g, '');
        return path.join(this.ticketsDir, 'ticket_' + safeId + '.json');
    }

    cleanupExpiredTickets() {
        try {
            this.ensureDir(this.ticketsDir);
            const files = fs.readdirSync(this.ticketsDir);
            const now = Date.now();
            const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                const filePath = path.join(this.ticketsDir, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const ticket = JSON.parse(content);

                    if (ticket.status === 'closed' && ticket.closedAt) {
                        const closedTime = new Date(ticket.closedAt).getTime();
                        if (!isNaN(closedTime) && (now - closedTime) >= fourteenDaysMs) {
                            fs.unlinkSync(filePath);
                            console.log('[TicketManager] Abgelaufenes Ticket gelöscht (>14 Tage geschlossen): ' + ticket.id);
                        }
                    }
                } catch (readErr) {
                    console.error('[TicketManager] Fehler beim Lesen von ' + file + ':', readErr);
                }
            }
        } catch (err) {
            console.error('[TicketManager] Fehler in cleanupExpiredTickets:', err);
        }
    }

    getTicketsForUser(discordUserId, isAdmin = false) {
        this.cleanupExpiredTickets();
        const results = [];

        try {
            this.ensureDir(this.ticketsDir);
            const files = fs.readdirSync(this.ticketsDir);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                const filePath = path.join(this.ticketsDir, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const ticket = JSON.parse(content);

                    if (isAdmin || ticket.userId === discordUserId) {
                        results.push(ticket);
                    }
                } catch (e) {
                    console.error('[TicketManager] Fehler beim Parsen von ' + file + ':', e);
                }
            }

            results.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        } catch (err) {
            console.error('[TicketManager] Fehler in getTicketsForUser:', err);
        }

        return results;
    }

    async createTicket({ discordUserId, username, globalName, avatar, title, category, message, client = null, plugin = null }) {
        this.cleanupExpiredTickets();

        if (!discordUserId) {
            return { success: false, error: 'Nutzer-ID fehlt.' };
        }
        if (!message || !message.trim()) {
            return { success: false, error: 'Nachricht darf nicht leer sein.' };
        }

        const ticketId = 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const now = new Date().toISOString();
        const displayTitle = (title && title.trim()) ? title.trim().substring(0, 100) : 'Feedback / Support';
        const displayCategory = category || 'Feedback';
        const senderDisplayName = globalName || username || 'Nutzer';

        const newTicket = {
            id: ticketId,
            userId: discordUserId,
            username: username || 'Unbekannt',
            globalName: senderDisplayName,
            userAvatar: avatar || null,
            category: displayCategory,
            title: displayTitle,
            status: 'open',
            createdAt: now,
            updatedAt: now,
            closedAt: null,
            deleteAt: null,
            messages: [
                {
                    id: 'msg_' + Date.now() + '_1',
                    senderId: discordUserId,
                    senderName: senderDisplayName,
                    senderAvatar: avatar || null,
                    isAdmin: false,
                    content: message.trim(),
                    timestamp: now
                }
            ]
        };

        const filePath = this.getTicketFilePath(ticketId);
        fs.writeFileSync(filePath, JSON.stringify(newTicket, null, 2), 'utf8');

        // Discord Log-Channel Benachrichtigung
        try {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor(0x12ba69)
                .setTitle('🎫 Neues Ticket erstellt: ' + displayTitle)
                .setDescription(message.trim().length > 1000 ? message.trim().substring(0, 997) + '...' : message.trim())
                .addFields(
                    { name: 'Ersteller', value: `${senderDisplayName} (<@${discordUserId}>)`, inline: true },
                    { name: 'Kategorie', value: displayCategory, inline: true },
                    { name: 'Ticket-ID', value: '`' + ticketId + '`', inline: true }
                )
                .setFooter({ text: 'Kleiner Wald Tickets • Website' })
                .setTimestamp();

            const avatarUrl = getUserAvatarUrl(discordUserId, avatar);
            if (avatarUrl) {
                embed.setThumbnail(avatarUrl);
            }

            // Moderator-Rolle pingen falls konfiguriert
            let mentionContent = '';
            const modRoles = plugin?.['var']?.moderatorRole;
            if (Array.isArray(modRoles) && modRoles.length > 0) {
                const mentions = modRoles.filter(r => r && r.roleId).map(r => `<@&${r.roleId}>`);
                if (mentions.length > 0) {
                    mentionContent = mentions.join(' ');
                }
            }

            await sendToLogChannel(client, plugin, embed, mentionContent);
        } catch (logErr) {
            console.error('[TicketManager] Fehler beim Log-Channel Senden für neues Ticket:', logErr);
        }

        return { success: true, ticket: newTicket };
    }

    async addMessage({ discordUserId, username, globalName, avatar, ticketId, message, isAdmin = false, client = null, plugin = null }) {
        this.cleanupExpiredTickets();

        if (!ticketId) {
            return { success: false, error: 'Ticket-ID fehlt.' };
        }
        if (!message || !message.trim()) {
            return { success: false, error: 'Nachricht darf nicht leer sein.' };
        }

        const filePath = this.getTicketFilePath(ticketId);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'Ticket nicht gefunden.' };
        }

        let ticket;
        try {
            ticket = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return { success: false, error: 'Ticket-Datei konnte nicht geladen werden.' };
        }

        if (ticket.status === 'closed') {
            return {
                success: false,
                error: 'Dieses Ticket ist bereits geschlossen. Auf geschlossene Tickets kann nicht mehr geantwortet werden.'
            };
        }

        if (!isAdmin && ticket.userId !== discordUserId) {
            return { success: false, error: 'Keine Berechtigung für dieses Ticket.' };
        }

        const now = new Date().toISOString();
        const senderDisplayName = isAdmin ? (globalName || username || 'Team / Support') : (globalName || username || 'Nutzer');

        ticket.messages = ticket.messages || [];
        ticket.messages.push({
            id: 'msg_' + Date.now() + '_' + (ticket.messages.length + 1),
            senderId: discordUserId,
            senderName: senderDisplayName,
            senderAvatar: avatar || null,
            isAdmin: Boolean(isAdmin),
            content: message.trim(),
            timestamp: now
        });
        ticket.updatedAt = now;

        fs.writeFileSync(filePath, JSON.stringify(ticket, null, 2), 'utf8');

        // Discord DM Benachrichtigung an den Ticket-Ersteller senden (sofern vom Admin verfasst)
        if (client && ticket.userId && ticket.userId !== discordUserId) {
            try {
                let shouldNotify = true;
                try {
                    const UserData = require('../../../lib/UserData.js');
                    const uData = await UserData.get(ticket.userId);
                    if (uData && uData.pluginData) {
                        for (const k of Object.keys(uData.pluginData)) {
                            if (k.startsWith('rolesystem') && uData.pluginData[k]?.notifyTicketUpdates === false) {
                                shouldNotify = false;
                                break;
                            }
                        }
                    }
                } catch (userErr) {
                    // Standardmäßig true
                }

                if (shouldNotify && client.users) {
                    const discordUser = await client.users.fetch(ticket.userId);
                    if (discordUser) {
                        const { EmbedBuilder } = require('discord.js');
                        const embed = new EmbedBuilder()
                            .setColor(0x12ba69)
                            .setTitle('📬 Neue Antwort zu deinem Ticket erhalten!')
                            .setDescription('In deinem Ticket **"' + ticket.title + '"** gibt es eine neue Nachricht von **' + senderDisplayName + '**:\n\n> ' + message.trim().substring(0, 450) + (message.trim().length > 450 ? '...' : ''))
                            .addFields(
                                { name: 'Kategorie', value: ticket.category || 'Feedback', inline: true },
                                { name: 'Status', value: ticket.status === 'closed' ? '🔴 Geschlossen' : '🟢 Offen', inline: true }
                            )
                            .setFooter({ text: 'Kleiner Wald Support • Benachrichtigungseinstellungen im Website-Dashboard anpassbar' })
                            .setTimestamp();

                        await discordUser.send({ embeds: [embed] });
                        console.log('[TicketManager] DM-Benachrichtigung erfolgreich gesendet an ' + ticket.userId);
                    }
                }
            } catch (dmErr) {
                console.warn('[TicketManager] Konnte DM an ' + ticket.userId + ' nicht senden:', dmErr?.message);
            }
        }

        // Discord Log-Channel Benachrichtigung über neue Antwort
        try {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor(isAdmin ? 0x9b59b6 : 0x3498db)
                .setTitle((isAdmin ? '🛡️ Team-Antwort' : '💬 Neue Antwort') + ' im Ticket: ' + ticket.title)
                .setDescription(message.trim().length > 1000 ? message.trim().substring(0, 997) + '...' : message.trim())
                .addFields(
                    { name: 'Absender', value: isAdmin ? `${senderDisplayName} *(Team)*` : `${senderDisplayName} (<@${discordUserId}>)`, inline: true },
                    { name: 'Kategorie', value: ticket.category || 'Feedback', inline: true },
                    { name: 'Ticket-ID', value: '`' + ticket.id + '`', inline: true }
                )
                .setFooter({ text: 'Kleiner Wald Tickets • Website' })
                .setTimestamp();

            const avatarUrl = getUserAvatarUrl(discordUserId, avatar);
            if (avatarUrl) {
                embed.setThumbnail(avatarUrl);
            }

            // Wenn ein User (nicht Admin) geantwortet hat, optional Mod-Rollen pingen
            let mentionContent = '';
            if (!isAdmin) {
                const modRoles = plugin?.['var']?.moderatorRole;
                if (Array.isArray(modRoles) && modRoles.length > 0) {
                    const mentions = modRoles.filter(r => r && r.roleId).map(r => `<@&${r.roleId}>`);
                    if (mentions.length > 0) {
                        mentionContent = mentions.join(' ');
                    }
                }
            }

            await sendToLogChannel(client, plugin, embed, mentionContent);
        } catch (logErr) {
            console.error('[TicketManager] Fehler beim Log-Channel Senden für Ticket-Nachricht:', logErr);
        }

        return { success: true, ticket };
    }

    async closeTicket({ discordUserId, ticketId, isAdmin = false, client = null, plugin = null, globalName = '', username = '' }) {
        this.cleanupExpiredTickets();

        if (!ticketId) {
            return { success: false, error: 'Ticket-ID fehlt.' };
        }

        const filePath = this.getTicketFilePath(ticketId);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'Ticket nicht gefunden.' };
        }

        let ticket;
        try {
            ticket = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return { success: false, error: 'Ticket-Datei konnte nicht geladen werden.' };
        }

        if (!isAdmin && ticket.userId !== discordUserId) {
            return { success: false, error: 'Keine Berechtigung für dieses Ticket.' };
        }

        if (ticket.status === 'closed') {
            return { success: true, ticket };
        }

        const now = new Date();
        ticket.status = 'closed';
        ticket.closedAt = now.toISOString();
        ticket.deleteAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        ticket.updatedAt = now.toISOString();

        fs.writeFileSync(filePath, JSON.stringify(ticket, null, 2), 'utf8');

        // Discord DM Benachrichtigung über geschlossenes Ticket an den Ersteller senden
        if (client && ticket.userId) {
            try {
                let shouldNotify = true;
                try {
                    const UserData = require('../../../lib/UserData.js');
                    const uData = await UserData.get(ticket.userId);
                    if (uData && uData.pluginData) {
                        for (const k of Object.keys(uData.pluginData)) {
                            if (k.startsWith('rolesystem') && uData.pluginData[k]?.notifyTicketUpdates === false) {
                                shouldNotify = false;
                                break;
                            }
                        }
                    }
                } catch (userErr) {
                    // Standardmäßig true
                }

                if (shouldNotify && client.users) {
                    const discordUser = await client.users.fetch(ticket.userId);
                    if (discordUser) {
                        const { EmbedBuilder } = require('discord.js');
                        const embed = new EmbedBuilder()
                            .setColor(0xef5350)
                            .setTitle('🔒 Dein Ticket wurde geschlossen')
                            .setDescription('Dein Ticket **"' + ticket.title + '"** wurde soeben geschlossen.\n\nAuf geschlossene Tickets kann nicht mehr geantwortet werden. Das Ticket wird nach **14 Tagen** automatisch aus dem System gelöscht. Falls du weiteres Feedback oder Fragen hast, kannst du jederzeit ein neues Ticket auf der Website erstellen.')
                            .addFields(
                                { name: 'Kategorie', value: ticket.category || 'Feedback', inline: true },
                                { name: 'Status', value: '🔴 Geschlossen', inline: true }
                            )
                            .setFooter({ text: 'Kleiner Wald Support • Benachrichtigungseinstellungen im Website-Dashboard anpassbar' })
                            .setTimestamp();

                        await discordUser.send({ embeds: [embed] });
                        console.log('[TicketManager] Schließungs-DM erfolgreich gesendet an ' + ticket.userId);
                    }
                }
            } catch (dmErr) {
                console.warn('[TicketManager] Konnte Schließungs-DM an ' + ticket.userId + ' nicht senden:', dmErr?.message);
            }
        }

        // Discord Log-Channel Benachrichtigung über Schließung
        try {
            const { EmbedBuilder } = require('discord.js');
            const closedByName = isAdmin ? (globalName || username || 'Team / Admin') : (globalName || username || `<@${discordUserId}>`);
            const embed = new EmbedBuilder()
                .setColor(0xef5350)
                .setTitle('🔒 Ticket geschlossen: ' + ticket.title)
                .setDescription('Das Ticket `' + ticket.id + '` wurde geschlossen und wird in 14 Tagen archiviert.')
                .addFields(
                    { name: 'Geschlossen von', value: closedByName, inline: true },
                    { name: 'Ticket-Ersteller', value: `${ticket.globalName || ticket.username || 'Unbekannt'} (<@${ticket.userId}>)`, inline: true },
                    { name: 'Kategorie', value: ticket.category || 'Feedback', inline: true }
                )
                .setFooter({ text: 'Kleiner Wald Tickets • Website' })
                .setTimestamp();

            await sendToLogChannel(client, plugin, embed);
        } catch (logErr) {
            console.error('[TicketManager] Fehler beim Log-Channel Senden für geschlossenes Ticket:', logErr);
        }

        return { success: true, ticket };
    }
}

function getUserAvatarUrl(userId, avatarHash) {
    if (!avatarHash) return null;
    if (typeof avatarHash === 'string' && (avatarHash.startsWith('http://') || avatarHash.startsWith('https://'))) {
        return avatarHash;
    }
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
}

async function sendToLogChannel(client, plugin, embed, content = '') {
    try {
        let channelId = plugin?.['var']?.logChannel;

        // Fallback: search PluginManager if plugin instance is not passed directly
        if (!channelId) {
            try {
                const PluginManager = require('../../../discordBot/lib/PluginManager.js');
                const allPlugins = PluginManager.getAll();
                if (allPlugins && allPlugins.length > 0) {
                    const ticketPlugin = allPlugins.find(p => p.name === 'tickets' || p.pluginTag === 'tickets');
                    if (ticketPlugin && ticketPlugin['var']?.logChannel) {
                        channelId = ticketPlugin['var'].logChannel;
                    }
                }
            } catch (e) {}
        }

        if (!channelId) return;

        let activeClient = client;
        if (!activeClient) {
            try {
                const dataManager = require('../../../discordBot/lib/dataManager.js');
                activeClient = dataManager.client;
            } catch (e) {}
        }

        if (!activeClient || !activeClient.channels) return;

        let channel = activeClient.channels.cache?.get(channelId);
        if (!channel && activeClient.channels.fetch) {
            channel = await activeClient.channels.fetch(channelId).catch(() => null);
        }

        if (channel && typeof channel.send === 'function') {
            const messagePayload = { embeds: [embed] };
            if (content && typeof content === 'string' && content.trim()) {
                messagePayload.content = content.trim();
            }
            await channel.send(messagePayload);
            console.log('[TicketManager] Benachrichtigung an Log-Channel ' + channelId + ' gesendet.');
        }
    } catch (err) {
        console.error('[TicketManager] Fehler beim Senden an Log-Channel:', err);
    }
}

module.exports = new TicketManager();

