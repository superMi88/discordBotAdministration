module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId, userId } = data || {};
    const targetUserId = discordUserId || userId || null;

    if (plugin.logic && typeof plugin.logic.getAnimalLeaderboard === 'function') {
        return await plugin.logic.getAnimalLeaderboard(client, plugin, targetUserId);
    }

    const pluginModule = require('../plugin.js');
    if (pluginModule && typeof pluginModule.getAnimalLeaderboard === 'function') {
        return await pluginModule.getAnimalLeaderboard(client, plugin, targetUserId);
    }

    return { success: false, error: 'getAnimalLeaderboard-Methode im waldspiel-Plugin nicht gefunden.' };
};
