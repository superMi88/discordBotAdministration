const DatabaseManager = require('./DatabaseManager.js');

class UserData {
    constructor(discordId) {
        this.discordId = discordId;
        this.pluginData = {};
        this.currencyData = {};

        // Track which fields were actually changed to avoid race conditions 
        // by only including modified fields in the MongoDB $set query
        this._modifiedPluginData = new Set();
        this._modifiedCurrencies = new Set();
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
            this.currencyData = doc.currencyData || {};
        } else {
            this.pluginData = {};
            this.currencyData = {};
        }

        this._modifiedPluginData.clear();
        this._modifiedCurrencies.clear();

        return this;
    }

    /**
     * Retrieves data for a specific plugin.
     * @param {string} pluginAlias - The alias of the plugin (e.g. "birthday")
     * @param {string} pluginId - The unique ID of the plugin instance
     * @returns {Object} The data object for the plugin, or undefined if not set.
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
        return this.pluginData[key];
    }

    /**
     * Sets data for a specific plugin.
     * @param {string} pluginAlias - The alias of the plugin (e.g. "birthday")
     * @param {string} pluginId - The unique ID of the plugin instance
     * @param {Object} data - The data object to save
     */
    setPluginData(pluginOrAlias, keyNameOrPluginId, dataOrValue) {
        let key, keyName, value;
        if (pluginOrAlias && typeof pluginOrAlias === 'object' && pluginOrAlias.pluginTag) {
            key = `${pluginOrAlias.pluginTag}-${pluginOrAlias.id}`;
            keyName = keyNameOrPluginId;
            value = dataOrValue;
            
            if (!this.pluginData[key] || typeof this.pluginData[key] !== 'object') {
                this.pluginData[key] = {};
            }
            if (keyName !== undefined) {
                this.pluginData[key][keyName] = value;
            } else {
                this.pluginData[key] = value;
            }
            this._modifiedPluginData.add(key);
        } else {
            key = `${pluginOrAlias}-${keyNameOrPluginId}`;
            this.pluginData[key] = dataOrValue;
            this._modifiedPluginData.add(key);
        }
    }

    /**
     * Retrieves amount of a specific currency.
     * @param {string} currencyType - The key for the currency
     * @returns {number} The currency amount, defaulting to 0
     */
    getCurrency(currencyType) {
        console.log(this.currencyData)
        console.log(this.currencyData[currencyType])
        return this.currencyData[currencyType];
    }

    /**
     * Sets amount of a specific currency.
     * @param {string} currencyType - The key for the currency
     * @param {number|string|Object|boolean|null} amount - The currency amount/value to set
     */
    setCurrency(currencyType, amount) {
        this.currencyData[currencyType] = amount;
        this._modifiedCurrencies.add(currencyType);
    }

    /**
     * Adds a positive amount to a specific currency.
     * @param {string} currencyType - The key for the currency
     * @param {number} amount - The positive currency amount to add
     */
    addCurrency(currencyType, amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            console.error(`[UserData] SECURITY BLOCK: addCurrency requires a positive number. Received: ${amount}`);
            return;
        }
        let current = this.currencyData[currencyType];
        if (typeof current !== 'number') current = 0;
        
        this.currencyData[currencyType] = current + amount;
        this._modifiedCurrencies.add(currencyType);
    }

    /**
     * Removes a positive amount from a specific currency.
     * @param {string} currencyType - The key for the currency
     * @param {number} amount - The positive currency amount to subtract
     */
    removeCurrency(currencyType, amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            console.error(`[UserData] SECURITY BLOCK: removeCurrency requires a positive number. Received: ${amount}`);
            return;
        }
        let current = this.currencyData[currencyType];
        if (typeof current !== 'number') current = 0;
        
        this.currencyData[currencyType] = current - amount;
        this._modifiedCurrencies.add(currencyType);
    }

    /**
     * Saves the modified data back to the database.
     * @param {Object} [plugin=null] - Optional plugin instance that triggered the save. Used for emitting trigger events.
     */
    async save(plugin = null) {
        let db = DatabaseManager.get();
        const collection = db.collection('userCollection');

        let setQuery = {};
        let unsetQuery = {};

        // Use dot notation to only update the specific keys to prevent race conditions 
        // with other processes updating different plugins or currencies simultaneously.
        for (const key of this._modifiedPluginData) {
            setQuery[`pluginData.${key}`] = this.pluginData[key];
        }

        const oldCurrencies = {};
        const newCurrencies = {};
        let userDoc = null;

        if (this._modifiedCurrencies.size > 0) {
            if (!plugin) {
                console.error(`[UserData] SECURITY BLOCK: Attempted to save currencies without a plugin context! All currency modifications are dropped.`);
                this._modifiedCurrencies.clear();
            } else {
                let eventsArray = [];
                if (plugin.logic && plugin.logic.addEvents) {
                    await plugin.logic.addEvents(plugin, eventsArray);
                }
                
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
            const newValue = this.currencyData[key];
            if (newValue === null || newValue === undefined) {
                unsetQuery[`currencyData.${key}`] = "";
            } else {
                setQuery[`currencyData.${key}`] = newValue;
            }

            if (plugin && userDoc) {
                let oldValue = userDoc.currency ? userDoc.currency[key] : undefined;
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
            // Ensure the user doc exists if there are no specific plugins/currencies to set
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

        if (plugin) {
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
     * @param {string} discordId - The user's discord ID
     * @returns {Promise<UserData>} The populated UserData instance
     */
    static async get(discordId) {
        const user = new UserData(discordId);
        await user.load();
        return user;
    }
    /**
     * Finds users that match specific plugin data criteria.
     * @param {string} pluginAlias - The alias of the plugin (e.g. "birthday")
     * @param {string} pluginId - The unique ID of the plugin instance
     * @param {Object} queryObj - An object containing key-value pairs to match against the plugin data
     * @returns {Promise<UserData[]>} List of UserData instances matching the criteria
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
     * @param {Object} query - The database query to execute.
     * @param {Object} [sort] - The sort criteria. Optional.
     * @param {number} [limit] - The maximum number of documents to return. Optional.
     * @returns {Promise<UserData[]>} List of UserData instances matching the criteria.
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
            user.currencyData = doc.currencyData || {};
            return user;
        });
    }

    /**
     * Counts users that match a query.
     * @param {Object} query - The database query to execute.
     * @returns {Promise<number>} Number of matched users.
     */
    static async count(query) {
        let db = DatabaseManager.get();
        const collection = db.collection('userCollection');
        return await collection.countDocuments(query);
    }
}

module.exports = UserData;
