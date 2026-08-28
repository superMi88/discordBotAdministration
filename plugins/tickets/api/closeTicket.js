const ticketManager = require('../lib/ticketManager.js');

module.exports = async function (client, plugin, config, projectAlias, data) {
    return ticketManager.closeTicket({ ...(data || {}), client, plugin });
};
