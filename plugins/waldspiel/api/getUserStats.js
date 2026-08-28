module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId } = data || {};

    if (!discordUserId) {
        return { success: false, error: 'Nutzer-ID fehlt.' };
    }

    if (plugin.logic && typeof plugin.logic.getUserStats === 'function') {
        return await plugin.logic.getUserStats(client, plugin, discordUserId);
    }

    return { success: false, error: 'getUserStats-Methode im waldspiel-Plugin nicht gefunden.' };
};
