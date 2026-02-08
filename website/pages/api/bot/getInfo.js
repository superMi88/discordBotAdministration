

export default async function handler(req, res) {

    if (req.method === 'POST') {

        const { getLiaDaten } = require('../../../lib/app');
        const data = await getLiaDaten(req.body.projectAlias, req.body.botId);

        res.status(200).json(data)

    } else {
        // Handle any other HTTP method
    }

}
