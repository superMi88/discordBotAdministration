const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../discordBot/lib/dataManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const { EmbedBuilder } = require('discord.js');
var ObjectId = require('mongodb').ObjectId;

function shouldSendEmbed(pluginVar) {
	if (!pluginVar) return false;
	const hasTitle = Boolean(pluginVar.title && pluginVar.title.trim());
	const hasDesc = Boolean(pluginVar.description && pluginVar.description.trim());
	return hasTitle || hasDesc;
}

function buildPingContent(pluginVar) {
	let pingContent = "";
	if (pluginVar && pluginVar.announcementRoles && Array.isArray(pluginVar.announcementRoles)) {
		pluginVar.announcementRoles.forEach(role => {
			if (role.roleId) {
				pingContent += `<@&${role.roleId}> `;
			}
		});
		if (pingContent.length > 0) pingContent += "\n";
	}
	return pingContent;
}

class Plugin {
	async execute(client, plugin) {
		// Nichts aktiv erforderlich beim Bot-Start
	}

	async getMessageText(plugin) {
		const exampleEmbed = new EmbedBuilder().setColor('#0099ff');
		const title = plugin['var']?.title ? plugin['var'].title.trim() : "";
		const description = plugin['var']?.description ? plugin['var'].description.trim() : "";

		if (title) {
			exampleEmbed.setTitle(title);
		}
		if (description) {
			exampleEmbed.setDescription(description);
		}

		return exampleEmbed;
	}

	async getfollowUpMessageText(plugin) {
		return plugin['var']?.followupMessage || "";
	}

	async create(plugin, config) {
		let client = dataManager.client;
		let db = DatabaseManager.get();

		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		// Vorherige Nachrichten löschen, falls vorhanden
		await deleteMessage(client, plugin, db);

		const sendEmbed = shouldSendEmbed(plugin['var']);
		const followUpMessageText = await this.getfollowUpMessageText(plugin);
		const pingContent = buildPingContent(plugin['var']);

		if (!plugin['var'].channel1) {
			return { saved: false, infoMessage: "Bitte wähle einen Channel aus", infoStatus: "Error" };
		}

		if (!sendEmbed && (!followUpMessageText || !followUpMessageText.trim()) && !pingContent.trim()) {
			return { saved: false, infoMessage: "Bitte gib entweder ein Embed oder einen Anhang an", infoStatus: "Error" };
		}

		let channel = await client.channels.fetch(plugin['var'].channel1).catch(() => null);
		if (!channel || !channel.send) {
			return { saved: false, infoMessage: "Channel konnte nicht gefunden werden", infoStatus: "Error" };
		}

		if (sendEmbed) {
			let messageText = await this.getMessageText(plugin);
			let embedMessage = await channel.send({
				content: pingContent.trim() ? pingContent : undefined,
				embeds: [messageText]
			});

			let followUpMessageId = '';
			if (followUpMessageText && followUpMessageText.trim()) {
				let followUpMessage = await channel.send({
					content: followUpMessageText
				});
				followUpMessageId = followUpMessage.id;
			}

			await saveMessage(db, plugin.id, channel.id, embedMessage.id, followUpMessageId);
		} else {
			// Nur Anhang senden (ohne Embed)
			let content = pingContent ? `${pingContent}${followUpMessageText}` : followUpMessageText;
			let followUpMessage = await channel.send({
				content: content
			});

			await saveMessage(db, plugin.id, channel.id, '', followUpMessage.id);
		}

		return { saved: true, infoMessage: "Announcement wurde gesendet", infoStatus: "Info" };
	}

	async update(plugin, config) {
		let client = dataManager.client;
		let db = DatabaseManager.get();

		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		const sendEmbed = shouldSendEmbed(plugin['var']);
		const followUpMessageText = await this.getfollowUpMessageText(plugin);
		const pingContent = buildPingContent(plugin['var']);

		if (!plugin['var'].channel1) {
			return { saved: false, infoMessage: "Bitte wähle einen Channel aus", infoStatus: "Error" };
		}

		if (!sendEmbed && (!followUpMessageText || !followUpMessageText.trim()) && !pingContent.trim()) {
			return { saved: false, infoMessage: "Bitte gib entweder ein Embed oder einen Anhang an", infoStatus: "Error" };
		}

		const { channelId, messageId, followUpMessageId } = await getMessageId(db, plugin.id);

		// Falls der Channel geändert wurde oder noch keine Nachrichten existieren, lösche alte und sende neu
		if (channelId && channelId !== plugin['var'].channel1) {
			await deleteMessage(client, plugin, db);
			return await this.create(plugin, config);
		}

		let targetChannelId = channelId || plugin['var'].channel1;
		let channel = await client.channels.fetch(targetChannelId).catch(() => null);
		if (!channel) {
			return { saved: false, infoMessage: "Channel konnte nicht gefunden werden", infoStatus: "Error" };
		}

		// Vorhandene Nachrichten auf Discord abrufen
		let existingEmbedMsg = messageId ? await channel.messages.fetch(messageId).catch(() => null) : null;
		let existingFollowUpMsg = followUpMessageId ? await channel.messages.fetch(followUpMessageId).catch(() => null) : null;

		let updatedMessageId = '';
		let updatedFollowUpMessageId = '';

		if (sendEmbed) {
			let messageText = await this.getMessageText(plugin);

			// 1. Embed-Nachricht aktualisieren oder neu senden
			if (existingEmbedMsg) {
				await existingEmbedMsg.edit({
					content: pingContent.trim() ? pingContent : null,
					embeds: [messageText]
				});
				updatedMessageId = existingEmbedMsg.id;
			} else {
				let embedMsg = await channel.send({
					content: pingContent.trim() ? pingContent : undefined,
					embeds: [messageText]
				});
				updatedMessageId = embedMsg.id;
			}

			// 2. Anhang-Nachricht aktualisieren, neu senden oder löschen falls leer
			if (followUpMessageText && followUpMessageText.trim()) {
				if (existingFollowUpMsg) {
					await existingFollowUpMsg.edit({ content: followUpMessageText });
					updatedFollowUpMessageId = existingFollowUpMsg.id;
				} else {
					let followUpMsg = await channel.send({ content: followUpMessageText });
					updatedFollowUpMessageId = followUpMsg.id;
				}
			} else {
				if (existingFollowUpMsg) {
					await existingFollowUpMsg.delete().catch(() => null);
				}
				updatedFollowUpMessageId = '';
			}
		} else {
			// Nur Anhang senden (ohne Embed)
			// Altes Embed löschen falls vorhanden
			if (existingEmbedMsg) {
				await existingEmbedMsg.delete().catch(() => null);
			}
			updatedMessageId = '';

			let content = pingContent ? `${pingContent}${followUpMessageText}` : followUpMessageText;

			if (existingFollowUpMsg) {
				await existingFollowUpMsg.edit({ content: content });
				updatedFollowUpMessageId = existingFollowUpMsg.id;
			} else {
				let followUpMsg = await channel.send({ content: content });
				updatedFollowUpMessageId = followUpMsg.id;
			}
		}

		await saveMessage(db, plugin.id, channel.id, updatedMessageId, updatedFollowUpMessageId);

		return { saved: true, infoMessage: "Announcement wurde aktualisiert", infoStatus: "Info" };
	}

	async delete(plugin, config) {
		let client = dataManager.client;
		let db = DatabaseManager.get();

		await deleteMessage(client, plugin, db);
		return { saved: true, infoMessage: "Announcement wurde gelöscht", infoStatus: "Info" };
	}
}

module.exports = new Plugin();

async function deleteMessage(client, plugin, db) {
	const { channelId, messageId, followUpMessageId } = await getMessageId(db, plugin.id);
	if (channelId) {
		try {
			let channel = await client.channels.fetch(channelId).catch(() => null);
			if (channel) {
				if (messageId) {
					let message = await channel.messages.fetch(messageId).catch(() => null);
					if (message) await message.delete().catch(() => null);
				}

				if (followUpMessageId) {
					let followUpMessage = await channel.messages.fetch(followUpMessageId).catch(() => null);
					if (followUpMessage) await followUpMessage.delete().catch(() => null);
				}
			}
		} catch (e) {
			console.log("Fehler beim Löschen des Announcements:", e);
		}

		await saveMessage(db, plugin.id, '', '', '');
	}
}

async function saveMessage(db, pluginId, channelId, messageId, followUpMessageId) {
	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.updateOne(
		{ _id: ObjectId(pluginId) },
		{
			$set: {
				channelId: channelId,
				messageId: messageId,
				followUpMessageId: followUpMessageId
			}
		}
	);

	return filteredDocs;
}

async function getMessageId(db, pluginId) {
	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.findOne(
		{ _id: ObjectId(pluginId) }
	);

	return {
		channelId: filteredDocs ? filteredDocs.channelId : '',
		messageId: filteredDocs ? filteredDocs.messageId : '',
		followUpMessageId: filteredDocs ? filteredDocs.followUpMessageId : ''
	};
}
