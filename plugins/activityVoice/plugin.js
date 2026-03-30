
const dataManager = require("../../discordBot/lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');

const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');

const VariableManager = require("../../discordBot/lib/VariableManager.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");


class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		if(!plugin.cronJob) plugin.cronJob = []
		plugin.cronJob.push(
			//einmal die minute
			new CronJob('0 * * * * *', async function () {
				try {
					const serverId = plugin['var'].server;
					if (!serverId) return;

					const guild = await client.guilds.fetch(serverId).catch(() => null);
					if (!guild) return;

					// VoiceStates sind zuverlässiger als der Member-Cache
					const voiceStates = guild.voiceStates.cache;
					if (voiceStates.size === 0) return;

					// Alle Channel mit mehr als einer Person finden
					const channelCounts = {};
					voiceStates.forEach(vs => {
						if (vs.channelId) {
							channelCounts[vs.channelId] = (channelCounts[vs.channelId] || 0) + 1;
						}
					});

					for (const [memberId, vs] of voiceStates.entries()) {
						if (!vs.channelId || channelCounts[vs.channelId] < 2) continue;

						const member = vs.member || await guild.members.fetch(memberId).catch(() => null);
						if (!member || member.user.bot) continue;

						// nur zählen, wenn:
						// - nicht servergemuted oder selbst gemutet
						// - nicht deaf ist
						if (
							!vs.mute &&
							!vs.selfMute &&
							!vs.deaf &&
							!vs.selfDeaf
						) {
							await VariableManager.counterAdd(memberId, 1, plugin['var'].voiceActivity, db, plugin);
						}
					}
				} catch (err) {
					console.error("[ActivityVoice] Fehler im CronJob:", err);
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



