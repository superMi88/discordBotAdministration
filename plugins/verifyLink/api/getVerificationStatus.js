const UserData = require('../../../lib/UserData.js');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId } = data || {};

    if (!discordUserId) {
        return { success: false, error: 'Nutzer-ID fehlt.' };
    }

    if (plugin.logic && typeof plugin.logic.getVerificationStatus === 'function') {
        return await plugin.logic.getVerificationStatus(client, plugin, discordUserId);
    }

    const userData = await UserData.get(discordUserId);
    const verifyData = userData.getPluginData('verifyLink', plugin.id);

    return {
        success: true,
        verified: Boolean(verifyData && verifyData.verified),
        verifiedAt: verifyData ? verifyData.verifiedAt : null
    };
};
