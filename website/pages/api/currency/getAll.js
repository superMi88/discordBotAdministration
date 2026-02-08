import {database, renameId, databaseWebsite} from '@/lib/database'
import {sendDataToDiscordBot} from '@/lib/api/discordBotRequest'

export default async function handler(req, res) {

    //TODO change only to POST //true is for testing
    if (true) {


        res.status(200).json({
            text: "all currencys (getAll)",
            data: await database(req.body.projectAlias, async function(db){

                //----------------
                const body = req.body

                //let insertResult = null;
                let guildObj = {}

                guildObj = {global : true, icon: "", guild: "global", currencys: []}

                //-------------


                await db.collection('currency').find({}).sort( { "guildId": 1} )
                .map((doc) => {
                    doc['currencyId'] = doc._id;
                    delete doc['_id'];
                    
                    guildObj.currencys.push(doc)
                        
                    return true
                }
                ).toArray();
                return guildObj
            })
        })
    
    } else {
        // Handle any other HTTP method
    }

}


async function validateToken(access_token) {

    const req = await fetch("https://discord.com/api/users/@me", {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })

    const response = await req.json();

    return {response} ;
}


