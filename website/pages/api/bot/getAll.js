import {database, databaseWebsite} from '/lib/database'
var ObjectId = require('mongodb').ObjectId; 

export default async function handler(req, res) {

    if (req.method === 'POST') {

        const projectAlias = req.body.projectAlias

        const dataDatabase =  await database(projectAlias, async function(db){
            return await db.collection('botCollection').find({}).toArray()
        })

        let data = []
        for (let i = 0; i < dataDatabase.length; i++) {

            const element = {
                id: dataDatabase[i].id,
                username: dataDatabase[i].username,
                discriminator: dataDatabase[i].discriminator,
                avatar: dataDatabase[i].avatar,
                ownerId: dataDatabase[i].ownerId
            }
            data.push(element)
        }
        
    
        res.status(200).json(data)
    
    } else {
        // Handle any other HTTP method
    }

}