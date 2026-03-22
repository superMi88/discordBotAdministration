import {database} from '@/lib/database'

export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body
        res.status(200).json({
            text: "all Plugins (getAll)",
            data: await database(req.body.projectAlias, async function(db){

                //----------------
                const body = req.body

                let guildObj = {}
                guildObj = {plugins: []}

                //-------------
                
                let query = {}
                if (body.botId) {
                    query.botId = body.botId;
                }

                await db.collection('pluginCollection').find(query)
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