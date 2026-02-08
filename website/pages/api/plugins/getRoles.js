import {database} from '@/lib/database'
import {sendDataToDiscordBot} from '@/lib/api/discordBotRequest'

export default async function handler(req, res) {


    if (req.method === 'POST') {

        const body = req.body

        //let insertResult = null;

        const result = await sendDataToDiscordBot(body.botId, 'getRoles');

        res.status(200).json(result)

    } else {
        // Handle any other HTTP method
    }

}


