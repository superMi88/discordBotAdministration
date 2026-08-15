module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId } = data || {};

    if (!discordUserId) {
        return { success: false, error: 'Nutzer-ID fehlt.' };
    }

    if (plugin.logic && typeof plugin.logic.getUserRankInfo === 'function') {
        return await plugin.logic.getUserRankInfo(client, plugin, discordUserId);
    }

    return { success: false, error: 'getUserRankInfo-Methode im rolesystem-Plugin nicht gefunden.' };
};
