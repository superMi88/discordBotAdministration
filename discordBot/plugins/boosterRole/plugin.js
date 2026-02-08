const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");


let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../lib/helper.js')

const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ChannelType, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, ModalBuilder } = require('discord.js');
var CronJob = require('cron').CronJob;



var ObjectId = require('mongodb').ObjectId;

class Plugin {
	async execute(client, plugin) {

		let channel = await client.channels.cache.get(plugin['var'].channelMessage)

		if (channel) {
			let message = await channel.messages.fetch(plugin['var'].messageId)
		}

		let db = DatabaseManager.get()

		if (!plugin.cronJob) plugin.cronJob = []
		plugin.cronJob.push(
			//0 0 0 * * * //TODO change to everyday not every minute
			new CronJob('0 * * * * *', async function () {
				
				
				const collection = db.collection('userCollection');

				let arrUserWithRole = await collection.find({ ["currency.boosterRole_" + plugin.id]: { $exists: true } }).toArray();

				console.log(arrUserWithRole)

				
				for (const user of arrUserWithRole) {

					let member = channel.guild.members.cache.get(user.discordId)

					if(!member.premiumSinceTimestamp){
						//user in array dont have a booster role 
						console.log("member dont have boosterRole")
						console.log(member)

						console.log(user)

						console.log(user.currency["boosterRole_" + plugin.id].roleId)

						const roleId = user.currency["boosterRole_" + plugin.id].roleId

						
						//db.collection.update({ _id: yourDocumentId }, { $unset: { fieldName: 1 } })

						const role = channel.guild.roles.cache.get(roleId);

						if (role) {
							try {
								await role.delete();

								//save createdRole to user
								const filteredDocs = await collection.updateOne(
									{ discordId: user.discordId},
									{
										$unset: {
											["currency." + "boosterRole_" + plugin.id]: 1,
										}
									}
								);

								console.log(`Role with ID ${roleId} deleted successfully.`);
							} catch (error) {
								console.error(`Error deleting role: ${error.message}`);
							}
						} else {
							console.log(`Role with ID ${roleId} not found.`);
						}


						


					}
				}



			}, null, true)

		)

		plugin.on(client, 'interactionCreate', async interaction => {


			if (isButton(interaction, 'showSetRoleNameModal-' + plugin.id)) {

				const modal = new ModalBuilder()
					.setCustomId('setRoleName-' + plugin.id)
					.setTitle('Rollenname');

				// Add components to modal

				// Create the text input components
				const firstComponent = new TextInputBuilder()
					.setCustomId('name')
					// The label is the prompt the user sees for this input
					.setLabel("Wie soll die rolle heißen?")
					// Short means only a single line of text
					.setStyle(TextInputStyle.Short);


				// An action row only holds one text input,
				// so you need one action row per text input.
				const firstActionRow = new ActionRowBuilder().addComponents(firstComponent);

				// Add inputs to the modal
				modal.addComponents(firstActionRow);

				// Show the modal to the user
				await interaction.showModal(modal);

			}

			if (interaction.customId == 'setRoleName-'+plugin.id) {

				//let channel = await client.channels.fetch(plugin['var'].shopChannel)


				let newRoleName = interaction.fields.getTextInputValue('name');
				let color = '#111111'

				const [firstPart, secondPart] = splitAtFirstHyphen(newRoleName);
				
				
				if(!secondPart){
					newRoleName = firstPart
				}
				if(secondPart){
					newRoleName = secondPart
					color = firstPart
				}

				if(!isValidHexCode(color)) return await interaction.reply({ content: 'Hex code passt nicht', ephemeral: true });


				console.log("newRoleName: "+newRoleName)
				console.log("color: "+color)


				let discordUserDatabase = await getUserCurrencyFromDatabase(interaction.user.id, db)

				let roleObj = discordUserDatabase["boosterRole_" + plugin.id]


				console.log(interaction)

				console.log(discordUserDatabase)
				console.log(roleObj)

				//es exestiert schon eine rolle für diesen user
				if(roleObj){

					const role = interaction.guild.roles.cache.get(roleObj.roleId);

					console.log(role)

					if (role) {
						try {
							await role.edit({ name: newRoleName, color: color });
							console.log(`Role name and color for ID ${roleObj.roleId} successfully updated.`);
						} catch (error) {
							console.error(`Error updating role: ${error.message}`);
						}
					} else {
						console.log(`Role with ID ${roleObj.roleId} not found.`);
					}


				}

				if(!roleObj){

					
					console.log(interaction.member.guild)

					console.log(interaction.member.guild.roles.cache)

					const roleAbove = interaction.member.guild.roles.cache.find(role => role.id === plugin['var'].roleAbove);
					

					console.log(roleAbove)

					const rawPosition = roleAbove.rawPosition


					let createdRole = await interaction.member.guild.roles.create({
						name: newRoleName,
						color: color,
						reason: 'add custom role',
						/*position: (rawPosition)*/ //disabled for now
					})

					console.log(createdRole)

					
					interaction.member.roles.add(createdRole)


					const collection = db.collection('userCollection');

					//save createdRole to user
					const filteredDocs = await collection.updateOne(
						{ discordId: interaction.user.id},
						{
							$set: {
								["currency." + "boosterRole_" + plugin.id]: 
								{
									roleId: createdRole.id,
								},
							}
						}
					);


				}

	
				return await interaction.reply({ content: 'Eine Rolle wurde erstellt', ephemeral: true });


				/*


				let permissionArray = 
				[
					{
					  id: interaction.user.id, // Ersetze dies durch die ID des Benutzers, der Zugriff haben soll
					  allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
					  deny: [PermissionsBitField.Flags.ManageChannels]
					},
					{
					  id: interaction.guildId,
					  deny: [PermissionsBitField.Flags.ViewChannel]
					}
				]

				for (let i = 0; i < plugin['var'].moderatorRole.length; i++) {
					const roleId = plugin['var'].moderatorRole[i].roleId;
					
					permissionArray.push(
						{
							id: roleId,
							allow: [PermissionsBitField.Flags.ViewChannel]
						}
					)
				}
				
				//ticket channel
				let channel = null
	
				if (!interaction.channel.parent) {
					channel = await interaction.guild.channels.create({
						name: "ticket-"+interaction.user.username,
						type: ChannelType.GuildText,
						permissionOverwrites: permissionArray
					});


					


					await interaction.reply({
						content: 'Dein Ticket wurde erstellt!', 
						ephemeral: true 
					});
					return;
				}
				

				if (interaction.channel.parent) {
					channel = await interaction.channel.parent.children.create({
						name: "ticket-"+interaction.user.username,
						type: ChannelType.GuildText, 
						permissionOverwrites: permissionArray
					});

					
				
					await interaction.reply({
						content: 'Dein Ticket wurde erstellt!', 
						ephemeral: true 
					});
					return;
				}*/
	
			}
		})
		

		
	}
	async create(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		//delete old Message if exist
		//await deleteMessage(client, plugin, db)

		let channel = await client.channels.cache.get(plugin['var'].channelMessage)

		const exampleEmbed = new EmbedBuilder()
			.setColor('#2b2d31')
			.setDescription("Erstelle eine eigene Rolle, bei der eingabe kann ein hex-code für die Farbe hinzugefügt werden: hexcode-rollenname zB. #FF990D-Karotte \n\n"
				+"Links wo man den hex code einer Farbe bekommt: \n"
				+"- https://htmlcolorcodes.com/color-picker/ \n"
				+"- https://redketchup.io/color-picker"
			)
			.setTitle("Custom Role")

		const actionRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('showSetRoleNameModal-' + plugin.id)
					.setLabel('Erstelle')
					.setStyle(ButtonStyle.Primary)
			);

		let message = await channel.send({ 
			embeds: [exampleEmbed],
			components: [actionRow]
		})


		await saveMessageArray(db, plugin.id, message.channelId, message.id)
		
		return ({ saved: true, infoMessage: "Embed wurde erstellt", infoStatus: "Info" })
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}
		
		return ({ saved: true, infoMessage: "Daten wurden gespeichert", infoStatus: "Info" })
	}
	async delete(plugin, config) {

		let db = DatabaseManager.get()
		let client = dataManager.client

		await deleteMessage(client, plugin, db)
		return ({ saved: true, infoMessage: "Embed wurde gelöscht", infoStatus: "Info" })
	}
};

module.exports = new Plugin();



async function deleteMessage(client, plugin, db) {
	const { channelId, messageIdArray } = await getMessageIdArray(db, plugin.id)

	if (channelId && messageIdArray) {
		let channel = await client.channels.fetch(channelId)

		for (let i = 0; i < messageIdArray.length; i++) {
			const messageId = messageIdArray[i];
			let message = await channel.messages.fetch(messageId)
			message.delete()
		}

		
		await saveMessageArray(db, plugin.id, '', [])
	}
}

async function saveMessageArray(db, pluginId, channelId, messageIdArray) {

	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.updateOne(
		{ _id: ObjectId(pluginId) },
		{
			$set: {
				channelId: channelId,
				messageIdArray: messageIdArray
			}
		}
	);

	return filteredDocs;
}

async function getMessageIdArray(db, pluginId) {

	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.findOne(
		{ _id: ObjectId(pluginId) }
	);

	return {
		channelId: filteredDocs.channelId,
		messageIdArray: filteredDocs.messageIdArray
	}
}


function isButton(interaction, buttonId) {
	if (interaction.customId && (interaction.customId == buttonId || interaction.customId.includes(buttonId + "-"))) {
		return true
	}
	return false
}


function splitAtFirstHyphen(str) {
	const parts = str.split('-');
	if (parts.length === 1) {
	  return [str, '']; // No hyphen found, return the original string and an empty string
	} else {
	  return [parts[0], parts.slice(1).join('-')]; // Return the first part and the rest joined with "-"
	}
}


function isValidHexCode(hexCode) {
	const regex = /^#[a-f0-9]{6}$/i;
	return regex.test(hexCode);
}
