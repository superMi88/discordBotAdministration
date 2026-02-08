import { database, renameId, databaseWebsite } from '/lib/database'
import { ObjectId } from 'mongodb'
import {sendDataToDiscordBot} from '/lib/api/discordBotRequest'
import {sendDataToNodeProcess} from '/lib/api/discordNodeProcess'

export default async function handler(req, res) {

    //TODO change only to POST //true is for testing
    if (true) {

        const currencyWithEvents = await sendDataToNodeProcess('getEvent', {database: req.body.projectAlias})

        res.status(200).json({
            text: "get currencys (byIdguildId)",
            data: currencyWithEvents.data
        })

    } else {
        // Handle any other HTTP method
    }

}





