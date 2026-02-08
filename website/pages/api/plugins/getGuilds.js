import {database} from '/lib/database'
import {sendDataToDiscordBot} from '/lib/api/discordBotRequest'

export default async function handler(req, res) {

    if (req.method === 'POST') {
        const body = req.body

        //let insertResult = null;
        let guildArray = []
        let resultArray = []

        let searchObj = {}
        if(body.botId){
            searchObj = {id: body.botId}
        }

        await database(req.body.projectAlias, async function(db){
            
            const collection = db.collection('botCollection');

            resultArray = await collection.find(searchObj).toArray();

        })



        for (let i = 0; i < resultArray.length; i++) {
            const element = resultArray[i];

            const guildsFromBot = await sendDataToDiscordBot(element.id, 'getGuildsServer');
            


            for (let i = 0; i < guildsFromBot.data.length; i++) {
                const guild = guildsFromBot.data[i];


                let exist = false
                for (let a = 0; a < guildArray.length; a++) {

                    if(guild.id == guildArray[a].id){
                        exist = true;
                    }
                }
                if(!exist){
                    guildArray.push(guild)
                }
                
            }

        }


        res.status(200).json({
            message: "alle guilds von allen bots",
            guilds: guildArray
        })

    } else {
        // Handle any other HTTP method
    }

}


