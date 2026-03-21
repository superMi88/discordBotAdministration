/*
 * Data class for managing user-specific data in a consistent way.
 * This class is shared between the Discord bot and the Website.
 */

let DatabaseManager;
try {
    // Try root first (for Website), otherwise relative (for Bot)
    DatabaseManager = require('./DatabaseManager.js');
} catch (e) {
    DatabaseManager = require('../lib/DatabaseManager.js');
}

class UserData {
    constructor(discordId) {
        this.discordId = discordId;
        // Track which fields were actually changed to avoid race conditions 
        // by only including modified fields in the MongoDB $set query
        this._modifiedPluginData = new Set();
        this._modifiedCurrencies = new Set();

        // Create a Proxy for currency to automatically track changes
        this.currency = new Proxy({}, {
            set: (target, key, value) => {
                if (target[key] !== value) {
                    target[key] = value;
                    this._modifiedCurrencies.add(key);
                }
                return true;
            },
            deleteProperty: (target, key) => {
                delete target[key];
                this._modifiedCurrencies.add(key);
                return true;
            }
        });

        // Backward compatibility alias for bot
        Object.defineProperty(this, 'currencyData', {
            get: () => this.currency,
            set: (val) => { 
                if (typeof val === 'object' && val !== null) {
                    for (const key in val) {
                        this.currency[key] = val[key];
                    }
                }
            }
        });
    }

    /**
     * Initializes the UserData instance by loading existing data from the database.
     */
    async load() {
        let db = DatabaseManager.get();
        const collection = db.collection('userCollection');
        let doc = await collection.findOne({ discordId: this.discordId });

        if (doc) {
            this.pluginData = doc.pluginData || {};
            
            // Populate currency Proxy without triggering modification flags
            // Use currency if not empty, otherwise fallback to currencyData
            const currency = doc.currency || {};
            const currencyData = doc.currencyData || {};
            const source = Object.keys(currency).length > 0 ? currency : currencyData;
            
            // Clear existing if any (should be empty in constructor anyway)
            for (let key in this.currency) delete this.currency[key]; 
            
            for (let key in source) {
                this.currency[key] = source[key];
            }
        } else {
            this.pluginData = {};
            for (let key in this.currency) delete this.currency[key];
        }

        this._modifiedPluginData.clear();
        this._modifiedCurrencies.clear();

        return this;
    }

    /**
     * Retrieves data for a specific plugin.
     * @param {Object|string} pluginOrAlias - The plugin object or a string tag
     * @param {string} keyNameOrPluginId - The key name or plugin ID
     * @param {string} [optionalKeyName] - Optional key name if the first two were alias/ID
     * @returns {*} The data
     */
    getPluginData(pluginOrAlias, keyNameOrPluginId, optionalKeyName) {
        let key, keyName;
        if (pluginOrAlias && typeof pluginOrAlias === 'object' && pluginOrAlias.pluginTag) {
            key = `${pluginOrAlias.pluginTag}-${pluginOrAlias.id}`;
            keyName = keyNameOrPluginId;
        } else {
            key = `${pluginOrAlias}-${keyNameOrPluginId}`;
            keyName = optionalKeyName;
        }

        if (keyName !== undefined) {
             return this.pluginData[key] ? this.pluginData[key][keyName] : undefined;
        }
        
        // Return a proxy to track nested changes if they modify the returned object directly
        if (this.pluginData[key] && typeof this.pluginData[key] === 'object') {
            return new Proxy(this.pluginData[key], {
                set: (target, p, value) => {
                    if (target[p] !== value) {
                        target[p] = value;
                        this._modifiedPluginData.add(key);
                    }
                    return true;
                }
            });
        }
        
        return this.pluginData[key];
    }

    /**
     * Sets data for a specific plugin.
     * Supports:
     * - setPluginData(pluginObject, key, value)
     * - setPluginData(tag, id, dataObject)
     * - setPluginData(tag, id, key, value)
     */
    setPluginData(pluginOrAlias, keyNameOrPluginId, dataOrValue, optionalValue) {
        let key, keyName, value;
        
        if (pluginOrAlias && typeof pluginOrAlias === 'object' && pluginOrAlias.pluginTag) {
            // Case: (pluginObject, key, value)
            key = `${pluginOrAlias.pluginTag}-${pluginOrAlias.id}`;
            keyName = keyNameOrPluginId;
            value = dataOrValue;
        } else if (optionalValue !== undefined) {
            // Case: (tag, id, key, value)
            key = `${pluginOrAlias}-${keyNameOrPluginId}`;
            keyName = dataOrValue;
            value = optionalValue;
        } else {
            // Case: (tag, id, dataObject)
            key = `${pluginOrAlias}-${keyNameOrPluginId}`;
            keyName = undefined;
            value = dataOrValue;
        }

        if (keyName !== undefined) {
            if (!this.pluginData[key] || typeof this.pluginData[key] !== 'object') {
                this.pluginData[key] = {};
            }
            this.pluginData[key][keyName] = value;
        } else {
            this.pluginData[key] = value;
        }
        
        this._modifiedPluginData.add(key);
    }

    /**
     * Retrieves amount of a specific currency.
     */
    getCurrency(currencyType) {
        return this.currency[currencyType];
    }

    /**
     * Sets amount of a specific currency.
     */
    setCurrency(currencyType, amount) {
        this.currency[currencyType] = amount;
        this._modifiedCurrencies.add(currencyType);
    }

    /**
     * Adds a positive amount to a specific currency.
     */
    addCurrency(currencyType, amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            console.error(`[UserData] SECURITY BLOCK: addCurrency requires a positive number. Received: ${amount}`);
            return;
        }
        let current = this.currency[currencyType];
        if (typeof current !== 'number') current = 0;
        
        this.currency[currencyType] = current + amount;
        this._modifiedCurrencies.add(currencyType);
    }

    /**
     * Removes a positive amount from a specific currency.
     */
    removeCurrency(currencyType, amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            console.error(`[UserData] SECURITY BLOCK: removeCurrency requires a positive number. Received: ${amount}`);
            return;
        }
        let current = this.currency[currencyType];
        if (typeof current !== 'number') current = 0;
        
        this.currency[currencyType] = current - amount;
        this._modifiedCurrencies.add(currencyType);
    }

    /**
     * Saves the modified data back to the database.
     * @param {Object} [plugin=null] - Optional plugin instance that triggered the save.
     */
    async save(plugin = null) {
        let db = DatabaseManager.get();
        const collection = db.collection('userCollection');

        let setQuery = {};
        let unsetQuery = {};

        // Use dot notation to only update the specific keys
        for (const key of this._modifiedPluginData) {
            setQuery[`pluginData.${key}`] = this.pluginData[key];
        }

        const oldCurrencies = {};
        const newCurrencies = {};
        let userDoc = null;

        if (this._modifiedCurrencies.size > 0) {
            // Security check only for plugins (Discord bot context)
            if (plugin && plugin.logic && plugin.logic.addEvents) {
                let eventsArray = [];
                await plugin.logic.addEvents(plugin, eventsArray);
                
                const allowedCurrencies = eventsArray.map(e => e.variable);

                for (const key of this._modifiedCurrencies) {
                    if (!allowedCurrencies.includes(key)) {
                        console.error(`[UserData] SECURITY BLOCK: Plugin ${plugin.pluginTag}-${plugin.id} tried to modify currency '${key}', but did not define an event for it in addEvents!`);
                        this._modifiedCurrencies.delete(key);
                    }
                }
            }
            
            if (this._modifiedCurrencies.size > 0) {
                userDoc = await collection.findOne({ discordId: this.discordId });
            }
        }

        for (const key of this._modifiedCurrencies) {
            const newValue = this.currency[key];
            if (newValue === null || newValue === undefined) {
                unsetQuery[`currency.${key}`] = "";
                unsetQuery[`currencyData.${key}`] = "";
            } else {
                setQuery[`currency.${key}`] = newValue;
                setQuery[`currencyData.${key}`] = newValue;
            }

            if (plugin && userDoc) {
                let oldValue = userDoc.currency ? userDoc.currency[key] : (userDoc.currencyData ? userDoc.currencyData[key] : undefined);
                oldValue = oldValue !== undefined && oldValue !== null ? oldValue : 0;
                let sanitizedNewValue = newValue !== undefined && newValue !== null ? newValue : 0;

                if (oldValue !== sanitizedNewValue) {
                    oldCurrencies[key] = oldValue;
                    newCurrencies[key] = sanitizedNewValue;
                }
            }
        }

        let updateQuery = {};
        if (Object.keys(setQuery).length > 0) {
            updateQuery.$set = setQuery;
        }
        if (Object.keys(unsetQuery).length > 0) {
            updateQuery.$unset = unsetQuery;
        }

        if (Object.keys(updateQuery).length === 0) {
            // Ensure the user doc exists
            await collection.updateOne(
                { discordId: this.discordId },
                { $setOnInsert: { discordId: this.discordId } },
                { upsert: true }
            );
        } else {
            await collection.updateOne(
                { discordId: this.discordId },
                updateQuery,
                { upsert: true }
            );
        }

        // Emit triggers to Discord bot manager IF possible
        if (plugin && typeof process.send === 'function') {
            for (const key in newCurrencies) {
                process.send({
                    manager: "triggerEvent",
                    triggerPluginId: plugin.id,
                    discordUserId: this.discordId,
                    currencyId: key,
                    oldValue: oldCurrencies[key],
                    newValue: newCurrencies[key]
                });
            }
        }

        this._modifiedPluginData.clear();
        this._modifiedCurrencies.clear();
    }

    /**
     * Static helper to easily load a user.
     */
    static async get(discordId) {
        const user = new UserData(discordId);
        await user.load();
        return user;
    }

    /**
     * Finds users that match specific plugin data criteria.
     */
    static async findByPluginData(pluginAlias, pluginId, queryObj) {
        const prefix = `pluginData.${pluginAlias}-${pluginId}`;
        const finalQuery = {};

        for (const [key, value] of Object.entries(queryObj)) {
            finalQuery[`${prefix}.${key}`] = value;
        }

        return UserData.find(finalQuery);
    }

    /**
     * Finds users that match a custom native database query.
     */
    static async find(query, sort = null, limit = null) {
        let db = DatabaseManager.get();
        const collection = db.collection('userCollection');

        let cursor = collection.find(query);
        if (sort) cursor = cursor.sort(sort);
        if (limit) cursor = cursor.limit(limit);

        const docs = await cursor.toArray();

        return docs.map(doc => {
            const user = new UserData(doc.discordId);
            user.pluginData = doc.pluginData || {};
            
            // Avoid proxy tracking during mass load
            const currency = doc.currency || {};
            const currencyData = doc.currencyData || {};
            const finalSource = Object.keys(currency).length > 0 ? currency : currencyData;

            for (let key in finalSource) {
                user.currency[key] = finalSource[key];
            }
            user._modifiedCurrencies.clear();
            
            return user;
        });
    }

    /**
     * Counts users that match a query.
     */
    static async count(query) {
        let db = DatabaseManager.get();
        const collection = db.collection('userCollection');
        return await collection.countDocuments(query);
    }
}

module.exports = UserData;
