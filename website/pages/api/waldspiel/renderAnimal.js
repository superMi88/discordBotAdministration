const ImageCreator = require('../../../../plugins/waldspiel/imageCreator.js');
const UserData = require('../../../../lib/UserData.js');
const DatabaseManager = require('../../../../lib/DatabaseManager.js');

/**
 * Internal API to render the middle animal of a user's forest.
 * Access is restricted to local calls.
 * 
 * Query params:
 * - userId: Discord User ID
 * - projectAlias: The project/database name
 */
export default async function handler(req, res) {
    // Basic restriction to localhost for internal programs
    const allowedIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    const remoteAddress = req.socket.remoteAddress;

    if (!allowedIps.includes(remoteAddress)) {
        return res.status(403).json({ error: 'Internal use only' });
    }

    const { userId, projectAlias } = req.query;

    if (!userId || !projectAlias) {
        return res.status(400).json({ error: 'Missing userId or projectAlias' });
    }

    try {
        // Ensure DatabaseManager is initialized for the correct project
        await DatabaseManager.create(projectAlias);

        // Load user data
        const userData = await UserData.get(userId);
        if (!userData || !userData.currencyData) {
            return res.status(404).json({ error: 'User data not found' });
        }

        // returns an array of absolute file paths to PNG frames
        const framePaths = await ImageCreator.renderSingleAnimal(userData.currencyData, 2, userId);

        res.status(200).json({
            status: 'success',
            frames: framePaths
        });
    } catch (error) {
        console.error("[Waldspiel Render API] Error:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to render animal', 
            details: error.toString() 
        });
    }
}
