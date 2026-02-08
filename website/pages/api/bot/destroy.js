/*
req is an instance of http.IncomingMessage, plus some pre-built middlewares.
res is an instance of http.ServerResponse, plus some helper functions.
*/

//Do Not Fetch an API Route from getStaticProps or getStaticPaths!!!
//https://nextjs.org/learn/basics/api-routes/api-routes-details

//A Good Use Case: Handling Form Input

/*lib*/
import {sendDataToDiscordBot} from '../../../lib/api/discordBotRequest'

export default async function handler(req, res) {

    const discordBotData = await sendDataToDiscordBot(req.body.botId, 'destroy');
    res.status(200).json(discordBotData)

}
/*
export function getInfo(){
    return "Hier kann der Bot zerstört werden"
}
*/

