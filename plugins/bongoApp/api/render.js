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

        const userData = await UserData.get(userId);
        if (!userData) return { status: 'error', message: 'User not found' };

        const waldspielData = userData.pluginData?.['waldspiel-643556763768cdbc42f8d899'];
        if (!waldspielData) return { status: 'error', message: 'Waldspiel data not found' };

        const renderResult = await ImageCreator.renderSingleAnimal(waldspielData, 2, userId);
        const frames = Array.isArray(renderResult) ? renderResult : renderResult.frames;

        return { status: 'success', frames };
    } catch (error) {
        console.error("[Bongo Render API] Error:", error.message);
        return { status: 'error', message: error.toString() };
    }
};
