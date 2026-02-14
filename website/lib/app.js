import config from '../config';

const { MongoClient } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'TestDatenbank';

export async function test(discordId) {
  // Use connect method to connect to the server
  await client.connect();
  const db = client.db(dbName);
  const userCollection = db.collection('userCollection');

  const findResult = await userCollection.find({}).toArray();

  const filteredDocs = await userCollection.find({ discordId: discordId }).toArray();
  if (!filteredDocs.length) {
    const insertResult = await userCollection.insertOne({ discordId: discordId });
  }
  await client.close();
  return 'done.';
}


export async function getWebsiteUser(databaseName, discordId) {

  console.log(`[getWebsiteUser] Connecting to DB: ${databaseName} with discordId: ${discordId}`);

  if (!databaseName) {
    console.error("[getWebsiteUser] databaseName is missing!");
  }

  await client.connect();
  const db = client.db(databaseName);
  // collection websiteUser war alt, userWebsite neu
  const userCollection = db.collection('userWebsite');

  const filteredDocs = await userCollection.findOne({ discordId: discordId });

  if (!filteredDocs) {
    console.warn(`[getWebsiteUser] No user found in ${databaseName}.userWebsite for ${discordId}`);
  } else {
    console.log(`[getWebsiteUser] User found: ${filteredDocs.username || filteredDocs.discordId}`);
  }

  await client.close();
  return filteredDocs;
}


export async function createNewWebsiteUser(databaseName, discordId) {

  await client.connect();
  const db = client.db(databaseName);
  const userCollection = db.collection('userWebsite');

  //Sicherheitsabfrage collection sollte empty sein
  const isCollectionEmpty = !Boolean(await userCollection.find({}).limit(1).count())

  //Wenn Collection nicht Empty ist exestiert schon ein admin und das setup wird abgebrochen
  if (!isCollectionEmpty) {
    await client.close();
    return { login: false }
  }

  const filteredDocs = await userCollection.insertOne(
    {
      discordId: discordId,
      admin: true
    }
  );

  if (filteredDocs.acknowledged === true) {
    await client.close();
    return {
      login: true,
    }
  }
  await client.close();
  return { login: false }
}






export async function getAllUser(databaseName, requestBody) {
  const { MongoClient } = require('mongodb');
  const url = 'mongodb://localhost:27017';
  const mongoClient = new MongoClient(url);

  // Use connect method to connect to the server
  await mongoClient.connect();
  const db = mongoClient.db(databaseName);
  const userCollection = db.collection('userCollection');


  requestBody.selectedServer

  let filteredDocs = null
  console.log("searchName")
  console.log(requestBody.searchName)
  let searchName = requestBody.searchName
  console.log(/^searchName/)
  console.log(requestBody.selectedServer)


  let searchObj = {}
  if (requestBody.searchName || requestBody.selectedServer) {
    searchObj = { $and: [] }
  }


  if (requestBody.searchName) {
    searchObj.$and.push(
      {
        $or: [
          {
            "username": new RegExp(requestBody.searchName, 'i')
          },
          {
            "discriminator": new RegExp(requestBody.searchName, 'i')
          },
          {
            "discordId": new RegExp(requestBody.searchName, 'i')
          }
        ]
      }
    )
  }

  if (requestBody.selectedServer) {
    searchObj.$and.push(
      {
        guilds: {
          $elemMatch:
            { guildId: requestBody.selectedServer, onServer: true }
        }
      }
    )
  }

  filteredDocs = await userCollection.find(searchObj).toArray();

  await mongoClient.close();
  return filteredDocs;
}

export async function getUser(databaseName, id) {
  // Use connect method to connect to the server
  await client.connect();
  const db = client.db(databaseName);
  const userCollection = db.collection('userCollection');

  const filteredDocs = await userCollection.findOne({ discordId: id });
  await client.close();
  return filteredDocs;
}



export async function getLiaDaten(databaseName, id) {

  await client.connect();
  const db = client.db(databaseName);
  const userCollection = db.collection('botCollection');

  const filteredDocs = await userCollection.findOne({ id: id });
  await client.close();
  return filteredDocs;
}

export async function updateUser(databaseName, discordId, field, value) {
  await client.connect();
  const db = client.db(databaseName);
  const userCollection = db.collection('userCollection');

  const updateResult = await userCollection.updateOne({ discordId: discordId }, { $set: { [field]: value } });
  await client.close();
  return 'done.';
}

const { Storage } = require('@google-cloud/storage');

const serviceKey = '../../keys.json'



const storage = new Storage({
  keyFilename: serviceKey,
  public: true
});

//add imageto bucket filename + bucket
async function bucketAddFile(bucket, filename) {

  let result = await storage.bucket(bucket).upload(filename, { metadata: { cacheControl: 'public, max-age=31536000' } })
  return bucket + "/" + result[0].metadata.name
}

//delete image from bucket
async function bucketDeleteFile(image) {

  const { bucket, filename } = splitImage(image)
  storage.bucket(bucket).deleteFiles({ prefix: filename });
}

//split image into bucket and filename
function splitImage(image) {
  const parts = image.split("/") //bucket / name
  return { bucket: parts[0], filename: parts[1] }
}