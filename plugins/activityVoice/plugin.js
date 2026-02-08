
const dataManager = require("../../discordBot/lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');

let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../discordBot/lib/helper.js')
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');

const VariableManager = require("../../discordBot/lib/VariableManager.js");
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");


class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		if(!plugin.cronJob) plugin.cronJob = []
		plugin.cronJob.push(
			//einmal die minute
			new CronJob('0 * * * * *', async function () {

				const guild = await client.guilds.fetch(plugin['var'].server)
				let mapMember = guild.members.cache.filter(member => member.voice.channel)

				for (var [key, member] of mapMember.entries()) {

					let valid = false

					for (var [key2, member2] of mapMember.entries()) {

						//check if 2 different user are in the same voice channel AND are not the same user
						if(member.voice.channel.id == member2.voice.channel.id && member.id != member2.id){
							valid = true
						}
					}

					// nur zählen, wenn:
					// - mindestens 2 Leute im Channel
					// - der User nicht servergemutet oder selbst gemutet ist
					// - der User nicht deaf ist
					if (
						valid &&
						!member.voice.mute &&
						!member.voice.selfMute &&
						!member.voice.deaf &&
						!member.voice.selfDeaf
					) {
						await VariableManager.counterAdd(member.id, 1, plugin['var'].voiceActivity, db, plugin)
					}
				}
				
			}, null, true)
		)
		
	}
	async addEvents(plugin, eventsArray){
		
		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Trigger,
				variable: plugin['var'].voiceActivity,
				message: "löst den trigger aus voice"
			},
		)

	}
	async save(plugin, config) {
		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		await PluginManager.reloadEvents()

		return ({ saved: true, infoMessage: "Rolesystem geupdatet", infoStatus: "Info" })
	}

};

module.exports = new Plugin();



