module.exports = async function (client, plugin, config, projectAlias, data) {
    const { skin, username, discordId } = data; // data should contain these from the web API call
    if (!username || !discordId) return { status: 'error', message: 'Missing user context' };

    let displayName = username;
    try {
        const UserData = require('../../../lib/UserData.js');
        const DatabaseManager = require('../../../lib/DatabaseManager.js');
        const userData = await UserData.get(discordId);
        const waldspielData = userData.pluginData?.['waldspiel-643556763768cdbc42f8d899'];
        if (waldspielData && waldspielData.animalId2) {
            const db = DatabaseManager.get();
            const animal = await db.collection('animals').findOne({ _id: waldspielData.animalId2 });
            if (animal && animal.name) displayName = animal.name;
        }
    } catch (e) { }

    if (!plugin.activeUsers) plugin.activeUsers = {};
    plugin.activeUsers[username] = { id: discordId, skin, lastSeen: new Date(), displayName };
    return { status: 'joined', displayName };
};
