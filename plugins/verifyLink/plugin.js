const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../discordBot/lib/dataManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");
const UserData = require("../../lib/UserData.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
var ObjectId = require('mongodb').ObjectId;

class Plugin {
	async verifyUser(client, plugin, discordUserId) {
		if (!client || !discordUserId) {
			return { success: false, error: 'Client oder Nutzer-ID fehlt.' };
		}

		const members = [];
		for (const guild of client.guilds.cache.values()) {
			try {
				const m = await guild.members.fetch(discordUserId);
				if (m) members.push(m);
			} catch (e) {
				// Member not in this guild
			}
		}

		if (members.length === 0) {
			return {
				success: false,
				error: 'Nutzer wurde auf dem Discord-Server nicht gefunden. Bitte tritt dem Server bei.'
			};
		}

		// Save verification status nested in pluginData.verifyLink-<pluginId>
		const userData = await UserData.get(discordUserId);
		const verifyObj = {
			verified: true,
			verifiedAt: new Date()
		};
		userData.setPluginData("verifyLink", plugin.id, verifyObj);
		await userData.save();

		// Trigger onUserVerified on all active plugins
		let pluginsSuccess = true;
		const allPlugins = PluginManager.getAll();
		for (const member of members) {
			if (allPlugins && allPlugins.length > 0) {
				for (const p of allPlugins) {
					if (p.logic && typeof p.logic.onUserVerified === 'function') {
						try {
							const pluginResult = await p.logic.onUserVerified(client, p, member);
							if (pluginResult === false) {
								pluginsSuccess = false;
							}
						} catch (pluginErr) {
							console.error(`[verifyLink] Fehler bei onUserVerified in Plugin ${p.name || p.id}:`, pluginErr);
							pluginsSuccess = false;
						}
					}
				}
			}
		}

		return {
			success: pluginsSuccess,
			verifiedUser: discordUserId,
			verificationData: verifyObj,
			error: pluginsSuccess ? null : 'Rollenvergabe im Discord fehlgeschlagen.'
		};
	}

	async getVerificationStatus(client, plugin, discordUserId) {
		if (!discordUserId) {
			return { success: false, error: 'Nutzer-ID fehlt.' };
		}
		const userData = await UserData.get(discordUserId);
		const verifyData = userData.getPluginData("verifyLink", plugin.id);
		return {
			success: true,
			verified: Boolean(verifyData && verifyData.verified),
			verifiedAt: verifyData ? verifyData.verifiedAt : null
		};
	}

	async execute(client, plugin) {
		// Executed on startup
	}

	async create(plugin, config) {
		let client = dataManager.client;
		let db = DatabaseManager.get();

		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		// Delete old message if exists
		await deleteMessage(client, plugin, db);

		const channelId = plugin['var']?.channelVerify;
		if (!channelId) {
			return ({ saved: false, infoMessage: "Kein Channel ausgewählt.", infoStatus: "Error" });
		}

		const channel = await client.channels.fetch(channelId).catch(() => null);
		if (!channel) {
			return ({ saved: false, infoMessage: "Channel konnte nicht gefunden werden.", infoStatus: "Error" });
		}

		const title = plugin['var']?.title || "Verifizierung";
		const description = plugin['var']?.description || "Klicke auf den Button unten, um dich zu verifizieren.";
		const buttonLabel = plugin['var']?.buttonLabel || "Jetzt verifizieren";
		const buttonUrl = plugin['var']?.buttonUrl || "http://localhost:3002/dashboard";
		const buttonEmoji = plugin['var']?.buttonEmoji;

		const embed = new EmbedBuilder()
			.setColor('#3960a7')
			.setTitle(title)
			.setDescription(description);

		const button = new ButtonBuilder()
			.setLabel(buttonLabel)
			.setURL(buttonUrl)
			.setStyle(ButtonStyle.Link);

		if (buttonEmoji && buttonEmoji.trim().length > 0) {
			button.setEmoji(buttonEmoji.trim());
		}

		const row = new ActionRowBuilder().addComponents(button);

		const message = await channel.send({
			embeds: [embed],
			components: [row]
		}).catch(err => {
			console.error("[verifyLink] Fehler beim Senden der Nachricht:", err);
			return null;
		});

		if (message) {
			await saveMessageInfo(db, plugin.id, channel.id, message.id);
			return ({ saved: true, infoMessage: "Verifizierungs-Nachricht erfolgreich erstellt!", infoStatus: "Info" });
		} else {
			return ({ saved: false, infoMessage: "Nachricht konnte nicht gesendet werden.", infoStatus: "Error" });
		}
	}

	async migrateOldVerifications(plugin, config, projectAlias) {
		const db = DatabaseManager.get();
		if (!db) {
			return ({ saved: false, infoMessage: "Datenbankverbindung nicht verfügbar.", infoStatus: "Error" });
		}

		const pluginId = plugin.id || plugin._id;
		if (!pluginId) {
			return ({ saved: false, infoMessage: "Plugin-ID nicht gefunden.", infoStatus: "Error" });
		}

		const collection = db.collection('userCollection');

		// Alle User suchen, die noch alte 'verified'-Felder haben
		const usersToMigrate = await collection.find({
			$or: [
				{ verified: true },
				{ verified: false },
				{ verified: { $exists: true } },
				{ verifiedAt: { $exists: true } }
			]
		}).toArray();

		if (!usersToMigrate || usersToMigrate.length === 0) {
			return ({
				saved: true,
				infoMessage: "Keine alten übergeordneten Verifizierungen gefunden. Alles bereits aktuell.",
				infoStatus: "Info"
			});
		}

		let migratedCount = 0;
		const pluginDataKey = `pluginData.verifyLink-${pluginId}`;

		for (const user of usersToMigrate) {
			const isVerified = user.verified === true;
			const verifiedAt = user.verifiedAt || new Date();

			const verifyObj = {
				verified: isVerified,
				verifiedAt: verifiedAt
			};

			await collection.updateOne(
				{ _id: user._id },
				{
					$set: {
						[pluginDataKey]: verifyObj
					},
					$unset: {
						verified: "",
						verifiedAt: ""
					}
				}
			);
			migratedCount++;
		}

		console.log(`[verifyLink] ${migratedCount} alte Verifizierungen erfolgreich in ${pluginDataKey} übertragen.`);

		return ({
			saved: true,
			infoMessage: `${migratedCount} Verifizierung(en) erfolgreich in pluginData.verifyLink-${pluginId} übernommen und alte Felder gelöscht!`,
			infoStatus: "Info"
		});
	}

	async delete(plugin, config) {
		let db = DatabaseManager.get();
		let client = dataManager.client;

		await deleteMessage(client, plugin, db);
		return ({ saved: true, infoMessage: "Verifizierungs-Nachricht gelöscht", infoStatus: "Info" });
	}

	async save(plugin, config) {
		return await this.create(plugin, config);
	}
}

module.exports = new Plugin();

async function deleteMessage(client, plugin, db) {
	const { channelId, messageId } = await getMessageInfo(db, plugin.id);

	if (channelId && messageId) {
		try {
			const channel = await client.channels.fetch(channelId).catch(() => null);
			if (channel) {
				const message = await channel.messages.fetch(messageId).catch(() => null);
				if (message) {
					await message.delete().catch(() => null);
				}
			}
		} catch (error) {
			console.error("[verifyLink] Error deleting old message:", error);
		}
		await saveMessageInfo(db, plugin.id, '', '');
	}
}

async function saveMessageInfo(db, pluginId, channelId, messageId) {
	const collection = db.collection('pluginCollection');
	await collection.updateOne(
		{ _id: ObjectId(pluginId) },
		{
			$set: {
				channelId: channelId,
				messageId: messageId
			}
		}
	);
}

async function getMessageInfo(db, pluginId) {
	const collection = db.collection('pluginCollection');
	const doc = await collection.findOne({ _id: ObjectId(pluginId) });
	return {
		channelId: doc?.channelId || '',
		messageId: doc?.messageId || ''
	};
}
