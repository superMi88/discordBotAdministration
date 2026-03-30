const dataManager = require("../../discordBot/lib/dataManager.js")
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const helper = require("../../discordBot/lib/helper.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");

class Plugin {
	async execute(client, plugin) {

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			// Ban Command execution
			if (interaction.commandName === plugin['var'].banCommand) {
				await interaction.deferReply({ ephemeral: true });
				const guild = await client.guilds.fetch(plugin['var'].server);
				const member = await guild.members.fetch(interaction.user.id);
				
				// Has Minimod Role?
				if (!member.roles.cache.has(plugin['var'].minimodRole) && !member.permissions.has('Administrator')) {
					return await interaction.editReply({ content: 'Du hast keine Berechtigung für diesen Befehl.', ephemeral: true });
				}

				const targetUser = interaction.options.getUser('user');
				const reason = interaction.options.getString('reason') || 'Keine Begründung angegeben';
				const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

				if (!targetMember) {
					return await interaction.editReply({ content: 'User konnte auf dem Server nicht gefunden werden.', ephemeral: true });
				}

				// Check conditions: Needs a ban role OR be newer than maxDays
				let canBan = false;
				
				// 1. Check roles
				if (plugin['var'].banRolesBlock) {
					for (let i = 0; i < plugin['var'].banRolesBlock.length; i++) {
						let checkRole = plugin['var'].banRolesBlock[i].roleId;
						if (targetMember.roles.cache.has(checkRole)) {
							canBan = true;
							break;
						}
					}
				}

				// 2. Check join date if not already allowed
				if (!canBan && plugin['var'].maxDays) {
					const maxDaysNumber = parseInt(plugin['var'].maxDays);
					if (!isNaN(maxDaysNumber)) {
						const joinedAt = targetMember.joinedTimestamp;
						const now = Date.now();
						const daysOnServer = (now - joinedAt) / (1000 * 60 * 60 * 24);
						
						if (daysOnServer <= maxDaysNumber) {
							canBan = true;
						}
					}
				}

				if (!canBan) {
					return await interaction.editReply({ content: 'Du darfst diesen User nicht bannen (Erlaubte Rolle fehlt oder User ist zu lange auf dem Server).', ephemeral: true });
				}

                // Fetch messages from today and log them before banning
				let deletedMessagesLog = "";
				try {
					// We'll collect messages from all text channels the bot can see
					const channels = guild.channels.cache.filter(c => c.isTextBased());
					const today = new Date();
					today.setHours(0, 0, 0, 0);

					for (const [id, channel] of channels) {
						if (!channel.permissionsFor(client.user).has('ViewChannel')) continue;
						
						// Fetch recent messages
						const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
						if (!messages) continue;

						const userMessages = messages.filter(m => m.author.id === targetUser.id && m.createdAt >= today);
						
						userMessages.forEach(m => {
							const time = m.createdAt.toLocaleTimeString('de-DE');
							deletedMessagesLog += `[${time}] #${channel.name}: ${m.content}\n`;
						});
					}
				} catch (e) {
					console.log("Fehler beim Sammeln der Nachrichten:", e);
				}

                // Execute Ban & delete 1 days of messages
				await targetMember.ban({ deleteMessageSeconds: 86400, reason: `Gebannt von Minimod ${interaction.user.tag}: ${reason}` }).catch(err => console.log(err));

				// Log Action
				if (plugin['var'].logChannel) {
					const channel = await client.channels.fetch(plugin['var'].logChannel);
					if (channel) {
						const embed = new EmbedBuilder()
							.setTitle("Minimod Ban")
							.setColor("#ff0000")
							.addFields(
								{ name: "Minimod", value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
								{ name: "Gebannter User", value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
								{ name: "Grund", value: reason }
							)
							.setTimestamp();
						await channel.send({ embeds: [embed] });

						// Send collected messages in chunks if there are any
						if (deletedMessagesLog.length > 0) {
							const header = `**Nachrichten von ${targetUser.tag} von heute:**\n`;
							let currentChunk = header;

							const lines = deletedMessagesLog.split('\n');
							for (const line of lines) {
								if (!line.trim()) continue;
								if (currentChunk.length + line.length + 1 > 2000) {  // Discord limit is 2000 per message
									await channel.send({ content: currentChunk });
									currentChunk = line + '\n';
								} else {
									currentChunk += line + '\n';
								}
							}
							if (currentChunk.length > 0) {
								await channel.send({ content: currentChunk });
							}
						} else {
							await channel.send({ content: `*Keine Nachrichten von ${targetUser.tag} heute gefunden.*` });
						}
					}
				}

				return await interaction.editReply({ content: 'Der User wurde erfolgreich gebannt.', ephemeral: true });
			}

			// Mute Command execution
			if (interaction.commandName === plugin['var'].muteCommand) {
				await interaction.deferReply({ ephemeral: true });
				const guild = await client.guilds.fetch(plugin['var'].server);
				const member = await guild.members.fetch(interaction.user.id);
				
				// Has Minimod Role?
				if (!member.roles.cache.has(plugin['var'].minimodRole) && !member.permissions.has('Administrator')) {
					return await interaction.editReply({ content: 'Du hast keine Berechtigung für diesen Befehl.', ephemeral: true });
				}

				const targetUser = interaction.options.getUser('user');
				const reason = interaction.options.getString('reason') || 'Keine Begründung angegeben';

				const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
				if (!targetMember) {
					return await interaction.editReply({ content: 'User konnte auf dem Server nicht gefunden werden.', ephemeral: true });
				}

				// Check conditions: Needs a ban role OR be newer than maxDays OR needs a mute role
				let canMute = false;

				// 1. Check ban roles
				if (plugin['var'].banRolesBlock) {
					for (let i = 0; i < plugin['var'].banRolesBlock.length; i++) {
						let checkRole = plugin['var'].banRolesBlock[i].roleId;
						if (targetMember.roles.cache.has(checkRole)) {
							canMute = true;
							break;
						}
					}
				}

				// 2. Check mute roles
				if (!canMute && plugin['var'].muteRolesBlock) {
					for (let i = 0; i < plugin['var'].muteRolesBlock.length; i++) {
						let checkRole = plugin['var'].muteRolesBlock[i].roleId;
						if (targetMember.roles.cache.has(checkRole)) {
							canMute = true;
							break;
						}
					}
				}

				// 3. Check join date
				if (!canMute && plugin['var'].maxDays) {
					const maxDaysNumber = parseInt(plugin['var'].maxDays);
					if (!isNaN(maxDaysNumber)) {
						const joinedAt = targetMember.joinedTimestamp;
						const now = Date.now();
						const daysOnServer = (now - joinedAt) / (1000 * 60 * 60 * 24);
						
						if (daysOnServer <= maxDaysNumber) {
							canMute = true;
						}
					}
				}

				if (!canMute) {
					return await interaction.editReply({ content: 'Du darfst diesen User nicht muten.', ephemeral: true });
				}

				const durationMs = 24 * 60 * 60 * 1000; // 1 Tag
                
				// Fetch messages from today and log AND delete them before muting
				let deletedMessagesLog = "";
				const messagesToDelete = [];
				try {
					const channels = guild.channels.cache.filter(c => c.isTextBased());
					const today = new Date();
					today.setHours(0, 0, 0, 0);

					for (const [id, channel] of channels) {
						if (!channel.permissionsFor(client.user).has('ViewChannel') || !channel.permissionsFor(client.user).has('ManageMessages')) continue;
						
						// Fetch recent messages
						const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
						if (!messages) continue;

						const userMessages = messages.filter(m => m.author.id === targetUser.id && m.createdAt >= today);
						
						if (userMessages.size > 0) {
							userMessages.forEach(m => {
								const time = m.createdAt.toLocaleTimeString('de-DE');
								deletedMessagesLog += `[${time}] #${channel.name}: ${m.content}\n`;
								messagesToDelete.push(m);
							});
							// Bulk delete directly in the channel
							await channel.bulkDelete(userMessages).catch(err => console.log('Error deleting messages:', err));
						}
					}
				} catch (e) {
					console.log("Fehler beim Sammeln/Löschen der Nachrichten:", e);
				}

                // Execute Mute (Timeout)
				await targetMember.timeout(durationMs, `Gemutet von Minimod ${interaction.user.tag}: ${reason}`).catch(err => console.log(err));

				let timeString = '1 Tag';

				// Log Action
				if (plugin['var'].logChannel) {
					const channel = await client.channels.fetch(plugin['var'].logChannel);
					if (channel) {
						const embed = new EmbedBuilder()
							.setTitle("Minimod Mute")
							.setColor("#ffd700")
							.addFields(
								{ name: "Minimod", value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
								{ name: "Gemuteter User", value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
								{ name: "Dauer", value: timeString.trim(), inline: true },
								{ name: "Grund", value: reason }
							)
							.setTimestamp();
						await channel.send({ embeds: [embed] });

						// Send collected messages in chunks if there are any
						if (deletedMessagesLog.length > 0) {
							const header = `**Gelöschte Nachrichten von ${targetUser.tag} von heute:**\n`;
							let currentChunk = header;

							const lines = deletedMessagesLog.split('\n');
							for (const line of lines) {
								if (!line.trim()) continue;
								if (currentChunk.length + line.length + 1 > 2000) {
									await channel.send({ content: currentChunk });
									currentChunk = line + '\n';
								} else {
									currentChunk += line + '\n';
								}
							}
							if (currentChunk.length > 0) {
								await channel.send({ content: currentChunk });
							}
						} else {
							await channel.send({ content: `*Keine Nachrichten von ${targetUser.tag} heute gefunden.*` });
						}
					}
				}

				return await interaction.editReply({ content: `Der User wurde erfolgreich gemutet für ${timeString.trim()}.`, ephemeral: true });
			}
		});
	}

	async save(plugin, config) {
		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}
		await PluginManager.reloadSlashCommands()
		await PluginManager.reloadEvents()
		return ({ saved: true, infoMessage: "Einstellungen gespeichert", infoStatus: "Info" })
	}

	async addCommands(plugin, commandMap) {
		if (!(plugin['var'].server && plugin['var'].banCommand && plugin['var'].muteCommand)) return "";

		// Ban Command
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].banCommand)
				.setDescription('Minimod Ban Befehl')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User der gebannt werden soll')
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('reason')
						.setDescription('Begründung für den Ban')
						.setRequired(false)
				)
		);

		// Mute Command
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].muteCommand)
				.setDescription('Minimod Mute Befehl')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('Der User der gemutet werden soll')
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('reason')
						.setDescription('Begründung für den Mute')
						.setRequired(false)
				)
		);
	}
};

module.exports = new Plugin();

