const UserData = require('../../../lib/UserData.js');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const { discordUserId, day, month, year } = data || {};

    if (!discordUserId) {
        return { success: false, error: 'Nutzer-ID fehlt.' };
    }

    if (plugin.logic && typeof plugin.logic.setBirthdayForUser === 'function') {
        return await plugin.logic.setBirthdayForUser(client, plugin, discordUserId, { day, month, year });
    }

    let d = parseInt(day);
    let m = parseInt(month);
    let y = year ? parseInt(year) : false;

    if (isNaN(d) || d < 1 || d > 31 || isNaN(m) || m < 1 || m > 12) {
        return { success: false, error: 'Ungültiger Tag oder Monat.' };
    }

    let birthdayObj = { day: d, month: m };
    if (y) {
        if (isNaN(y) || y <= 1900 || y >= new Date().getFullYear()) {
            return { success: false, error: 'Ungültiges Geburtsjahr.' };
        }
        birthdayObj.year = y;
    }

    let userData = await UserData.get(discordUserId);
    userData.setPluginData('birthday', plugin.id, birthdayObj);
    await userData.save();

    return { success: true, birthday: birthdayObj };
};
