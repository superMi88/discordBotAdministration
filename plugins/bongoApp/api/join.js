module.exports = async function (client, plugin, config, projectAlias, data) {
    const { skin, username, discordId } = data; // data should contain these from the web API call
    if (!username || !discordId) return { status: 'error', message: 'Missing user context' };

    let displayName = username;
    try {
        const UserData = require('../../../lib/UserData.js');
        const DatabaseManager = require('../../../lib/DatabaseManager.js');
        
        // Use the waldspielId determined during plugin initialization
        const waldspielId = plugin.waldspielId;
        if (!waldspielId) {
            console.warn(`[BongoApp] Cannot fetch animal for join: Waldspiel ID missing`);
        } else {
            const userData = await UserData.get(discordId);
            const waldspielKey = `waldspiel-${waldspielId}`;
            const waldspielData = userData.pluginData?.[waldspielKey];

            if (waldspielData) {
                const animalId = waldspielData.animalId2 || waldspielData.animalId1 || waldspielData.animalId3;
                if (animalId) {
                    const db = DatabaseManager.get();
                    const animal = await db.collection('animals').findOne({ _id: animalId });
                    if (animal && animal.name) displayName = animal.name;
                }
            }
        }
    } catch (e) {
        console.error(`[BongoApp] Error fetching animal during join:`, e.message);
    }

    if (!plugin.activeUsers) plugin.activeUsers = {};
    plugin.activeUsers[username] = { id: discordId, skin, lastSeen: new Date(), displayName };
    return { status: 'joined', displayName };
};
