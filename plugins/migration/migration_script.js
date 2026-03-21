const { MongoClient, ObjectId } = require('mongodb');

async function migrate() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'LiasDatabase';
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log("Connected to database");
        const db = client.db(dbName);
        
        // 1. Load all plugins to map tags to IDs
        const plugins = await db.collection('pluginCollection').find({}).toArray();
        const tagMap = {};
        plugins.forEach(p => {
            if (!tagMap[p.pluginTag]) {
                tagMap[p.pluginTag] = p._id.toString();
            }
        });
        
        console.log(`Found ${Object.keys(tagMap).length} unique plugin tags`);

        // 2. Iterate all users
        const users = await db.collection('userCollection').find({}).toArray();
        console.log(`Processing ${users.length} users...`);

        let migratedCount = 0;
        for (const user of users) {
            // Check if there is an old currency object to migrate
            if (!user.currency || typeof user.currency !== 'object' || Array.isArray(user.currency)) {
                continue;
            }

            const oldCurrency = user.currency;
            const newCurrencyData = user.currencyData || {};
            const newPluginData = user.pluginData || {};
            let changed = false;

            for (const [key, value] of Object.entries(oldCurrency)) {
                let targetTag = null;
                let targetKey = key;

                // Identification Logic
                if (key.match(/^[0-9a-fA-F]{24}$/) || key === 'messageCounter' || key === 'voiceCounter') {
                    if (newCurrencyData[key] === undefined) {
                        newCurrencyData[key] = value;
                        changed = true;
                    }
                    continue;
                }

                // Prefix-based mapping
                if (key.startsWith('giveaway_')) {
                    targetTag = 'giveaway';
                } else if (key.startsWith('voiceCreatorChannel_')) {
                    targetTag = 'voiceCreator';
                } else if (key.startsWith('warnings_') || key === 'warnings') {
                    targetTag = 'warnings';
                } else if (key.includes('karma')) {
                    targetTag = 'rolesystem';
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
                    const pluginKey = `${targetTag}-${pluginId}`;
                    if (!newPluginData[pluginKey]) newPluginData[pluginKey] = {};
                    
                    if (newPluginData[pluginKey][targetKey] === undefined) {
                        newPluginData[pluginKey][targetKey] = value;
                        changed = true;
                        console.log(`  [${user.discordId}] Moving ${key} -> ${pluginKey}`);
                    }
                } else {
                    // Unmapped key - put in currencyData as fallback if not already present
                    if (newCurrencyData[key] === undefined) {
                        newCurrencyData[key] = value;
                        changed = true;
                    }
                }
            }

            if (changed) {
                // Update the user document
                await db.collection('userCollection').updateOne(
                    { _id: user._id },
                    { 
                        $set: { 
                            currencyData: newCurrencyData,
                            pluginData: newPluginData,
                            currency: newCurrencyData 
                        } 
                    }
                );
                migratedCount++;
            }
        }

        console.log(`Migration finished. Updated ${migratedCount} users.`);

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await client.close();
    }
}

migrate();
