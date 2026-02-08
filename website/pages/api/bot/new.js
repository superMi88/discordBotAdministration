const { MongoClient, ConnectionClosedEvent } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

import log from '/lib/log';

import {sendDataToNodeProcess} from '/lib/api/discordNodeProcess'

export default async function handler(req, res) {

    if (req.method === 'POST') {


        const id = req.body.botId
        const token = req.body.token
        const ownerId = req.body.ownerId

        /* wird erstellt wenn der bot gestartet wird
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('botCollection');
        const insertResult = await collection.insertOne(
            { 
                id: id,
                username: null,
                discriminator: null,
                avatar: null,
                token: token
            }
        );
        */
        log.warning('erstelle neuen Bot')
        log.error('erstelle neuen Bot')
        log.info('erstelle neuen Bot')
        const response = await sendDataToNodeProcess('startNodeProcess',
            {
                id: id,
                token: token,
                ownerId: ownerId,
                projectAlias: req.body.projectAlias

            }
        );
        res.status(200).json(response)

    } else {
        // Handle any other HTTP method
    }

}