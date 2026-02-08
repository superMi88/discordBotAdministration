const helper = require("./helper.js");
var ObjectId = require('mongodb').ObjectId;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const log = require("./log.js");

//Jeder Bot hat einen eigenen EventManager
class PluginManager {

	//ToDO entferne db und packe es in ein DB manager
	db = undefined; 

    constructor() {
    }

	async create(projectAlias){
		const { MongoClient } = require('mongodb')
		const url = 'mongodb://localhost:27017'
		const mongoClient = new MongoClient(url)

		await mongoClient.connect();
		this.db = mongoClient.db(projectAlias);
	}

	async close(){
		
	}

	get(){
		if(!this.db) throw new Error('Datenbank wurde nochnicht erstellt')
		return this.db
	}

}

module.exports = new PluginManager();