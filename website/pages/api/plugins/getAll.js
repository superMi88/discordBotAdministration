import {database} from '/lib/database'

export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body

        let insertResult = null;

        await database(req.body.projectAlias, async function(db){
            
            const collection = db.collection('pluginCollection');

            insertResult = await collection.find(
                { 
                    botId: body.botId
                }
            ).toArray()
        })



        res.status(200).json({
            text: "all Plugins (getAll)",
            data: await database(req.body.projectAlias, async function(db){

                //----------------
                const body = req.body

                //let insertResult = null;
                let guildObj = {}

                guildObj = {plugins: []}

                //-------------


                await db.collection('pluginCollection').find({})
                .map((doc) => {
                    doc['pluginId'] = doc._id;
                    delete doc['_id'];
                    
                    guildObj.plugins.push(doc)
                        
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