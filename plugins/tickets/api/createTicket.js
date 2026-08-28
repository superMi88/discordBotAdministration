const ticketManager = require('../lib/ticketManager.js');

module.exports = async function (client, plugin, config, projectAlias, data) {
    return ticketManager.createTicket({ ...(data || {}), client, plugin });
};
