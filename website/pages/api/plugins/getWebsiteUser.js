import {database, databaseWebsite} from '@/lib/database'
import {sendDataToDiscordBot} from '@/lib/api/discordBotRequest'

export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body

        //let insertResult = null;
        let guildArray = []
        let resultArray = []

        await databaseWebsite(async function(db){
            
            const collection = db.collection('websiteUser');
            resultArray = await collection.find({}).toArray();
        })

        //userdata (get from Server)
        let user = null

        for (let i = 0; i < resultArray.length; i++) {
            const element = resultArray[i];
            const guildsFromBot = await sendDataToDiscordBot(element.id, 'getUser', {discordId: body.discordId});
            
            for (let i = 0; i < guildsFromBot.data.length; i++) {
                
                const guild = guildsFromBot.data[i];
                user = guildsFromBot.user

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
            message: "get WebsiteUser",
            guilds: guildArray,
            user: user
        })

    } else {
        // Handle any other HTTP method
    }

}


