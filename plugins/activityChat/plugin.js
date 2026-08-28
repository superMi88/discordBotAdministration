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
	return `activityChat-${pluginId}`;
}

class Plugin {
	/**
	 * Liefert den aggregierten Chat-Verlauf für einen bestimmten Nutzer über die letzten N Tage inkl. All-Time-Werten.
	 */
	async getActivityForUser(client, plugin, discordUserId, days = 14) {
		return await this.getChatHistory(plugin, days, discordUserId);
	}

	/**
	 * Liefert den aggregierten Chat-Verlauf für alle Nutzer über die letzten N Tage inkl. All-Time-Werten.
	 */
	async getAllActivity(client, plugin, days = 14) {
		return await this.getChatHistory(plugin, days, null);
	}

	/**
	 * Aggregiert die Daten aus TimeStorage und der Datenbank für Chat-Nachrichten, All-Time-Werte und Top 10.
	 */
	async getChatHistory(plugin, days = 14, targetUserId = null) {
		const pluginId = plugin?.id || plugin;
		const folderName = getStorageFolderName(pluginId);
		const historyData = TimeStorage.loadHistory(folderName, days);
		const dateStrings = TimeStorage.getLastNDaysDateStrings(days);

		const db = DatabaseManager.get();
		const currencyId = plugin?.['var']?.chatActivity || plugin?.var?.chatActivity;

		let top10 = [];
		let allTimeMessages = 0;
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
					allTimeMessages = Math.floor(parseFloat(userDoc?.currencyData?.[currencyId] || 0));

					if (allTimeMessages > 0) {
						allTimeRank = (await usersCollection.countDocuments({
							[currencyKey]: { $gt: allTimeMessages }
						})) + 1;
					} else {
						const posCount = await usersCollection.countDocuments({ [currencyKey]: { $gt: 0 } });
						allTimeRank = posCount + 1;
					}
				}
			} catch (dbErr) {
				console.error("[ActivityChat] Fehler beim Abrufen der DB All-Time Daten:", dbErr);
			}
		}

		if (targetUserId) {
			let totalMessages = 0;
			const daily = [];

			for (const dateStr of dateStrings) {
				const dayData = historyData[dateStr] || {};
				const userDay = dayData[targetUserId];
				const messages = userDay ? (userDay.messages || 0) : 0;
				totalMessages += messages;

				daily.push({
					date: dateStr,
					messages: messages
				});
			}

			return {
				success: true,
				pluginId,
				currencyId: currencyId || null,
				days,
				discordUserId: targetUserId,
				allTimeMessages,
				allTimeRank,
				totalMessages,
				daily,
				top10
			};
		}

		// Alle Nutzer aggregieren
		const usersAggregated = {};
		let grandTotalMessages = 0;

		for (const dateStr of dateStrings) {
			const dayData = historyData[dateStr] || {};

			for (const [userId, userStats] of Object.entries(dayData)) {
				if (!usersAggregated[userId]) {
					usersAggregated[userId] = {
						userId,
						totalMessages: 0,
						daily: {}
					};
				}

				const msgs = userStats.messages || 0;
				usersAggregated[userId].totalMessages += msgs;
				usersAggregated[userId].daily[dateStr] = (usersAggregated[userId].daily[dateStr] || 0) + msgs;
				grandTotalMessages += msgs;
			}
		}

		const ranking = Object.values(usersAggregated)
			.map(u => ({
				userId: u.userId,
				totalMessages: u.totalMessages
			}))
			.sort((a, b) => b.totalMessages - a.totalMessages);

		return {
			success: true,
			pluginId,
			currencyId: currencyId || null,
			days,
			grandTotalMessages,
			ranking,
			top10,
			users: usersAggregated
		};
	}

	/**
	 * Speichert die Nachrichtenanzahl für einen Nutzer im Tages-JSON ab.
	 */
	recordChatActivity(pluginId, userId, count = 1) {
		if (!userId) return;

		const folderName = getStorageFolderName(pluginId);
		TimeStorage.updateDailyData(folderName, (dailyData) => {
			if (!dailyData[userId]) {
				dailyData[userId] = {
					messages: 0
				};
			}

			dailyData[userId].messages = (dailyData[userId].messages || 0) + count;
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
			console.error("[ActivityChat] Initial cleanup error:", err);
		}

		if (!plugin.cronJob) plugin.cronJob = [];

		// Täglicher Cronjob um 00:00 Uhr zur Bereinigung von Dateien älter als 14 Tage
		plugin.cronJob.push(
			new CronJob('0 0 0 * * *', async () => {
				try {
					TimeStorage.cleanupOldFiles(folderName, 14);
				} catch (err) {
					console.error("[ActivityChat] Fehler im täglichen Cleanup-CronJob:", err);
				}
			}, null, true)
		);

		plugin.on(client, Events.MessageCreate, async interaction => {
			// Keine Bot-Interaktionen
			if (interaction.author.bot) return;

			// Server prüfen, falls konfiguriert
			const serverId = plugin['var'] && plugin['var'].server;
			if (serverId && interaction.guildId && interaction.guildId !== serverId) {
				return;
			}

			await VariableManager.counterAdd(interaction.author.id, 1, plugin['var'].chatActivity, db, plugin);

			// Im tagesbasierten JSON-Storage ablegen
			this.recordChatActivity(plugin.id, interaction.author.id, 1);
		});
	}

	async addEvents(plugin, eventsArray) {
		eventsArray.push({
			pluginId: plugin.id,
			pluginTag: plugin.pluginTag,
			type: VariableManager.Trigger,
			variable: plugin['var'].chatActivity,
			message: "löst den trigger aus Chat"
		});
	}

	async save(plugin, config) {
		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		await PluginManager.reloadEvents();

		return { saved: true, infoMessage: "Gespeichert", infoStatus: "Info" };
	}
}

module.exports = new Plugin();
