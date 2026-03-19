import {database} from '@/lib/database'
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

        const UserData = require('../../../../lib/UserData.js');
        const DatabaseManager = require('../../../../lib/DatabaseManager.js');

        await DatabaseManager.create(body.projectAlias);
        let userData = await UserData.get(discordId);
        
        userData.setCurrency(currencyId, parseInt(value));
        // We pass null as plugin because we are in website context and don't care about bot triggers here
        await userData.save(null);
        
        status = "ok";
        let message = "value was set to "+parseInt(value);
        
        //TODO richtigen status zurück geben der prüft ob der update geklappt hat
        res.status(200).json({
            message: message,
            status: status
        })

    } else {
        // Handle any other HTTP method
    }

}