const path = require('path');
const ExtensionManager = require('../ExtensionManager');
const ItemList = require('../obj/ItemList');
const BackgroundList = require('../obj/BackgroundList');
const animals = require('../animals');

module.exports = async function (client, plugin, config, projectAlias, data) {
    try {
        ExtensionManager.loadExtensions();
        const itemListObj = new ItemList();
        const rawItems = itemListObj.getListAll() || {};

        const backgroundListObj = new BackgroundList();
        const rawBackgrounds = backgroundListObj.getBackgroundListAll() || {};

        const decorations = Object.entries(rawItems)
            .filter(([key]) => key !== 'ABBRECHEN')
            .map(([key, item]) => {
                let category = 'Standard';
                if (key.startsWith('FESTIVAL_')) category = 'Festival';
                else if (key.startsWith('CHRISTMAS_') || key.includes('WINTER_')) category = 'Weihnachten';
                else if (key.startsWith('OSTERN_')) category = 'Ostern';
                else if (key.startsWith('VALENTINE_')) category = 'Valentinstag';
                else if (key.startsWith('FRIENDSHIP_')) category = 'Freundschaft';
                else if (key.startsWith('CARROT_')) category = 'Karotte';
                else if (['BOO', 'GHOST', 'KESSEL', 'KNIFE', 'PUMPKIN', 'SWEETS', 'WITCHHUT'].includes(key)) category = 'Halloween';

                return {
                    id: key,
                    name: item.name || key,
                    category,
                    icon: '/api/waldspiel/asset?type=item&id=' + encodeURIComponent(key),
                    price: item.price || 0,
                    currency: item.currency || 'BERRY',
                    animation: Boolean(item.animation),
                    isBalloon: Boolean(item.isBalloon)
                };
            });

        const backgrounds = Object.entries(rawBackgrounds)
            .filter(([key]) => key !== 'ABBRECHEN')
            .map(([key, bg]) => {
                let category = 'Standard';
                if (key.startsWith('CHRISTMAS_')) category = 'Weihnachten';
                else if (key.startsWith('OSTERN_')) category = 'Ostern';
                else if (key.startsWith('VALENTINE_')) category = 'Valentinstag';

                const isDefault = key === 'DEFAULT' || key === 'SUMMER';

                return {
                    id: key,
                    name: bg.name || key,
                    category,
                    icon: '/api/waldspiel/asset?type=background&id=' + encodeURIComponent(key),
                    price: isDefault ? 0 : (bg.price || 0),
                    currency: bg.currency || 'BERRY',
                    isDefault: isDefault
                };
            });

        const animalsList = Object.entries(animals).map(([key, a]) => ({
            type: key,
            name: a.name || key,
            image: '/api/waldspiel/asset?type=animal&id=' + encodeURIComponent(key)
        }));

        return {
            success: true,
            defaultBackgrounds: ['DEFAULT', 'SUMMER'],
            decorations,
            backgrounds,
            animals: animalsList
        };
    } catch (err) {
        console.error('[waldspiel getGameAssets error]:', err);
        return { success: false, error: err.message };
    }
};
