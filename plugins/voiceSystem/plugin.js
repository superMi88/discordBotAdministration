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


async function checkVoiceChannel(client, plugin, newState = null) {
	let categoryChannel = await client.channels.fetch(plugin['var'].voiceCategory);
  
	// Gehe alle Voice-Channel-Optionen durch
	for (let i = 0; i < plugin['var'].optionsVoiceChannel.length; i++) {
	  const optionVoiceChannel = plugin['var'].optionsVoiceChannel[i];
  
	  let createNew = true;
	  let emptyVoiceChannel = undefined;
  
	  // Gehe alle bestehenden Voice-Channels in der Kategorie durch
	  categoryChannel.children.cache.forEach((voiceChannel) => {
		if (optionVoiceChannel.channelName === voiceChannel.name) {
		  if (emptyVoiceChannel) {
			emptyVoiceChannel.delete("too many open voice channels");
			emptyVoiceChannel = undefined;
		  }
		  if (voiceChannel.members.size === 0) {
			createNew = false;
			emptyVoiceChannel = voiceChannel;
		  } else {
			createNew = true;
		  }
		}
	  });
  
	  // Falls ein neuer Channel erstellt werden soll…
	  if (createNew) {
		// Prüfe, ob newState vorhanden ist und der Channel-Name übereinstimmt
		if (newState && newState.channel && newState.channel.name === optionVoiceChannel.channelName) {
		  // Finde den aktuellen Channel in der Kategorie
		  const currentChannel = categoryChannel.children.cache.find(
			(channel) => channel.name === optionVoiceChannel.channelName
		  );
		  if (currentChannel) {
			// Hole alle Channels in der Kategorie und sortiere sie nach Position
			const sortedChannels = Array.from(categoryChannel.children.cache.values())
			  .filter(ch => ch.type === ChannelType.GuildVoice)
			  .sort((a, b) => a.position - b.position);
			
			// Finde den Index des aktuellen Channels
			const currentIndex = sortedChannels.findIndex(ch => ch.id === currentChannel.id);
			
			// Der neue Channel soll an der Position des aktuellen Channels erscheinen
			const newPosition = sortedChannels[currentIndex].position;
  
			// Erstelle den neuen Channel mit der gewünschten Position
			const newChannel = await categoryChannel.guild.channels.create({
			  name: optionVoiceChannel.channelName,
			  type: ChannelType.GuildVoice,
			  parent: categoryChannel,
			  userLimit: optionVoiceChannel.memberlimit, // Falls vorhanden
			  position: newPosition
			});
  
			// Verschiebe den aktuellen Channel um eine Stelle nach unten,
			// sodass der neue Channel direkt darüber erscheint.
			await currentChannel.setPosition(newPosition + 1);
  
			// Optional: Verschiebe auch alle Channels, die zwischen newChannel und currentChannel liegen,
			// falls nötig (normalerweise erledigt Discord das automatisch).
		  }
		} else {
		  // Falls kein Benutzer beigetreten ist, erstelle den Channel wie gehabt
		  await categoryChannel.guild.channels.create({
			name: optionVoiceChannel.channelName,
			type: ChannelType.GuildVoice,
			parent: categoryChannel,
			userLimit: optionVoiceChannel.memberlimit
		  });
		}
	  }
	}
  }
