import {database} from '/lib/database'
import {sendDataToDiscordBot} from '/lib/api/discordBotRequest'

import { verifyJwtToken } from "/auth";

export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body

        let botId = body.botId
        let command = body.command

        delete body['botId'];
        delete body['command'];


        
        console.log(req.cookies)
        const token = req.cookies["jwt"];

        
        let verifiedToken = null;
        if (token) {
          try {
            verifiedToken = await verifyJwtToken(token);
          } catch (err) {
            console.log("Token verification failed:", err);
          }
        }
        console.log("verifiedToken")
        console.log(verifiedToken)

  

        const result = await sendDataToDiscordBot(botId, command, body);

        res.status(200).json(result)

    } else {
        // Handle any other HTTP method
    }

}


