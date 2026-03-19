//const dataManager = require("../../discordBot/lib/dataManager.js")
//const Animallist = require("./animals.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
const helper = require('../../discordBot/lib/helper.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
const { ObjectId } = require("mongodb");

const PluginManager = require("../../discordBot/lib/PluginManager.js");

const System = require("../../discordBot/lib/system.js");

//custom Id handling
const CustomId = require('../../discordBot/lib/CustomId.js');
const ImageCreator = require("./imageCreator.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");

const waldspiel = require("./lib/waldspiel.js");

const VariableManager = require("../../discordBot/lib/VariableManager.js");

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
        const UserData = require("../../lib/UserData.js");
		if(!this.discordUserDatabase){
			this.discordUserDatabase = await UserData.get(this.discordUserId);
		}
        return this.discordUserDatabase;
    }
	
	async getItemlist(plugin){
		let discordUserDatabase = await this.getDiscordUserDatabase()
        let itemlist = discordUserDatabase.getPluginData(plugin, 'itemlist') ?? discordUserDatabase.currencyData.itemlist;
		if (!itemlist) itemlist = []
		return itemlist
    }

	async getBackgroundlist(plugin){
		let discordUserDatabase = await this.getDiscordUserDatabase()
        let backgroundlist = discordUserDatabase.getPluginData(plugin, 'backgroundlist') ?? discordUserDatabase.currencyData.backgroundlist;
		if (!backgroundlist) backgroundlist = []
		return backgroundlist
    }

	async getCurrencyCount(currencyId){
		let discordUserDatabase = await this.getDiscordUserDatabase()
        let currencyCount = discordUserDatabase.getCurrency(currencyId)
		if (!currencyCount) currencyCount = 0
		return currencyCount
    }
	
	async buyItem(itemId, price, currencyId, plugin){
		let itemlist = await this.getItemlist(plugin)
		let currencyCount = await this.getCurrencyCount(currencyId)

		if (itemlist.includes(itemId)) {
			return { statusCode: statusCode.ALREADY_HAS_ITEM }
		} 
		
		if (currencyCount < price) {
			return { statusCode: statusCode.NOT_ENOUGH_MONEY, currencyCount: currencyCount }
		} 

		itemlist.push(itemId)
        
        let discordUserDatabase = await this.getDiscordUserDatabase()
        discordUserDatabase.setPluginData(plugin, 'itemlist', itemlist);
        discordUserDatabase.removeCurrency(currencyId, parseInt(price));
        await discordUserDatabase.save(plugin);

		return { statusCode: statusCode.SUCCESS }
	}

	async buyBackground(backgroundId, price, currencyId, plugin){
		let backgroundlist = await this.getBackgroundlist(plugin)
		let currencyCount = await this.getCurrencyCount(currencyId)

		if (backgroundlist.includes(backgroundId)) {
			return { statusCode: statusCode.ALREADY_HAS_ITEM }
		} 
		
		if (currencyCount < price) {
			return { statusCode: statusCode.NOT_ENOUGH_MONEY, currencyCount: currencyCount }
		} 

		backgroundlist.push(backgroundId)
        
        let discordUserDatabase = await this.getDiscordUserDatabase()
        discordUserDatabase.setPluginData(plugin, 'backgroundlist', backgroundlist);
        discordUserDatabase.removeCurrency(currencyId, parseInt(price));
        await discordUserDatabase.save(plugin);

		return { statusCode: statusCode.SUCCESS }
	}
};

module.exports = WaldspielUser




