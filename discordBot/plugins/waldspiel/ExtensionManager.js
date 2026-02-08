const fs = require('fs');
const path = require('path');

class ExtensionManager {
    constructor(extensionPath = path.join(__dirname, 'extensions')) {
        this.extensionPath = extensionPath;
        this.extensions = [];
    }

    loadExtensions() {
        this.extensions = []; // vorherige leeren

        if (!fs.existsSync(this.extensionPath)) {
            console.warn('⚠️ Extension-Verzeichnis nicht gefunden:', this.extensionPath);
            return;
        }

        for (const file of fs.readdirSync(this.extensionPath)) {
            const fullPath = path.join(this.extensionPath, file);
            const stat = fs.statSync(fullPath);
            let modulePath = null;

            if (stat.isDirectory()) {
                // Load extensions from folders
                const indexFile = path.join(fullPath, 'index.js');
                const namedFile = path.join(fullPath, `${file}.js`);

                if (fs.existsSync(indexFile)) {
                    modulePath = indexFile;
                } else if (fs.existsSync(namedFile)) {
                    modulePath = namedFile;
                }
            }

            if (modulePath) {
                try {
                    const ExtensionClass = require(modulePath);
                    const instance = new ExtensionClass();
                    this.extensions.push(instance);
                } catch (err) {
                    console.warn(`❌ Fehler beim Laden der Extension ${file}: ${err.message}`);
                }
            }
        }
    }

    getExtensions() {
        return this.extensions;
    }

    _runHook(hookName, ...args) {
        const results = [];
        for (const ext of this.extensions) {
            if (typeof ext[hookName] === 'function') {
                try {
                    const result = ext[hookName](...args);
                    results.push(result);
                } catch (err) {
                    console.warn(`⚠️ Fehler in ${hookName} bei ${ext.constructor.name}:`, err.message);
                }
            }
        }
        return results;
    }

    preExecute(client, plugin) {
        this._runHook('preExecute', client, plugin);
    }

    getButtonsForMeinwald(client, plugin) {
        const buttons = [];
        for (const ext of this.extensions) {
            if (typeof ext.getButtonsForMeinwald === 'function') {
                try {
                    const result = ext.getButtonsForMeinwald(client, plugin);
                    if (Array.isArray(result)) {
                        buttons.push(...result);
                    } else if (result) {
                        buttons.push(result);
                    }
                } catch (err) {
                    console.warn(`[ExtensionManager] Fehler bei getButtonsForMeinwald in ${ext.constructor.name}:`, err.message);
                }
            }
        }
        return buttons;
    }

    getButtonsForEvent(client, plugin, eventType) {
        const buttons = [];
        for (const ext of this.extensions) {
            if (typeof ext.getButtonsForEvent === 'function') {
                try {
                    const result = ext.getButtonsForEvent(client, plugin, eventType);
                    if (Array.isArray(result)) {
                        buttons.push(...result);
                    } else if (result) {
                        buttons.push(result);
                    }
                } catch (err) {
                    console.warn(`[ExtensionManager] Fehler bei getButtonsForEvent in ${ext.constructor.name}:`, err.message);
                }
            }
        }
        return buttons;
    }

    async getShop(client, plugin, shopChannel, createItemShop, createBackgroundShop) {
        const buttons = [];
        for (const ext of this.extensions) {
            if (typeof ext.getShop === 'function') {
                try {
                    const result = await ext.getShop(client, plugin, shopChannel, createItemShop, createBackgroundShop);
                    if (Array.isArray(result)) {
                        buttons.push(...result);
                    } else if (result) {
                        buttons.push(result);
                    }
                } catch (err) {
                    console.warn(`[ExtensionManager] Fehler bei getShop in ${ext.constructor.name}:`, err.message);
                }
            }
        }
        return buttons;
    }

    getItems() {
        let items = {};
        for (const ext of this.extensions) {
            if (typeof ext.getItems === 'function') {
                try {
                    Object.assign(items, ext.getItems());
                } catch (err) {
                    console.warn(`[ExtensionManager] Error getting items from extension ${ext.constructor.name}:`, err.message);
                }
            }
        }
        return items;
    }

    getBackgrounds() {
        let backgrounds = {};
        for (const ext of this.extensions) {
            if (typeof ext.getBackgrounds === 'function') {
                try {
                    Object.assign(backgrounds, ext.getBackgrounds());
                } catch (err) {
                    console.warn(`[ExtensionManager] Error getting backgrounds from extension ${ext.constructor.name}:`, err.message);
                }
            }
        }
        return backgrounds;
    }

    async onInteraction(interaction, client, plugin, db) {
        for (const ext of this.extensions) {
            if (typeof ext.onInteraction === 'function') {
                try {
                    await ext.onInteraction(interaction, client, plugin, db);
                } catch (err) {
                    console.warn(`[ExtensionManager] Fehler bei onInteraction in ${ext.constructor.name}:`, err.message);
                }
            }
        }
    }

    async onDailyTick(client, plugin, db) {
        for (const ext of this.extensions) {
            if (typeof ext.onDailyTick === 'function') {
                try {
                    await ext.onDailyTick(client, plugin, db);
                } catch (err) {
                    console.warn(`[ExtensionManager] Fehler bei onDailyTick in ${ext.constructor.name}:`, err.message);
                }
            }
        }
    }

    async onCreateWald(client, plugin, db) {
        for (const ext of this.extensions) {
            if (typeof ext.onCreateWald === 'function') {
                try {
                    await ext.onCreateWald(client, plugin, db);
                } catch (err) {
                    console.warn(`[ExtensionManager] Fehler bei onCreateWald in ${ext.constructor.name}:`, err.message);
                }
            }
        }
    }
}

module.exports = new ExtensionManager(); // Singleton