const UserData = require('../../lib/UserData.js');
const DatabaseManager = require('../../lib/DatabaseManager.js');
const PluginManager = require("../../discordBot/lib/PluginManager.js");

class MigrationPlugin {
    /**
     * This method is triggered when the "Speichern" button is clicked on the website.
     */
    async save(plugin, config, projectAlias) {
        // 1. Perform standard save to database
        let status = await PluginManager.save(plugin, config);
        if (!status.saved) {
            return status;
        }

        // 2. Perform Migration logic
        try {
            const db = DatabaseManager.get();
            
            // Get all plugins to map tags to IDs
            const plugins = await db.collection('pluginCollection').find({}).toArray();
            const tagMap = {};
            plugins.forEach(p => {
                if (!tagMap[p.pluginTag]) {
                    tagMap[p.pluginTag] = p._id.toString();
                }
            });

            // Get all users
            const users = await db.collection('userCollection').find({}).toArray();
            let migratedCount = 0;
            let keysMovedCount = 0;

            for (const userDoc of users) {
                if (!userDoc.currency || typeof userDoc.currency !== 'object' || Array.isArray(userDoc.currency)) {
                    continue;
                }

                const userData = await UserData.get(userDoc.discordId);
                const oldCurrency = userDoc.currency;
                let changed = false;
                let keysToUnset = [];

                for (const [key, value] of Object.entries(oldCurrency)) {
                    // Specific Removal Logic (Keys to delete without migrating)
                    if (
                        key === 'messageCounter' || 
                        key === 'voiceCounter' || 
                        key.startsWith('giveaway_') || 
                        key.includes('karma')
                    ) {
                        keysToUnset.push(key);
                        changed = true;
                        continue;
                    }

                    // Currency identification (Only 24-char hex IDs now)
                    if (key.match(/^[0-9a-fA-F]{24}$/)) {
                        userData.setCurrency(key, value);
                        keysToUnset.push(key);
                        changed = true;
                        continue;
                    }

                    let targetTag = null;
                    if (key.startsWith('voiceCreatorChannel_')) {
                        targetTag = 'voiceCreator';
                    } else if (key.startsWith('warnings_') || key === 'warnings') {
                        targetTag = 'warnings';
                    } else if (
                        [
                            'itemlist', 'backgroundlist', 'cardlist-pokemon', 'background',
                            'animalId1', 'animalId2', 'animalId3', 
                            'carrotEventGegossen', 'carrotEventGeerntet', 'carrotEventAussaht',
                            'lastChristmasDoorOpenDate', 'friendshipEventPoints', 'friendshipSelectedFriend'
                        ].includes(key)
                    ) {
                        targetTag = 'waldspiel';
                    }

                            if (targetTag && tagMap[targetTag]) {
                                const pluginId = tagMap[targetTag];
                                
                                // Check if existing data is corrupted (string instead of object)
                                const pluginKey = `${targetTag}-${pluginId}`;
                                const isCorrupted = typeof userData.pluginData[pluginKey] === 'string';

                                if (isCorrupted || userData.getPluginData(targetTag, pluginId, key) === undefined) {
                                    if (targetTag === 'voiceCreator') {
                                        // Set the value directly to avoid "one object too many" (double nesting)
                                        userData.setPluginData(targetTag, pluginId, value);
                                    } else {
                                        userData.setPluginData(targetTag, pluginId, key, value);
                                    }
                                    keysToUnset.push(key);
                                    changed = true;
                                    keysMovedCount++;
                                }
                            }
                        }

                        // Migration Logic for Birthday (Root field)
                        if (userDoc.birthday !== undefined) {
                            const targetTag = 'birthday';
                            if (tagMap[targetTag]) {
                                const pluginId = tagMap[targetTag];
                                // Set directly to avoid nesting { birthday: "VALUE" }
                                userData.setPluginData(targetTag, pluginId, userDoc.birthday);
                                changed = true;
                            }
                        }

                if (changed) {
                    await userData.save();
                    
                    // Remove old objects from the database entirely
                    const unsetQuery = { currency: "" };
                    if (userDoc.birthday !== undefined) unsetQuery.birthday = "";

                    await db.collection('userCollection').updateOne(
                        { _id: userDoc._id },
                        { $unset: unsetQuery }
                    );
                    migratedCount++;
                }
            }

            return { 
                saved: true, 
                infoMessage: `Migration abgeschlossen: ${migratedCount} User aktualisiert, ${keysMovedCount} Datensätze verschoben.`, 
                infoStatus: "Info" 
            };

        } catch (err) {
            console.error("[Migration Plugin] Backend Error:", err);
            return { 
                saved: false, 
                infoMessage: "Fehler während der Migration: " + err.message, 
                infoStatus: "Error" 
            };
        }
    }

    async execute(client, plugin, projectAlias) {
        // Essential to prevent bot crashes if it tries to execute this plugin
        return { status: "running" };
    }
}

module.exports = new MigrationPlugin();
