import {database} from '/lib/database'
import { verifyJwtToken } from "/auth";

export default async function handler(req, res) {

    let currencyName = req.body.currencyName

    const jwt = await verifyJwtToken(req.cookies.jwt)

    //TODO change only to POST //true is for testing
    if (true) {

        res.status(200).json({
            text: "all currencys (getAll)",
            //returns true if created and false if not
            created: await database(req.body.projectAlias, async function(db){

                const result =  await db.collection('currency').insertOne(
                    { 
                        currencyName: currencyName,
                        ownerId: jwt.userId
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