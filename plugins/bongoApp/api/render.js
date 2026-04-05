const path = require('path');

module.exports = async function (client, plugin, config, projectAlias, data) {
    const userId = data.userId;
    if (!userId) return { status: 'error', message: 'Missing userId' };

    try {
        const ImageCreator = require('../../waldspiel/imageCreator.js');
        const UserData = require('../../../lib/UserData.js');
        const DatabaseManager = require('../../../lib/DatabaseManager.js');

        // Ensure database for current project
        await DatabaseManager.create(projectAlias);

        // Use the waldspielId determined during plugin initialization
        const waldspielId = plugin.waldspielId;
        if (!waldspielId) return { status: 'error', message: 'Waldspiel Plugin ID not configured' };

        const userData = await UserData.get(userId);
        if (!userData) return { status: 'error', message: 'User not found' };

        const waldspielKey = `waldspiel-${waldspielId}`;
        const waldspielData = userData.pluginData?.[waldspielKey];
        if (!waldspielData) return { status: 'error', message: 'Waldspiel data not found' };

        // Position 2 preference, then 1, then 3
        let position = 2;
        if (!waldspielData.animalId2) {
            if (waldspielData.animalId1) position = 1;
            else if (waldspielData.animalId3) position = 3;
        }

        const renderResult = await ImageCreator.renderSingleAnimal(waldspielData, position, userId);
        const framesRaw = Array.isArray(renderResult) ? renderResult : renderResult.frames;
        
        const timestamp = Date.now();
        const frames = framesRaw.map(f => `file:///${path.resolve(f).replace(/\\/g, '/')}?t=${timestamp}`);

        return { status: 'success', frames };
    } catch (error) {
        console.error("[Bongo Render API] Error:", error.message);
        return { status: 'error', message: error.toString() };
    }
};
