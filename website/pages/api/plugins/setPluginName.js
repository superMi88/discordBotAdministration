import {database} from '/lib/database'
var ObjectId = require('mongodb').ObjectId; 

//Zum setzen der Currency, wird verwendet in der Userliste, zB. um die anzahl coins oder Beeren zu erhöhen
export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body
        const pluginId = body.pluginId
        const pluginName = body.pluginName

        let message = "";
        let status = "notOk";

        await database(body.projectAlias, async function(db){

            const collection = db.collection('pluginCollection');

            const updatedDocs = await collection.updateOne(
                {_id: ObjectId(pluginId)}, 
                {$set: {name : pluginName} }
            );

            if(updatedDocs.matchedCount == 1){
                message = "value was set to "+pluginName
                status = "ok"
            }
        })
        
        //TODO richtigen status zurück geben der prüft ob der update geklappt hat
        res.status(200).json({
            message: message,
            status: status
        })

    } else {
        // Handle any other HTTP method
    }

}