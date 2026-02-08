const dataManager = require("../../lib/dataManager.js")

const { ChannelType } = require('discord.js');

const { PermissionFlagsBits } = require('discord.js');

const PluginManager = require("../../lib/PluginManager.js");
const { ObjectId } = require("mongodb");

const DatabaseManager = require("../../lib/DatabaseManager.js");

let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../lib/helper.js')

const { ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, UserSelectMenuBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');


class Plugin {
	async execute(client, plugin) {

		let db = DatabaseManager.get()

		client.on('voiceStateUpdate', async (oldState, newState) => {

			//wenn man aus einem channel geht was nicht der voice creator ist 
			if (oldState.channelId != plugin['var'].voiceChannel) {
				if (oldState.channel && oldState.channel.members) {

					if (oldState.channel.parentId === plugin['var'].voiceCategory) {

						if (oldState.channel.members.size === 0) {


							const collection = db.collection('pluginCollection');
							let pluginFromDatabase = await collection.findOne(
								{
									_id: ObjectId(plugin.id)
								}
							)

							if(!pluginFromDatabase.createdChannels){
								pluginFromDatabase.createdChannels = []
							}

							//suche das voiceChannelObjekt um den channel und die id zu bekommen der dem voice channel gehört
							let voiceChannel = pluginFromDatabase.createdChannels.find(e => e.channelId === oldState.channelId)


							if(voiceChannel/*pluginFromDatabase.createdChannels.some(e => e.channelId === oldState.channelId)*/){

								//const user = await client.users.fetch(newState.id)



								//const PermissionOverwriteEveryone = oldState.channel.permissionOverwrites.cache.get(newState.guild.id)

								let doEveryoneHasConnectPermissions = oldState.channel.permissionsFor(newState.guild.id).has('Connect')
								let doEveryoneHasViewPermissions = oldState.channel.permissionsFor(newState.guild.id).has('ViewChannel')
								let userIds = Array.from( oldState.channel.permissionOverwrites.cache.keys() );


								let privateNumber = 0
								if(!doEveryoneHasConnectPermissions) privateNumber = 1
								if(!doEveryoneHasConnectPermissions && !doEveryoneHasViewPermissions) privateNumber = 2

								const index = userIds.indexOf(newState.guild.id);
								if (index && index > -1) { // only splice array when item is found
									userIds.splice(index, 1); // 2nd parameter means remove one item only
								}

								//update user dem der voiceChannel gehört
								await updateUserFromDatabase(db, voiceChannel.userId, {
									$set: {
										["currency.voiceCreatorChannel_"+plugin.id]: {
											name: oldState.channel.name,
											userLimit: oldState.channel.userLimit,
											permissions: userIds,
											private: privateNumber
										},
									}
								})

								let result = await collection.findOneAndUpdate(
									{_id: ObjectId(plugin.id)},
									{$pull: {["createdChannels"]: { channelId: oldState.channelId}}}
								);


								oldState.channel.delete("user is disconnected")
							}

							
						}
					}
				}
			}

			//wenn der neue status dem voice creator channel entspricht
			if (newState.channelId == plugin['var'].voiceChannel) {

				const collection2 = db.collection('pluginCollection');
				let pluginFromDatabase = await collection2.findOne(
					{
						_id: ObjectId(plugin.id)
					}
				)

				if(!pluginFromDatabase.createdChannels){
					pluginFromDatabase.createdChannels = []
				}

				//suche das voiceChannelObjekt um den channel und die id zu bekommen der dem voice channel gehört
				let voiceChannel = pluginFromDatabase.createdChannels.find(e => e.userId === newState.id)

				//wenn der voice channel noch vorhanden ist erstelle keinen neuen sondern move den user da rein
				if(voiceChannel){
					newState.member.voice.setChannel(voiceChannel.channelId)
					return
				}



				let channel = await client.channels.fetch(plugin['var'].voiceCategory)

				const user = await client.users.fetch(newState.id)


				//get old channelname
				let discordUserDatabase = await getUserCurrencyFromDatabase(user.id, db)

				let voiceCreatorChannelName = discordUserDatabase["voiceCreatorChannel_"+plugin.id]
				if (!voiceCreatorChannelName) voiceCreatorChannelName = 
					{
						name: user.username + "s Channel",
						userLimit: 5
					}


				//permission Array mit dem channel besitzer schon voreingestellt
				let permissionOverwritesArray = [
					{
						id: user.id,
						allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
					},
				]

				if(!voiceCreatorChannelName.permissions) voiceCreatorChannelName.permissions = []

				//remove @everyone from permission array
				const index = voiceCreatorChannelName.permissions.indexOf(newState.guild.id);
				if (index && index > -1) { // only splice array when item is found
					voiceCreatorChannelName.permissions.splice(index, 1); // 2nd parameter means remove one item only
				}

				for (const userId of voiceCreatorChannelName.permissions) {

					//if die eingetragene userId keine userId sonderndie @everyone Id(guildId) dann nicht eintragen //TODO beim abspeichern direkt ürüfen
					if(!(userId == newState.guild.id)){
						permissionOverwritesArray.push({
							id: userId,
							allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
						})
					}

					
				}
				
				//public
				if(voiceCreatorChannelName.private == 0){
					//set everyone rule to open
					permissionOverwritesArray.push({
						id: newState.guild.roles.everyone.id,
						allow: [PermissionFlagsBits.Connect],
					})
				}
				//private
				if(voiceCreatorChannelName.private == 1){
					//set everyone rule to closed
					permissionOverwritesArray.push({
						id: newState.guild.roles.everyone.id,
						deny: [PermissionFlagsBits.Connect],
					})
				}
				//private and unsichtbar
				if(voiceCreatorChannelName.private == 2){
					//set everyone rule to closed
					permissionOverwritesArray.push({
						id: newState.guild.roles.everyone.id,
						deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],//1030095522482106388, 970393899073933352
					})
				}

				let createdChannel = await channel.guild.channels.create({
					name: voiceCreatorChannelName.name,
					userLimit: voiceCreatorChannelName.userLimit,
					type: ChannelType.GuildVoice,
					parent: channel,
					permissionOverwrites: permissionOverwritesArray,
					position: 20
				});

				const collection = db.collection('pluginCollection');
				let result = await collection.findOneAndUpdate(
					{_id: ObjectId(plugin.id)},
					{$push: {["createdChannels"]: 
						{
							channelId: createdChannel.id,
							userId: user.id
						}
					}}
				);


				console.log("blub")
				console.log(voiceCreatorChannelName.permissions)
				console.log(voiceCreatorChannelName.permissions)

				await sendVoiceChannelOptions(plugin, createdChannel, newState.guild.id);

				newState.member.voice.setChannel(createdChannel.id)
			}
		});


		plugin.on(client, 'interactionCreate', async interaction => {

			const collection2 = db.collection('pluginCollection');
			let pluginFromDatabase = await collection2.findOne(
				{
					_id: ObjectId(plugin.id)
				}
			)

			if(!pluginFromDatabase.createdChannels){
				pluginFromDatabase.createdChannels = []
			}

			//suche das voiceChannelObjekt um den channel und die id zu bekommen der dem voice channel gehört
			let voiceChannel = pluginFromDatabase.createdChannels.find(e => e.channelId === interaction.channelId)

			if(!voiceChannel) return

			//wenn der User nicht die berechtigung für den channel hat dann return mit einer message
			if(interaction.user.id != voiceChannel.userId){
				await interaction.reply({ content: 'Der Channel gehört dir nicht', ephemeral: true });
				return
			}

			if(interaction.customId === plugin.id+'-deleteChannel'){

				const collection = db.collection('pluginCollection');
				let result = await collection.findOneAndUpdate(
					{_id: ObjectId(plugin.id)},
					{$pull: {["createdChannels"]: { channelId: interaction.channel.id}}}
				);
				interaction.channel.delete("user hat den schließen button benutzt")
			}

			if(interaction.customId === plugin.id+'-setUserLimit'){
				await interaction.channel.setUserLimit(interaction.values[0])


				await sendVoiceChannelOptions(plugin, interaction.channel, interaction.guild.id, interaction)

				return /*await interaction.update({})*/
			}

			if(interaction.customId === plugin.id+'-setChannelName'){
				const channelname = interaction.fields.getTextInputValue('channelname');
				interaction.channel.setName(channelname)
				return await interaction.update({})
			}


			if(interaction.customId === plugin.id+'-openChangeNameModal'){

				const modal = new ModalBuilder()
					.setCustomId(plugin.id+'-setChannelName')
					.setTitle('Name');

				const firstComponent = new TextInputBuilder()
					.setCustomId('channelname')
					.setLabel("Wie soll der Channel heißen?")
					.setStyle(TextInputStyle.Short)
					.setValue(interaction.channel.name);

				const firstActionRow = new ActionRowBuilder().addComponents(firstComponent);
				modal.addComponents(firstActionRow);

				await interaction.showModal(modal);
			}


			if(interaction.customId === plugin.id+'-setPrivacy'){

				const channel = await client.channels.fetch(interaction.channelId)

				if(await isPrivateChannelAndNotViewable(channel, interaction.guild.id)){
					console.log("set Open")
					//set Public
					await channel.permissionOverwrites.edit(interaction.guild.id,{
						Connect: true,
						ViewChannel: true
					});

					return await sendVoiceChannelOptions(plugin, channel, interaction.guild.id, interaction)
					return await interaction.update({files: ['plugins/voiceCreator/images/open.png']});
				}else if(await isPrivateChannel(channel, interaction.guild.id)){
					//set connect false
					console.log("set Private and not viewable")
					await channel.permissionOverwrites.edit(interaction.guild.id,{
						Connect: false,
						ViewChannel: false
					});

					return await sendVoiceChannelOptions(plugin, channel, interaction.guild.id, interaction)

					return await interaction.update({files: ['plugins/voiceCreator/images/privatAndNotViewable.png']});
				}else{
					//set connect false and viewable
					console.log("set Private")
					await channel.permissionOverwrites.edit(interaction.guild.id,{
						Connect: false,
						ViewChannel: true
					});

					return await sendVoiceChannelOptions(plugin, channel, interaction.guild.id, interaction)
					return await interaction.update({files: ['plugins/voiceCreator/images/privat.png']});
					
				}

				
			}

			if (interaction.customId === plugin.id+'-setUser') {

				const channel = await client.channels.fetch(interaction.channelId)


				//suche alle vorhandenen Permissions durch uns suche die raus die roles sind
				let permissionRoles = []

				await channel.permissionOverwrites.cache.forEach(permissionObj => {

					//sollte ungleich der guild sein also kein @everyone role soll drin reinrutschen
					if(permissionObj.id != channel.guild.id){
						if(interaction.guild.roles.cache.some(role => role.id == permissionObj.id)){
							permissionRoles.push(permissionObj.id)
						}
					}

					
				});

				const combinedPermissionRoles = [].concat(permissionRoles, interaction.values);

				//permission Array mit dem channel besitzer schon voreingestellt
				let permissionOverwritesArray = [
					{
						id: interaction.user.id,
						allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
					},
				]

				for (let i = 0; i < combinedPermissionRoles.length; i++) {

					permissionOverwritesArray.push({
						id: combinedPermissionRoles[i],
						allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
					})
				}

				if(await isPrivateChannelAndNotViewable(channel, interaction.guild.id)){
					permissionOverwritesArray.push(
						{
							id: interaction.guild.id,
							deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
						},
					)
				}else if(await isPrivateChannel(channel, interaction.guild.id)){
					permissionOverwritesArray.push(
						{
							id: interaction.guild.id,
							deny: [PermissionFlagsBits.Connect],
						},
					)
				}else{
					permissionOverwritesArray.push(
						{
							id: interaction.guild.id,
							allow: [PermissionFlagsBits.Connect],
						},
					)
				}

				

				//update Permission for current channel
				let createdChannel = await channel.permissionOverwrites.set(permissionOverwritesArray); //TODO reaktiviere
				

				//await interaction.update({});

				await sendVoiceChannelOptions(plugin, interaction.channel, interaction.guild.id, interaction)

				//await interaction.reply({ content: 'Einstellung gespeichert', ephemeral: true });
			}

			if (interaction.customId === plugin.id+'-setRoles') {


				const channel = await client.channels.fetch(interaction.channelId)

				//suche alle vorhandenen Permissions durch uns suche die raus die roles sind
				let permissionRoles = []

				await channel.permissionOverwrites.cache.forEach(permissionObj => {

					if(interaction.guild.members.cache.some(member => member.id == permissionObj.id)){
						permissionRoles.push(permissionObj.id)
					}
				});

				const combinedPermissionRoles = [].concat(permissionRoles, interaction.values);

				//permission Array mit dem channel besitzer schon voreingestellt
				let permissionOverwritesArray = [
					{
						id: interaction.user.id,
						allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
					},
				]

				for (let i = 0; i < combinedPermissionRoles.length; i++) {

					permissionOverwritesArray.push({
						id: combinedPermissionRoles[i],
						allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
					})
				}


				if(await isPrivateChannelAndNotViewable(channel, interaction.guild.id)){
					permissionOverwritesArray.push(
						{
							id: interaction.guild.id,
							deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
						},
					)
				}else if(await isPrivateChannel(channel, interaction.guild.id)){
					permissionOverwritesArray.push(
						{
							id: interaction.guild.id,
							deny: [PermissionFlagsBits.Connect],
						},
					)
				}else{
					permissionOverwritesArray.push(
						{
							id: interaction.guild.id,
							allow: [PermissionFlagsBits.Connect],
						},
					)
				}

				//update Permission for current channel
				let createdChannel = await channel.permissionOverwrites.set(permissionOverwritesArray);
				

				await sendVoiceChannelOptions(plugin, interaction.channel, interaction.guild.id, interaction)

			}
		})
		
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}
		return ({ saved: true, infoMessage: "Voice Creator gespeichert", infoStatus: "Info" })
	}
};
module.exports = new Plugin();

async function isPrivateChannel(channel, guildId){
	const everyoneChannelPermisson = await channel.permissionOverwrites.resolve(guildId);

	//if not set it should count as public, this is if user is new
	if(!everyoneChannelPermisson) return false

	return(everyoneChannelPermisson.deny.has(PermissionFlagsBits.Connect))
}

async function isPrivateChannelAndNotViewable(channel, guildId){

	const everyoneChannelPermisson = await channel.permissionOverwrites.resolve(guildId);

	//if not set it should count as public, this is if user is new
	if(!everyoneChannelPermisson) return false

	console.log(everyoneChannelPermisson.deny.has(PermissionFlagsBits.Connect))
	console.log(everyoneChannelPermisson.deny.has(PermissionFlagsBits.ViewChannel))
	return(everyoneChannelPermisson.deny.has(PermissionFlagsBits.Connect) && everyoneChannelPermisson.deny.has(PermissionFlagsBits.ViewChannel))
}


async function sendVoiceChannelOptions(plugin, createdChannel, guildId, interaction){


	let defaultUsersOrRoles = Array.from( createdChannel.permissionOverwrites.cache.keys() );

	let index = defaultUsersOrRoles.indexOf(guildId);

	if(!index){
		index = 0
	}

	if (index > -1) { // only splice array when item is found
		defaultUsersOrRoles.splice(index, 1); // 2nd parameter means remove one item only
	}


	const selectUser = new UserSelectMenuBuilder()
		.setCustomId(plugin.id+'-setUser')
		.setPlaceholder('Make a selection!')
		.setMaxValues(25)
		.setMinValues(0)
		.setDefaultUsers(defaultUsersOrRoles)

	const selectRoles = new RoleSelectMenuBuilder ()
		.setCustomId(plugin.id+'-setRoles')
		.setPlaceholder('Make a selection!')
		.setMaxValues(25)
		.setMinValues(0)
		.setDefaultRoles(defaultUsersOrRoles)


	const userlimit = createdChannel.userLimit

	console.log(createdChannel)
	console.log(userlimit)

	const userlimitNone = new StringSelectMenuOptionBuilder().setLabel('Kein Limit').setValue('0')
	if(userlimit == 0) userlimitNone.setDefault(true)

	const userlimit1 = new StringSelectMenuOptionBuilder().setLabel('1').setValue('1')
	if(userlimit == 1) userlimit1.setDefault(true)

	if(userlimit == 1) console.log(userlimit1)

	const userlimit2 = new StringSelectMenuOptionBuilder().setLabel('2').setValue('2')
	if(userlimit == 2) userlimit2.setDefault(true)

	const userlimit3 = new StringSelectMenuOptionBuilder().setLabel('3').setValue('3')
	if(userlimit == 3) userlimit3.setDefault(true)

	const userlimit4 = new StringSelectMenuOptionBuilder().setLabel('4').setValue('4')
	if(userlimit == 4) userlimit4.setDefault(true)

	const userlimit5 = new StringSelectMenuOptionBuilder().setLabel('5').setValue('5')
	if(userlimit == 5) userlimit5.setDefault(true)

	const userlimit6 = new StringSelectMenuOptionBuilder().setLabel('6').setValue('6')
	if(userlimit == 6) userlimit6.setDefault(true)

	const userlimit7 = new StringSelectMenuOptionBuilder().setLabel('7').setValue('7')
	if(userlimit == 7) userlimit7.setDefault(true)

	const userlimit8 = new StringSelectMenuOptionBuilder().setLabel('8').setValue('8')
	if(userlimit == 8) userlimit8.setDefault(true)
		
	const userlimit9 = new StringSelectMenuOptionBuilder().setLabel('9').setValue('9')
	if(userlimit == 9) userlimit9.setDefault(true)

	const userlimit10 = new StringSelectMenuOptionBuilder().setLabel('10').setValue('10')
	if(userlimit == 10) userlimit10.setDefault(true)

	const userlimit15 = new StringSelectMenuOptionBuilder().setLabel('15').setValue('15')
	if(userlimit == 15) userlimit15.setDefault(true)

	const userlimit20 = new StringSelectMenuOptionBuilder().setLabel('20').setValue('20')
	if(userlimit == 20) userlimit20.setDefault(true)

	const userlimit30 = new StringSelectMenuOptionBuilder().setLabel('30').setValue('30')
	if(userlimit == 30) userlimit30.setDefault(true)

	const userlimitSelectMenu = new StringSelectMenuBuilder()
		.setCustomId(plugin.id+'-setUserLimit')
		.setPlaceholder('Setze Userlimit')
		.addOptions(
			userlimitNone,
			userlimit1,
			userlimit2,
			userlimit3,
			userlimit4,
			userlimit5,
			userlimit6,
			userlimit7,
			userlimit8,
			userlimit9,
			userlimit10,
			userlimit15,
			userlimit20,
			userlimit30
		)

	const rowUserlimitSelectMenu = new ActionRowBuilder()
		.addComponents(userlimitSelectMenu);

	const button = new ButtonBuilder()
		.setCustomId(plugin.id+'-setPrivacy')
		.setLabel(' ')
		.setEmoji('🔐')
		.setStyle(ButtonStyle.Secondary);

	const buttonDeleteChannel = new ButtonBuilder()
		.setCustomId(plugin.id+'-deleteChannel')
		.setLabel('Schließen')
		.setStyle(ButtonStyle.Danger);


	const channelNameButton = new ButtonBuilder()
		.setCustomId(plugin.id+'-openChangeNameModal')
		.setLabel('Name')
		.setEmoji('✏️')
		.setStyle(ButtonStyle.Secondary);


	const firstRow = new ActionRowBuilder()
		.addComponents(button, channelNameButton, buttonDeleteChannel)


		console.log("xxx");
		console.log(await isPrivateChannelAndNotViewable(createdChannel, guildId))
		console.log(await isPrivateChannel(createdChannel, guildId))

	

	const row = new ActionRowBuilder()
		.addComponents(selectUser)

	const row2 = new ActionRowBuilder()
			.addComponents(selectRoles);

	if(interaction){
		if(await isPrivateChannelAndNotViewable(createdChannel, guildId)){
			await interaction.update({
				components: [firstRow, rowUserlimitSelectMenu, row, row2],
				files: ['plugins/voiceCreator/images/privatAndNotViewable.png'],
			})
		}else if(await isPrivateChannel(createdChannel, guildId)){
	
			await interaction.update({
				components: [firstRow, rowUserlimitSelectMenu, row, row2],
				files: ['plugins/voiceCreator/images/privat.png'],
			})
		}else{
			await interaction.update({
				components: [firstRow, rowUserlimitSelectMenu],
				files: ['plugins/voiceCreator/images/open.png'],
			})
		}
	}else{
		if(await isPrivateChannelAndNotViewable(createdChannel, guildId)){
			await createdChannel.send({
				components: [firstRow, rowUserlimitSelectMenu, row, row2],
				files: ['plugins/voiceCreator/images/privatAndNotViewable.png'],
			})
		}else if(await isPrivateChannel(createdChannel, guildId)){
	
			await createdChannel.send({
				components: [firstRow, rowUserlimitSelectMenu, row, row2],
				files: ['plugins/voiceCreator/images/privat.png'],
			})
		}else{
			await createdChannel.send({
				components: [firstRow, rowUserlimitSelectMenu],
				files: ['plugins/voiceCreator/images/open.png'],
			})
		}
	}
}