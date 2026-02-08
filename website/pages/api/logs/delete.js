import {database} from '/lib/database'
var ObjectId = require('mongodb').ObjectId; 

export default async function handler(req, res) {

    //TODO change only to POST //true is for testing
    //TODO check if acknowledged is true wenn keine error oder wenn es kein error gb
    if (true) {

        const result = await database(req.body.projectAlias, async function(db){

            const resu = await db.collection('log').remove()

            return resu
        })



        const fs = require('fs');

        try {
            fs.unlinkSync('./../logs/error.log', 'utf8');
        } catch (err) {
            
        }


        res.status(200).json({
            text: "delete Error Log",
        })
    
    } else {
        // Handle any other HTTP method
    }

}
