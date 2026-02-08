import {database} from '@/lib/database'
var ObjectId = require('mongodb').ObjectId; 

export default async function handler(req, res) {

    let currencyId = req.body.currencyId
    
    //TODO change only to POST //true is for testing
    //TODO check if acknowledged is true wenn keine error oder wenn es kein error gb
    if (true) {

        res.status(200).json({
            text: "all currencys (getAll)",
            //returns true if deleted and false if not
            deleted: await database(req.body.projectAlias, async function(db){

                const result =  await db.collection('currency').deleteOne(
                    { 
                        _id: ObjectId(currencyId)
                    }
                );
                    
                if(result.acknowledged) return true
                return false
            })
        })
    
    } else {
        // Handle any other HTTP method
    }

}
