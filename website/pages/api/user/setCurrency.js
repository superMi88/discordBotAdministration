import {database} from '/lib/database'
var ObjectId = require('mongodb').ObjectId; 

//Zum setzen der Currency, wird verwendet in der Userliste, zB. um die anzahl coins oder Beeren zu erhöhen
export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body
        const discordId = body.discordId
        const currencyId = body.currencyId
        const value = body.value

        let result = null;
        let status = undefined;

        await database(body.projectAlias, async function(db){

            const collection = db.collection('userCollection');

            const updatedDocs = await collection.updateOne(
                {discordId: discordId}, 
                {$set: {["currency."+currencyId] : parseInt(value)} }
            );

            if(updatedDocs.matchedCount == 1){
                message = "value was set to "+parseInt(value)
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