const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../discordBot/lib/dataManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
var ObjectId = require('mongodb').ObjectId;

class Plugin {
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
