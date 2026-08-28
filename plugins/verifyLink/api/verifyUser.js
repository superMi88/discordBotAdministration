module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId } = data || {};

    if (!discordUserId) {
        return { success: false, error: 'Nutzer-ID fehlt.' };
    }

    if (plugin.logic && typeof plugin.logic.verifyUser === 'function') {
        return await plugin.logic.verifyUser(client, plugin, discordUserId);
    }

    return { success: false, error: 'verifyUser-Methode im verifyLink-Plugin nicht gefunden.' };
};
