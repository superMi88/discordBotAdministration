const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { ChannelType } = require('discord.js');
const { PermissionsBitField } = require('discord.js');

class Plugin {

	async execute(client, plugin) {

		plugin.on(client, 'messageCreate', async interaction => {

			if (interaction.channelId === plugin['var'].threadCreatorChannel) {

				console.log(interaction)
				console.log(interaction.attachments)

				let prefix = "text"

				if(interaction.attachments.entries().next().value){
					if(interaction.attachments.entries().next().value[1].contentType){

						let contentType = interaction.attachments.entries().next().value[1].contentType

						switch (contentType) {
							case 'image/png':
								prefix = 'bild'
								break;
							case 'application/zip':
								prefix = 'datei'
								break;
						
							default:
								break;
						}
					}
				
				}else{
					if(interaction.content.includes('https://www.instagram.com')){
						prefix = 'insta'
					}
					if(interaction.content.includes('https://www.youtube.com')){
						prefix = 'youtube'
					}
					if(interaction.content.includes('https://open.spotify.com')){
						prefix = 'spotify'
					}
				}
				

				let guild = await client.guilds.fetch(interaction.guildId)
				let guildMember = await guild.members.fetch(interaction.author.id)

				let replaceUsername = guildMember.nickname ? guildMember.nickname : guildMember.user.username

				let threadName = plugin['var'].threadName
				threadName = threadName.replace('<@user>', replaceUsername);

				interaction.startThread({
					name: prefix+"-"+threadName,
					autoArchiveDuration: 60, //60 min 
					type: 'GUILD_PUBLIC_THREAD'
				});

				//sort iconAndText1 by order
				plugin['var'].iconAndText1.sort(function (a, b) {
					var valueA, valueB;
		
					valueA = a["order"]; // Where 1 is your index, from your example
					valueB = b["order"];
					if (valueA < valueB) {
						return -1;
					}
					else if (valueA > valueB) {
						return 1;
					}
					return 0;
				});

				plugin['var'].iconAndText1.forEach(iconAndText1Element => {

					if (
						iconAndText1Element.emoji1
					) {
						if (isNaN(iconAndText1Element.emoji1)) {
							//unicode reaction
							interaction.react(iconAndText1Element.emoji1);
							
						} else {
							//custon emoji reaction
							interaction.react(client.emojis.cache.get(iconAndText1Element.emoji1));
						}
						
					}
		
				});
			}

		});

	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		return ({ saved: true, infoMessage: "Thread Creator gespeichert", infoStatus: "Info" })
	}
};
module.exports = new Plugin();