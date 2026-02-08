const { MongoClient, ConnectionClosedEvent } = require('mongodb');

// Connection URL

import config from '@/config'

export async function database(databaseName, callback) {

    const client = new MongoClient(config.database.url);

    await client.connect()
    let db = null

    db = client.db(databaseName)

    let response = await callback(db)

    await client.close();
    
    return response
}

export async function databaseWebsite(callback) {

    const client = new MongoClient(config.database.url);

    await client.connect()
    const db = client.db(config.database.nameWebsite)
    let response = await callback(db)

    await client.close();
    
    return response
}


export function renameId(name){

    return (doc) => {
        doc[name] = doc._id;
        delete doc['_id'];
        return doc;
    }
}