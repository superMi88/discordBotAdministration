const dataManager = require("../../discordBot/lib/dataManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');
const { PermissionsBitField } = require('discord.js');

class Plugin {
	async execute(client, plugin) {
		plugin.on(client, 'voiceStateUpdate', async (oldState, newState) => {
			// Wenn newState den Kanal hat, der in den Plugin-Optionen konfiguriert ist
			if (
				(newState.channel && newState.channel.parentId === plugin['var'].voiceCategory)
				||
				(oldState.channel && oldState.channel.parentId === plugin['var'].voiceCategory)
			) {
				checkVoiceChannel(client, plugin, newState);
			}
		});

		plugin.on(client, 'ready', async () => {
			checkVoiceChannel(client, plugin);
		});
	}

	async save(plugin, config) {
		let client = dataManager.client;

		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		await checkVoiceChannel(client, plugin);

		return ({ saved: true, infoMessage: "Voice System gespeichert und Channel neu erstellt", infoStatus: "Info" });
	}
};

module.exports = new Plugin();




// Eine globale Queue (Warteschlange), um sicherzustellen, dass schnelle 
// Voice-Wechsel strikt nacheinander abgearbeitet werden.
let executionQueue = Promise.resolve();

async function checkVoiceChannel(client, plugin, newState = null) {
	// Die aktuelle Ausführung in die Queue einreihen, damit sie wartet, bis der Vorgänger fertig ist
	executionQueue = executionQueue.then(async () => {
		await executeCheckVoiceChannel(client, plugin, newState);
	}).catch(err => {
		console.error("Fehler in Voice-Queue:", err);
	});
	return executionQueue;
}

// Die eigentliche Logik ausgelagert, damit die Queue sie aufrufen kann
async function executeCheckVoiceChannel(client, plugin, newState = null) {
	let categoryChannel;
	try {
		categoryChannel = await client.channels.fetch(plugin['var'].voiceCategory, { force: true });
	} catch (e) {
		console.error("Fehler beim Abrufen der Voice-Kategorie:", e);
		return;
	}

	if (!categoryChannel || !categoryChannel.children) return;



	let existingVoices = Array.from(categoryChannel.children.cache.values())
		.filter(ch => ch.type === ChannelType.GuildVoice);

	let channelsToDelete = [];
	let optionsList = plugin['var'].optionsVoiceChannel;
	let handledChannelIds = new Set();

	let positionUpdates = [];
	let creates = []; // { option: opt, targetPosition: int, createPosition: int }

	// ++ SCHRITT 1: Planen der Ziel-Ordnerstruktur (mit den 100er Lücken) ++
	for (let i = 0; i < optionsList.length; i++) {
		const opt = optionsList[i];
		let basePosition = (i + 1) * 100; // Positions-Lücken: 100, 200, 300...

		let voicesForOpt = existingVoices.filter(ch => ch.name === opt.channelName);

		// Älteste Kanäle nach oben sortieren zur absoluten Stabilität
		voicesForOpt.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

		let emptyVoices = voicesForOpt.filter(ch => ch.members.size === 0);
		let fullVoices = voicesForOpt.filter(ch => ch.members.size > 0);

		// Zu viele leere Kanäle aussortieren
		while (emptyVoices.length > 1) {
			let ch = emptyVoices.pop();
			channelsToDelete.push(ch);
		}

		let currentPosOffset = 0;

		// 1. Der LEERE Kanal MUSS als oberstes stehen (basePosition)
		if (emptyVoices.length === 1) {
			let ch = emptyVoices[0];
			positionUpdates.push({ channel: ch.id, position: basePosition + currentPosOffset });
			handledChannelIds.add(ch.id);
			currentPosOffset++;
		} else if (emptyVoices.length === 0) {
			// Wir planen einen neuen zu erstellen.
			// Damit er visuell beim plötzlichen Ploppen exakt eins ÜBER den alten Channels spawnt,
			// geben wir API-seitig erstmal basePosition - 10 an als direkten Create-Befehl!
			let createPos = basePosition - 10;
			creates.push({
				option: opt,
				targetPosition: basePosition + currentPosOffset,
				createPosition: createPos
			});
			currentPosOffset++;
		}

		// 2. Die VOLLEN Kanäle reihen sich geordnet darunter ein (+1, +2, ...)
		for (const ch of fullVoices) {
			positionUpdates.push({ channel: ch.id, position: basePosition + currentPosOffset });
			handledChannelIds.add(ch.id);
			currentPosOffset++;
		}
	}

	// ++ SCHRITT 2: Reste anhängen ++
	let maxBase = (optionsList.length + 1) * 100;
	let leftoverChannels = existingVoices
		.filter(ch => !handledChannelIds.has(ch.id) && !channelsToDelete.includes(ch))
		.sort((a, b) => a.position - b.position);

	for (let i = 0; i < leftoverChannels.length; i++) {
		positionUpdates.push({ channel: leftoverChannels[i].id, position: maxBase + i });
	}

	// ++ SCHRITT 3: Ausführen (Aufräumen -> Erstellen -> Setzen) ++
	for (let ch of channelsToDelete) {
		await ch.delete("Voice System CleanUp").catch(console.error);
	}

	for (let i = 0; i < creates.length; i++) {
		let c = creates[i];
		let createOptions = {
			name: c.option.channelName,
			type: ChannelType.GuildVoice,
			parent: categoryChannel,
			position: c.createPosition // Bewusster "Minus 10" Startwert!
		};
		if (c.option.memberlimit) createOptions.userLimit = c.option.memberlimit;



		let newlyCreated = await categoryChannel.guild.channels.create(createOptions).catch(console.error);
		if (newlyCreated) {
			// Für das finale Aufräumen fügen wir ihn an die richtige Ziel-Position (basePosition) an
			positionUpdates.push({ channel: newlyCreated.id, position: c.targetPosition });
		}
	}

	if (positionUpdates.length > 0) {
		await categoryChannel.guild.channels.setPositions(positionUpdates).catch(console.error);

		await new Promise(r => setTimeout(r, 600));
	} else {
		try {
			if (channelsToDelete.length > 0) await new Promise(r => setTimeout(r, 600));
		} catch (e) { }
	}
}
