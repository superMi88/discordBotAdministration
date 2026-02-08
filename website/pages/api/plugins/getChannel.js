import {database} from '@/lib/database'
import {sendDataToDiscordBot} from '@/lib/api/discordBotRequest'

export default async function handler(req, res) {

    const botId = req.body.botId

    let result = null

    if(req.method === 'POST'){
        result = await sendDataToDiscordBot(botId, 'getChannel');
    
        res.status(200).json(result)

    } else {
        // Handle any other HTTP method
    }

}


