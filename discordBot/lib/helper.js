const { ObjectId } = require("mongodb");
const log = require("./log.js");
const fs = require('fs');

let dataManager = require("./dataManager.js");

module.exports = {
    /*
    return
    {
        id: '648b80751c8ac65c644b5d3c',
        status: 'saved',
        welcomeRole: '991749048107278366',
        unsaved_welcomeRole: '991749048107278366'
    }
    */

    //unused and old
    /*
    async getPluginFromDatabase(db, pluginId) {

        var ObjectId = require('mongodb').ObjectId;
        const collection = db.collection('pluginCollection');

        let filteredDocs = await collection.findOne(
            { _id: ObjectId(pluginId) },
        );


        filteredDocs.get = (varName) => {
            return (filteredDocs["var_" + varName])
        }

        //sort each Array because it is unsorted
        for (const [key, value] of Object.entries(filteredDocs)) {
            if (Array.isArray(value)) {
                value.sort(function (a, b) {
                    var valueA, valueB;

                    valueA = a["order"]; // Where 1 is your index, from your example
                    valueB = b["order"];
                    if (valueA < valueB) {
                        return -1;
                    }
                    else if (valueA > valueB) {
                        return 1;
                    }
                    return 0;
                });
            }
        }


        let pluginNew = {}
        pluginNew.id = filteredDocs._id.toString()
        pluginNew.status = filteredDocs.status

        var requestx = require('../plugins/' + filteredDocs.pluginTag + '/plugin');
        const request = Object.create(requestx); //test über neues Object

        request.info.blocks.forEach(inputFieldDefinitionWrapper => {

            if (inputFieldDefinitionWrapper.type === "alone") {
                inputFieldDefinitionWrapper.fields.forEach(inputFieldDefinition => {
                    pluginNew[inputFieldDefinition.name] = filteredDocs["var_" + inputFieldDefinition.name]
                    //add unsaved var
                    pluginNew["unsaved_" + inputFieldDefinition.name] = filteredDocs["var_unsaved_" + inputFieldDefinition.name]
                });
            }

            if (inputFieldDefinitionWrapper.type === "iconAndText") {

                pluginNew[inputFieldDefinitionWrapper.name] = filteredDocs["var_" + inputFieldDefinitionWrapper.name]
                //add unsaved var
                inputFieldDefinitionWrapper.fields.forEach(inputFieldDefinition => {


                    if (!pluginNew[inputFieldDefinitionWrapper.name]) {
                        pluginNew[inputFieldDefinitionWrapper.name] = []
                    }

                    pluginNew[inputFieldDefinitionWrapper.name].forEach(pluginNewfield => {
                        if (!pluginNewfield[inputFieldDefinition.name]) {
                            pluginNewfield[inputFieldDefinition.name] = undefined
                        }
                    });
                });
            }
        });

        

        return {pluginNew, request};
    },
    */
    /*
    return
    {
        id: undefined,
        pluginTag: 'welcomeRole',
        welcomeRole: '991749048107278366',
        commands: [],
        setCommands: [Function (anonymous)],
        eventListener: [],
        on: [Function (anonymous)],
        off: [Function (anonymous)]
    }
    */

    async getUserCurrencyFromDatabase(discordId, db) {

        const collection = db.collection('userCollection');

        /*add User to Database if he doesnt exist yet*/
        let result = await collection.findOne({ discordId: discordId });

        if (!result) {
            result = await collection.insertOne(
                {
                    discordId: discordId
                }
            );
        }
        //to be sure currencyObjekt exist
        if (!result.currency) result.currency = {}

        return result.currency;
    },
    async getUserFromDatabase(discordId, db) {

        const collection = db.collection('userCollection');

        /*add User to Database if he doesnt exist yet*/
        let result = await collection.findOne({ discordId: discordId });

        if (!result) {
            result = await collection.insertOne(
                {
                    discordId: discordId
                }
            );
        }
        //to be sure currencyObjekt exist
        if (!result.currency) result.currency = {}

        return result;
    },
    async updateUserFromDatabase(db, discordId, updateObj) {

        const collection = db.collection('userCollection');

        const updatedDocs = await collection.findOneAndUpdate(
            {
                discordId: discordId
            },
            updateObj
        )

        return updatedDocs;
    },
    getRandomNumber(number) {
        return Math.floor(Math.random() * number)
    },

    async getPluginFromDatabase(pluginId) {

        if (!pluginId) { throw new Error("plugin Id is undefined") }


        let DatabaseManager = require("../lib/DatabaseManager.js");
        let db = DatabaseManager.get()

        var ObjectId = require('mongodb').ObjectId;
        const collection = db.collection('pluginCollection');

        let obj = await collection.findOne(
            { _id: new ObjectId(pluginId) },
        )

        //delete if exist //TODO delete before it even get saved like this save with id instead of _id
        if (obj && obj._id) {
            obj.id = obj._id.toString()
            delete obj['_id']
        }

        return obj

    },

    async getPluginFromDatabaseOrCacheIfExist(botId, pluginId) {

        if (!pluginId) { throw new Error("plugin Id is undefined") }
        if (!botId) { throw new Error("botId is undefined") }

        let obj = false

        let DatabaseManager = require("../lib/DatabaseManager.js");
        let db = DatabaseManager.get()


        var ObjectId = require('mongodb').ObjectId;
        const collection = db.collection('pluginCollection');


        objDatabase = await collection.findOne(
            { _id: new ObjectId(pluginId) },
        )

        try {
            if (fs.existsSync('./cache/bot-' + botId + '/plugin-' + pluginId + '.txt')) {
                const str = fs.readFileSync('./cache/bot-' + botId + '/plugin-' + pluginId + '.txt', 'utf8');

                objCache = JSON.parse(str);

                objCache.status = 'unsaved'
                if (objCache.var == objDatabase.var) {
                    objCache.status = 'saved'
                }

                //set obj as objDatabase but overwrite obj.var from cache
                obj = objDatabase
                obj.var = objCache

            } else {
                obj = objDatabase
            }
        } catch (err) {
            console.error(err)
        }

        //delete if exist //TODO delete before it even get saved like this save with id instead of _id
        if (obj && obj._id) {
            obj.id = obj._id.toString()
            delete obj['_id']
        }

        return obj

    },

    //returns Plugin From Database with Plugin Wrapper
    async getPluginFromBot(botId, db, client) {

        const collection = db.collection('pluginCollection');

        const plugins = await collection.find(
            { botId: botId },
        ).toArray()

        plugins.forEach(ele => {
            ele.id = ele._id.toString()
            delete ele['_id']
        })


        //add plugin wrapper for each plugin
        this.addWrapperForPlugins(plugins)


        //add commands from each plugin
        for (const plugin of plugins) {

            //move plugin logic from plugin.js into plugin
            plugin.logic = require('../plugins/' + plugin.pluginTag + '/plugin.js'); //test über neues Object

            //if plugin is saved run execute to start plugin
            if (plugin.status == "saved") {



                try {
                    await plugin.logic.execute(client, plugin, dataManager.projectAlias)//search for plugin config and add it to execute function
                } catch (e) {
                    console.log("ERROR: Plugin could not be loaded")
                    console.log(e)
                }

            }

        }

        return plugins;
    },

    async addWrapperForPlugins(plugins) {

        for (let plugin of plugins) {
            plugin = this.addWrapperForPlugin(plugin)
        }

        return plugins
    },
    addWrapperForPlugin(plugin) {

        plugin.commands = []

        if (!plugin['var']) {
            plugin['var'] = {}
        }

        plugin.setCommands = (slashCommandObjectArray) => {
            plugin.commands = slashCommandObjectArray
        }

        plugin.eventListener = []

        plugin.on = (client, eventName, eventFunction) => {
            client.on(eventName, eventFunction)
            plugin.eventListener.push({ eventName: eventName, eventFunction: eventFunction })
        }

        plugin.off = (client, eventName, eventFunction) => {
            client.off(eventName, eventFunction)
        }
        return plugin
    },



    async getPluginFromBotOne(pluginId, db) {

        const collection = db.collection('pluginCollection');

        const filteredDocs = await collection.findOne(
            { _id: new ObjectId(pluginId) },
        )

        filteredDocs.id = filteredDocs._id.toString()

        delete filteredDocs['_id']

        return filteredDocs;
    },

    //getPluginInfo and upload file for plugin if exist
    async getPluginInfo(bucketName, pluginTag, db) {

        const fs = require('fs')
        const path = "./plugins/" + pluginTag + "/plugin.png"

        if (fs.existsSync(path)) {

            let bucket = storage.bucket(bucketName)

            let sto = await storage.bucket(bucketName).getFiles()

            let findObj = sto[0].find(obj => obj.id === pluginTag + ".png")
            if (findObj) {
                return bucket.id + "/" + findObj.id
            } else {
                await bucketAddFile(bucketName, path)
                return "temp"
            }


        }
        return false

    },

    //add Commands to commandMap 
    addToCommandMap(commandMap, server, slashCommand) {

        let serverArray = commandMap.get(server)
        if (!Array.isArray(serverArray)) serverArray = []

        serverArray.push(slashCommand)

        commandMap.set(
            server,
            serverArray
        )
    }
}

const { Storage } = require('@google-cloud/storage');
const { DataManager } = require("discord.js");

const serviceKey = './../keys.json'



const storage = new Storage({
    keyFilename: serviceKey,
    public: true
});

//add imageto bucket filename + bucket
async function bucketAddFile(bucket, filename) {

    let result = await storage.bucket(bucket).upload(filename, { metadata: { cacheControl: 'public, max-age=no-store' } })
    return bucket + "/" + result[0].metadata.name
}

