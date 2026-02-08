import {database} from '@/lib/database'
var ObjectId = require('mongodb').ObjectId

import {sendDataToDiscordBot} from '../../../lib/api/discordBotRequest'

export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body

        let deleteResult = null;

        await database(req.body.projectAlias, async function(db){

            const collection = db.collection('pluginCollection');

            deleteResult = await collection.deleteOne(
                {
                    _id: ObjectId(body.pluginId)
                }
            )
        })
        const discordBotResponse = await sendDataToDiscordBot(body.botId, 'deletePlugin', {pluginId: body.pluginId})
        
        res.status(200).json(deleteResult)

    } else {
        // Handle any other HTTP method
    }

}