module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId, userId } = data || {};
    const targetUserId = discordUserId || userId || null;

    if (plugin.logic && typeof plugin.logic.getBerryLeaderboard === 'function') {
        return await plugin.logic.getBerryLeaderboard(client, plugin, targetUserId);
    }

    if (plugin.logic && typeof plugin.logic.getUserStats === 'function') {
        return await plugin.logic.getUserStats(client, plugin, targetUserId);
    }

    return { success: false, error: 'getBerryLeaderboard-Methode im waldspiel-Plugin nicht gefunden.' };
};
