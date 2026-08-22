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

    createTicket({ discordUserId, username, globalName, avatar, title, category, message }) {
        this.cleanupExpiredTickets();

        if (!discordUserId) {
            return { success: false, error: 'Nutzer-ID fehlt.' };
        }
        if (!message || !message.trim()) {
            return { success: false, error: 'Nachricht darf nicht leer sein.' };
        }

        const ticketId = 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const now = new Date().toISOString();

        const newTicket = {
            id: ticketId,
            userId: discordUserId,
            username: username || 'Unbekannt',
            globalName: globalName || username || 'Nutzer',
            userAvatar: avatar || null,
            category: category || 'Feedback',
            title: (title && title.trim()) ? title.trim().substring(0, 100) : 'Feedback / Support',
            status: 'open',
            createdAt: now,
            updatedAt: now,
            closedAt: null,
            deleteAt: null,
            messages: [
                {
                    id: 'msg_' + Date.now() + '_1',
                    senderId: discordUserId,
                    senderName: globalName || username || 'Nutzer',
                    senderAvatar: avatar || null,
                    isAdmin: false,
                    content: message.trim(),
                    timestamp: now
                }
            ]
        };

        const filePath = this.getTicketFilePath(ticketId);
        fs.writeFileSync(filePath, JSON.stringify(newTicket, null, 2), 'utf8');

        return { success: true, ticket: newTicket };
    }

    async addMessage({ discordUserId, username, globalName, avatar, ticketId, message, isAdmin = false, client = null }) {
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

        // Discord DM Benachrichtigung an den Ticket-Ersteller senden (sofern nicht von ihm selbst verfasst)
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

        return { success: true, ticket };
    }

    async closeTicket({ discordUserId, ticketId, isAdmin = false, client = null }) {
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

        return { success: true, ticket };
    }
}

module.exports = new TicketManager();
