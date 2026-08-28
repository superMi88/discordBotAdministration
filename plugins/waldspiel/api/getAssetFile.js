const path = require('path');
const fs = require('fs');
const ExtensionManager = require('../ExtensionManager');
const ItemList = require('../obj/ItemList');
const BackgroundList = require('../obj/BackgroundList');
const animals = require('../animals');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const { type, id } = data || {};
    if (!type || !id) {
        return { success: false, error: 'type und id sind erforderlich.' };
    }

    try {
        const botBasePath = path.join(__dirname, '..');
        ExtensionManager.loadExtensions();

        let targetFilename = null;

        if (type === 'item') {
            const itemListObj = new ItemList();
            const items = itemListObj.getListAll() || {};
            const item = items[id] || items[id.toUpperCase()];
            if (item && item.filename) {
                targetFilename = item.filename;
            }
        } else if (type === 'background') {
            const backgroundListObj = new BackgroundList();
            const backgrounds = backgroundListObj.getBackgroundListAll() || {};
            const bg = backgrounds[id] || backgrounds[id.toUpperCase()];
            if (bg) {
                targetFilename = bg.filename?.day || bg.filename;
            }
        } else if (type === 'animal') {
            const animal = animals[id] || animals[id.toUpperCase()];
            if (animal && animal.filename) {
                targetFilename = animal.filename;
            }
        }

        if (!targetFilename) {
            return { success: false, error: Asset  vom Typ  nicht gefunden. };
        }

        const extensions = ['.png', '.webp', '.gif', '.jpg', ''];
        const candidates = [];

        if (path.isAbsolute(targetFilename)) {
            candidates.push(targetFilename);
        }

        if (type === 'item') {
            candidates.push(path.resolve(botBasePath, 'images', 'items', targetFilename));
            candidates.push(path.resolve(botBasePath, targetFilename));
            candidates.push(path.resolve(botBasePath, 'images', targetFilename));
            candidates.push(path.resolve(botBasePath, 'images', 'items', path.basename(targetFilename)));
            candidates.push(path.resolve(botBasePath, 'images', path.basename(targetFilename)));
        } else if (type === 'background') {
            candidates.push(path.resolve(botBasePath, 'images', 'backgrounds', targetFilename));
            candidates.push(path.resolve(botBasePath, 'images', targetFilename));
            candidates.push(path.resolve(botBasePath, targetFilename));
            candidates.push(path.resolve(botBasePath, 'images', 'backgrounds', path.basename(targetFilename)));
            candidates.push(path.resolve(botBasePath, 'images', path.basename(targetFilename)));
        } else if (type === 'animal') {
            candidates.push(path.resolve(botBasePath, 'images', 'tiere', targetFilename));
            candidates.push(path.resolve(botBasePath, 'images', targetFilename));
            candidates.push(path.resolve(botBasePath, targetFilename));
        }

        let resolvedPath = null;
        for (const cand of candidates) {
            for (const ext of extensions) {
                const testPath = cand.endsWith(ext) ? cand : cand + ext;
                if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
                    resolvedPath = testPath;
                    break;
                }
            }
            if (resolvedPath) break;
        }

        if (!resolvedPath) {
            return { success: false, error: Bilddatei für  nicht gefunden. };
        }

        const ext = path.extname(resolvedPath).toLowerCase();
        let contentType = 'image/png';
        if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

        return {
            success: true,
            filePath: resolvedPath,
            contentType
        };
    } catch (err) {
        console.error('[getAssetFile Error]:', err);
        return { success: false, error: err.message };
    }
};
