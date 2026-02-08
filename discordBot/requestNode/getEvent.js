

/*
    wird aufgerufen wenn auf der webseite die currencys angezeigt werden und die entsprechenden events 
    geladen werden müssen. Schickt an den Main prozess wo der EventManager läuft eine anfrage zu den Events
    für den Bot und schickt diese dann wieder an den next.js prozess der die Api anfrage bearbeitet und zurückschickt
*/
var ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require('mongodb');
const log = require('../lib/log');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

module.exports = {
	async execute(ipc, data, socket) {

        await client.connect();
        const db = client.db(data.data.database);
        const pluginCollection = db.collection('pluginCollection');

        const EventManager = require("../libIndex/eventManager.js");
        let botIdWithEvents = await EventManager.getEvent(db)

        let currencyArray = await db.collection('currency').find({}).map(renameId("currencyId")).toArray();

        
        for (let a = 0; a < currencyArray.length; a++) {
            const currencObj = currencyArray[a];

            currencObj.events = []

            
            //fsds

            for (const [botId, eventArray] of Object.entries(botIdWithEvents)) {
                
                

                for(let eventObj of eventArray){

                    eventObj.botId = botId

                    let botdata = await db.collection('botCollection').findOne({id: botId})

                    if(botdata){
                        eventObj.avatar = botdata.avatar
                        eventObj.botname = botdata.username
                    }
                    
                    
                    if(eventObj.variable == currencObj.currencyId){
                        currencObj.events.push(eventObj)
                    }
                }


    
                
            }

            //+++

            /*
            if(events[currencObj.currencyId]) {


                for (const [botId, pluginArray] of Object.entries(events[currencObj.currencyId])) {

                    for (let i = 0; i < pluginArray.length; i++) {
                        const pluginSmallObj = pluginArray[i];

                        currencObj.events.push({
                            pluginId: pluginSmallObj.pluginId,
                            infoMessage: pluginSmallObj.infoMessage
                        })
                    }

                    
                }


            }*/
            
        }

        client.close()

        ipc.server.emit(
            socket,
           'NodeProcessResponse',
            {
                message: "events",
                data: currencyArray
            }
        );

        return true
    
	}
};


function renameId(name){

    return (doc) => {
        doc[name] = doc._id;
        delete doc['_id'];
        return doc;
    }
}