
const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');

const { ChannelType } = require('discord.js');
const { PermissionsBitField } = require('discord.js');

class Plugin {

	guildInvites = new Map()
	async execute(client, plugin) {

		client.guilds.cache.forEach(guild => {
			guild.invites.fetch()
				.then(invites => {
					const codeUses = new Map();
					invites.each(inv => codeUses.set(inv.code, inv.uses));
					
					this.guildInvites.set(guild.id, codeUses);
				})
				.catch(err => {
					console.log("OnReady Error:", err)
				})
		})
		
		plugin.on(client, 'inviteCreate', async invite => {
			const invites = await invite.guild.invites.fetch();
		
			const codeUses = new Map();
			invites.each(inv => codeUses.set(inv.code, inv.uses));
		
			this.guildInvites.set(invite.guild.id, codeUses);
		})
		
		plugin.on(client, 'guildMemberAdd', async member => {
			const cachedInvites = this.guildInvites.get(member.guild.id)
			const newInvites = await member.guild.invites.fetch();
			try {
				const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code) < inv.uses)

				const exampleEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setTitle("Invite-Tracker")
					.setDescription(`Der Code ${usedInvite.code} (erstellt von <@${usedInvite.inviterId}>) wurde von <@${member.user.id}> [${member.user.username}] benutzt`)
				await client.channels.cache.get(plugin['var'].logChannel).send({ embeds: [exampleEmbed] })

			} catch (err) {
				console.log("OnGuildMemberAdd Error:", err)
			}
		
			newInvites.each(inv => cachedInvites.set(inv.code, inv.uses));
			this.guildInvites.set(member.guild.id, cachedInvites);
		});

	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		return ({ saved: true, infoMessage: "Invite Tracker geupdatet", infoStatus: "Info" })
	}
};
module.exports = new Plugin();
