module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId, notifyLevelUp } = data || {};

    if (!discordUserId) {
        return { success: false, error: 'Nutzer-ID fehlt.' };
    }

    if (plugin.logic && typeof plugin.logic.setNotificationSettings === 'function') {
        return await plugin.logic.setNotificationSettings(client, plugin, discordUserId, notifyLevelUp);
    }

    return { success: false, error: 'setNotificationSettings-Methode im rolesystem-Plugin nicht gefunden.' };
};
