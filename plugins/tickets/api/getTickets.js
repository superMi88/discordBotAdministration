const ticketManager = require('../lib/ticketManager.js');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId, isAdmin } = data || {};
    if (!discordUserId) {
        return { success: false, error: 'Nutzer-ID fehlt.' };
    }
    const tickets = ticketManager.getTicketsForUser(discordUserId, isAdmin);
    return { success: true, tickets };
};
