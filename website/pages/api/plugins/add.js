import {database} from '@/lib/database'

export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body

        let insertResult = null;

        await database(req.body.projectAlias, async function(db){

            const collection = db.collection('pluginCollection');

            insertResult = await collection.insertOne(
                { 
                    botId: body.botId,
                    name: body.name,
                    pluginTag: body.name,
                    status: "unsaved",
                    var: {}
                }
            )
        })
        
        res.status(200).json(insertResult)

    } else {
        // Handle any other HTTP method
    }

}