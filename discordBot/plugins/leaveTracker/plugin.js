
const dataManager = require("../../lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;

const { ChannelType } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { EmbedBuilder, Events } = require('discord.js');
const DatabaseManager = require("../../lib/DatabaseManager.js");
const PluginManager = require("../../lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()
		
		plugin.on(client, Events.GuildMemberRemove , async member => {

			try {

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setTitle("Leave-Tracker")
					.setDescription(`Der User <@${member.user.id}> [${member.user.username}] ist vom Server gegangen`)
				await client.channels.cache.get(plugin['var'].logChannel).send({ embeds: [exampleEmbed] })

			} catch (err) {
				console.log("OnGuildMemberRemove Error:", err)
			}
	
		});
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		return ({ saved: true, infoMessage: "Informationen gespeichert", infoStatus: "Info" })
	}
};
module.exports = new Plugin();