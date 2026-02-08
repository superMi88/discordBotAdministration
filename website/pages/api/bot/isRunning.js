/*
req is an instance of http.IncomingMessage, plus some pre-built middlewares.
res is an instance of http.ServerResponse, plus some helper functions.
*/

//Do Not Fetch an API Route from getStaticProps or getStaticPaths!!!
//https://nextjs.org/learn/basics/api-routes/api-routes-details

//A Good Use Case: Handling Form Input

/*lib*/
import { DiscordAPIError } from 'discord.js';
import { apigateway } from 'googleapis/build/src/apis/apigateway';
import {sendDataToDiscordBot} from '../../../lib/api/discordBotRequest'

const information = "Die Api gibt deb Status des Discord Bots zurück sobald der sich vom currentStatus abweich"
const fields = [
    {
        name: "currentStatus",
        field: "multi",
        required: true,
        values: ['unset', 'starting', 'stopping', 'online', 'offline'],
        information: "der aktuelle Status"
    }
]
export function getInformation(){
    return information
}

export function getFields(){
    return fields
}

export default async function handler(req, res) {

    let response = await api(req.body.botId, false /*req.body.currentStatus*/)
    res.status(200).json(response)
}

async function api(botId, currentStatus){
    const discordBotData2 = await sendDataToDiscordBot(botId, 'isOnline');
    return(discordBotData2)
}






