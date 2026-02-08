const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { EmbedBuilder, Events } = require('discord.js');
var ObjectId = require('mongodb').ObjectId;

class Plugin {
	async execute(client, plugin) {

		plugin.on(client, Events.MessageCreate, async message => {

			if (!(message.interaction && message.interaction.commandName && message.interaction.commandName == "bump")) return;

			setTimeout( async() =>{

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setDescription("reminder")
					.setTitle("Bump-Reminder")
				

				let channel = await client.channels.cache.get(message.channelId)

				let messageX = await channel.send(
					{ 
						content: "<@"+message.interaction.user.id+">",
						embeds: [exampleEmbed] 
					})

			}, 1000 * 60 * 60 * 2);

			//message.interaction.commandname
		
			// if so then you can access the user who triggered the command with
			//message.interaction.user;

		})
		
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		return ({ saved: true, infoMessage: "Bump reminder erstellt", infoStatus: "Info" })
	}
};

module.exports = new Plugin();


function sleep(ms) {
	return new Promise((resolve) => {
	  setTimeout(resolve, ms);
	});
}
