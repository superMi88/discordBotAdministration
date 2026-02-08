import {database} from '/lib/database'
var ObjectId = require('mongodb').ObjectId; 

export default async function handler(req, res) {
    
    //TODO change only to POST //true is for testing
    //TODO check if acknowledged is true wenn keine error oder wenn es kein error gb
    if (true) {

        const result = await database(req.body.projectAlias, async function(db){

            const resu = await db.collection('log').find({}).sort( { timestamp : -1 } ).toArray();

            return resu
        })

        /*
        const fs = require('fs');

        let data = ""

        try {
            data = fs.readFileSync('./../logs/error.log', 'utf8');
        } catch (err) {
            //console.error(err);
            data = ""
        }
        */


        res.status(200).json({
            text: "get Error Log",
            //error log data
            data: result
        })
    
    } else {
        // Handle any other HTTP method
    }

}
