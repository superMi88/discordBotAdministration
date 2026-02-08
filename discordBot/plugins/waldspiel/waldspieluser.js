//const dataManager = require("../../lib/dataManager.js")
//const Animallist = require("./animals.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
const helper = require('../../lib/helper.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../lib/helper.js')

const { ObjectId } = require("mongodb");

const PluginManager = require("../../lib/PluginManager.js");

const System = require("../../lib/system.js");

//custom Id handling
const CustomId = require('../../lib/CustomId.js');
const ImageCreator = require("./imageCreator.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");

const waldspiel = require("./lib/waldspiel.js");

const VariableManager = require("../../lib/VariableManager.js");

const statusCode = require("./statusCode.js");
const backgrounds = require('./backgrounds.js');



class WaldspielUser {

	discordUserId = 'discordUserId' 

	db = ""; //database obj

	//call the getDiscordUserDatabase function to get this variable
	discordUserDatabase = false;


	constructor(discordUserId) {

		this.discordUserId = discordUserId;

		this.db = DatabaseManager.get()

		console.log("created waldspieluser")

	}

	async getDiscordUserDatabase(){
		
		if(!this.discordUserDatabase){
			this.discordUserDatabase = await getUserCurrencyFromDatabase(this.discordUserId, this.db)
		}else{
		}
        return this.discordUserDatabase;
    }
	
	async getItemlist(){
		let discordUserDatabase = await this.getDiscordUserDatabase()

        let itemlist = discordUserDatabase.itemlist
		if (!itemlist) itemlist = []

		return itemlist
    }

	async getBackgroundlist(){
		let discordUserDatabase = await this.getDiscordUserDatabase()

        let backgroundlist = discordUserDatabase.backgroundlist
		if (!backgroundlist) backgroundlist = []

		return backgroundlist
    }

	async getCurrencyCount(currencyId){
		let discordUserDatabase = await this.getDiscordUserDatabase()

        let currencyCount = discordUserDatabase[currencyId]
		if (!currencyCount) currencyCount = 0

		return currencyCount
    }
	
	async buyItem(itemId, price, currencyId){

		let itemlist = await this.getItemlist()
		let currencyCount = await this.getCurrencyCount(currencyId)

		if (itemlist.includes(itemId)) {
			return {
				statusCode: statusCode.ALREADY_HAS_ITEM,
			}
		} 
		
		if (currencyCount < price) {
			return {
				statusCode: statusCode.NOT_ENOUGH_MONEY,
				currencyCount: currencyCount
			}
		} 

		itemlist.push(itemId)
		await updateUserFromDatabase(this.db, this.discordUserId, {
				
			$set: {
				//["currency." + currencyId]: currencyCount - price,
				["currency." + "itemlist"]: itemlist,
			},
			$inc: {
				["currency." + currencyId]: parseInt(price)*-1
			}
		})
		return {
			statusCode: statusCode.SUCCESS
		}
	}

	async buyBackground(backgroundId, price, currencyId){

		let backgroundlist = await this.getBackgroundlist()
		let currencyCount = await this.getCurrencyCount(currencyId)

		if (backgroundlist.includes(backgroundId)) {
			return {
				statusCode: statusCode.ALREADY_HAS_ITEM,
			}
		} 
		
		if (currencyCount < price) {
			return {
				statusCode: statusCode.NOT_ENOUGH_MONEY,
				currencyCount: currencyCount
			}
		} 

		backgroundlist.push(backgroundId)
		await updateUserFromDatabase(this.db, this.discordUserId, {
				
			$set: {
				//["currency." + currencyId]: currencyCount - price,
				["currency." + "backgroundlist"]: backgroundlist,
			},
			$inc: {
				["currency." + currencyId]: parseInt(price)*-1
			}
		})
		return {
			statusCode: statusCode.SUCCESS
		}
	}



};

module.exports = WaldspielUser




