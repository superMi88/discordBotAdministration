module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId, userId, days } = data || {};
    const targetUserId = discordUserId || userId || null;
    const requestedDays = parseInt(days, 10) || 14;

    const pluginLogic = plugin.logic || require('../plugin.js');

    if (targetUserId && typeof pluginLogic.getActivityForUser === 'function') {
        return await pluginLogic.getActivityForUser(client, plugin, targetUserId, requestedDays);
    }

    if (!targetUserId && typeof pluginLogic.getAllActivity === 'function') {
        return await pluginLogic.getAllActivity(client, plugin, requestedDays);
    }

    if (typeof pluginLogic.getChatHistory === 'function') {
        return pluginLogic.getChatHistory(plugin.id, requestedDays, targetUserId);
    }

    return { success: false, error: 'Keine Logik im Plugin gefunden.' };
};
