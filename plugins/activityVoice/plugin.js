const dataManager = require("../../discordBot/lib/dataManager.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');
const VariableManager = require("../../discordBot/lib/VariableManager.js");
const DatabaseManager = require("../../lib/DatabaseManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");
const TimeStorage = require("../../lib/TimeStorage.js");

function getStorageFolderName(pluginId) {
	return `activityVoice-${pluginId}`;
}

class Plugin {
	/**
	 * Liefert den aggregierten Voice-Verlauf für einen bestimmten Nutzer über die letzten N Tage inkl. All-Time-Werten.
	 */
	async getActivityForUser(client, plugin, discordUserId, days = 14) {
		return await this.getVoiceHistory(plugin, days, discordUserId);
	}

	/**
	 * Liefert den aggregierten Voice-Verlauf für alle Nutzer über die letzten N Tage inkl. All-Time-Werten.
	 */
	async getAllActivity(client, plugin, days = 14) {
		return await this.getVoiceHistory(plugin, days, null);
	}

	/**
	 * Aggregiert die Daten aus TimeStorage und der Datenbank für Voice-Aktivität, All-Time-Werte, Partner und Top 10.
	 */
	async getVoiceHistory(plugin, days = 14, targetUserId = null) {
		const pluginId = plugin?.id || plugin;
		const folderName = getStorageFolderName(pluginId);
		const historyData = TimeStorage.loadHistory(folderName, days);
		const dateStrings = TimeStorage.getLastNDaysDateStrings(days);

		const db = DatabaseManager.get();
		const currencyId = plugin?.['var']?.voiceActivity || plugin?.var?.voiceActivity;

		let top10 = [];
		let allTimeMinutes = 0;
		let allTimeRank = null;

		if (db && currencyId) {
			try {
				const usersCollection = db.collection('userCollection');
				const currencyKey = `currencyData.${currencyId}`;

				const topDocs = await usersCollection
					.find({ [currencyKey]: { $gt: 0 } })
					.sort({ [currencyKey]: -1 })
					.limit(10)
					.toArray();

				top10 = topDocs.map((u, idx) => {
					const avatarUrl = u.avatar
						? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.webp`
						: 'https://cdn.discordapp.com/embed/avatars/0.png';

					return {
						rank: idx + 1,
						discordId: u.discordId,
						username: u.username || 'Nutzer',
						globalName: u.globalName || u.username || 'Nutzer',
						avatarUrl: avatarUrl,
						value: Math.floor(parseFloat(u.currencyData?.[currencyId] || 0))
					};
				});

				if (targetUserId) {
					const userDoc = await usersCollection.findOne({ discordId: targetUserId });
					allTimeMinutes = Math.floor(parseFloat(userDoc?.currencyData?.[currencyId] || 0));

					if (allTimeMinutes > 0) {
						allTimeRank = (await usersCollection.countDocuments({
							[currencyKey]: { $gt: allTimeMinutes }
						})) + 1;
					} else {
						const posCount = await usersCollection.countDocuments({ [currencyKey]: { $gt: 0 } });
						allTimeRank = posCount + 1;
					}
				}
			} catch (dbErr) {
				console.error("[ActivityVoice] Fehler beim Abrufen der DB All-Time Daten:", dbErr);
			}
		}

		if (targetUserId) {
			let totalMinutes = 0;
			const daily = [];
			const companionsMap = {};

			for (const dateStr of dateStrings) {
				const dayData = historyData[dateStr] || {};
				const userDay = dayData[targetUserId];
				const minutes = userDay ? (userDay.minutes || 0) : 0;
				totalMinutes += minutes;

				daily.push({
					date: dateStr,
					minutes: minutes
				});

				if (userDay && userDay.withUsers) {
					for (const [companionId, compMinutes] of Object.entries(userDay.withUsers)) {
						companionsMap[companionId] = (companionsMap[companionId] || 0) + compMinutes;
					}
				}
			}

			let withUsers = Object.entries(companionsMap)
				.map(([userId, minutes]) => ({ userId, minutes }))
				.sort((a, b) => b.minutes - a.minutes);

			if (db && withUsers.length > 0) {
				try {
					const companionIds = withUsers.map(u => u.userId);
					const compDocs = await db.collection('userCollection').find({ discordId: { $in: companionIds } }).toArray();
					const compMap = new Map(compDocs.map(d => [d.discordId, d]));

					withUsers = withUsers.map((comp, idx) => {
						const doc = compMap.get(comp.userId);
						const avatarUrl = doc?.avatar
							? `https://cdn.discordapp.com/avatars/${comp.userId}/${doc.avatar}.webp`
							: 'https://cdn.discordapp.com/embed/avatars/0.png';

						return {
							rank: idx + 1,
							userId: comp.userId,
							username: doc?.username || 'Discord-Nutzer',
							globalName: doc?.globalName || doc?.username || 'Discord-Nutzer',
							avatarUrl: avatarUrl,
							minutes: comp.minutes
						};
					});
				} catch (enrichErr) {
					console.error("[ActivityVoice] Fehler beim Anreichern der Partner-Profile:", enrichErr);
				}
			}

			return {
				success: true,
				pluginId,
				currencyId: currencyId || null,
				days,
				discordUserId: targetUserId,
				allTimeMinutes,
				allTimeRank,
				totalMinutes,
				daily,
				withUsers,
				companions: companionsMap,
				top10
			};
		}

		// Alle Nutzer aggregieren
		const usersAggregated = {};
		let grandTotalMinutes = 0;

		for (const dateStr of dateStrings) {
			const dayData = historyData[dateStr] || {};

			for (const [userId, userStats] of Object.entries(dayData)) {
				if (!usersAggregated[userId]) {
					usersAggregated[userId] = {
						userId,
						totalMinutes: 0,
						daily: {},
						companionsMap: {}
					};
				}

				const mins = userStats.minutes || 0;
				usersAggregated[userId].totalMinutes += mins;
				usersAggregated[userId].daily[dateStr] = (usersAggregated[userId].daily[dateStr] || 0) + mins;
				grandTotalMinutes += mins;

				if (userStats.withUsers) {
					for (const [companionId, compMins] of Object.entries(userStats.withUsers)) {
						usersAggregated[userId].companionsMap[companionId] =
							(usersAggregated[userId].companionsMap[companionId] || 0) + compMins;
					}
				}
			}
		}

		const ranking = Object.values(usersAggregated)
			.map(u => ({
				userId: u.userId,
				totalMinutes: u.totalMinutes,
				withUsers: Object.entries(u.companionsMap)
					.map(([id, minutes]) => ({ userId: id, minutes }))
					.sort((a, b) => b.minutes - a.minutes)
			}))
			.sort((a, b) => b.totalMinutes - a.totalMinutes);

		return {
			success: true,
			pluginId,
			currencyId: currencyId || null,
			days,
			grandTotalMinutes,
			ranking,
			top10,
			users: usersAggregated
		};
	}

	/**
	 * Speichert Sprachminuten und Partner für die anwesenden Personen eines Kanals ab.
	 */
	recordVoiceActivity(pluginId, participantUserIds) {
		if (!participantUserIds || !Array.isArray(participantUserIds) || participantUserIds.length === 0) {
			return;
		}

		const folderName = getStorageFolderName(pluginId);
		TimeStorage.updateDailyData(folderName, (dailyData) => {
			for (const userId of participantUserIds) {
				if (!dailyData[userId]) {
					dailyData[userId] = {
						minutes: 0,
						withUsers: {}
					};
				}

				dailyData[userId].minutes = (dailyData[userId].minutes || 0) + 1;

				if (!dailyData[userId].withUsers) {
					dailyData[userId].withUsers = {};
				}

				for (const otherUserId of participantUserIds) {
					if (otherUserId !== userId) {
						dailyData[userId].withUsers[otherUserId] =
							(dailyData[userId].withUsers[otherUserId] || 0) + 1;
					}
				}
			}
			return dailyData;
		});
	}

	async execute(client, plugin) {
		let db = DatabaseManager.get();
		const folderName = getStorageFolderName(plugin.id);

		// Initiale Bereinigung alter Dateien beim Start
		try {
			TimeStorage.cleanupOldFiles(folderName, 14);
		} catch (err) {
			console.error("[ActivityVoice] Initial cleanup error:", err);
		}

		if (!plugin.cronJob) plugin.cronJob = [];

		// Minütlicher CronJob zur Aktivitäts- und Partner-Erfassung
		plugin.cronJob.push(
			new CronJob('0 * * * * *', async () => {
				try {
					const serverId = plugin['var'].server;
					if (!serverId) return;

					const guild = await client.guilds.fetch(serverId).catch(() => null);
					if (!guild) return;

					const voiceStates = guild.voiceStates.cache;
					if (voiceStates.size === 0) return;

					// Aktive Teilnehmer nach Channel gruppieren
					const channelParticipants = {};

					for (const [memberId, vs] of voiceStates.entries()) {
						if (!vs.channelId) continue;

						if (vs.mute || vs.selfMute || vs.deaf || vs.selfDeaf) continue;

						const member = vs.member || await guild.members.fetch(memberId).catch(() => null);
						if (!member || member.user.bot) continue;

						if (!channelParticipants[vs.channelId]) {
							channelParticipants[vs.channelId] = [];
						}
						channelParticipants[vs.channelId].push(memberId);
					}

					// Nur Kanäle mit >= 2 aktiven Personen werten
					for (const [channelId, participants] of Object.entries(channelParticipants)) {
						if (participants.length < 2) continue;

						for (const memberId of participants) {
							await VariableManager.counterAdd(memberId, 1, plugin['var'].voiceActivity, db, plugin);
						}

						// Im tagesbasierten JSON-Storage ablegen (Minuten & Partner-Tracking)
						this.recordVoiceActivity(plugin.id, participants);
					}
				} catch (err) {
					console.error("[ActivityVoice] Fehler im CronJob:", err);
				}
			}, null, true)
		);

		// Täglicher Cronjob um 00:00 Uhr zur Bereinigung von Dateien älter als 14 Tage
		plugin.cronJob.push(
			new CronJob('0 0 0 * * *', async () => {
				try {
					TimeStorage.cleanupOldFiles(folderName, 14);
				} catch (err) {
					console.error("[ActivityVoice] Fehler im täglichen Cleanup-CronJob:", err);
				}
			}, null, true)
		);
	}

	async addEvents(plugin, eventsArray) {
		eventsArray.push({
			pluginId: plugin.id,
			pluginTag: plugin.pluginTag,
			type: VariableManager.Trigger,
			variable: plugin['var'].voiceActivity,
			message: "löst den trigger aus voice"
		});
	}

	async save(plugin, config) {
		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		await PluginManager.reloadEvents();

		return { saved: true, infoMessage: "Rolesystem geupdatet", infoStatus: "Info" };
	}
}

module.exports = new Plugin();
