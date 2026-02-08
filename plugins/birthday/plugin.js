const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');

const { PermissionsBitField  } = require('discord.js');

var CronJob = require('cron').CronJob;

var ObjectId = require('mongodb').ObjectId;

class Plugin {
	async execute(client, plugin) {

		let channel = await client.channels.cache.get(plugin['var'].channelRules)

		if (channel) {
			let message = await channel.messages.fetch(plugin['var'].messageId)
		}

		await setBirthdayRole(client, plugin)

		//shop reset um 0 Uhr
		if (!plugin.cronJob) plugin.cronJob = []
		
		plugin.cronJob.push(
			//0 0 0 * * *
			new CronJob('0 0 0 * * *', async function () {
				await setBirthdayRole(client, plugin)
			}, null, true)

		)

		plugin.on(client, 'interactionCreate', async interaction => {


			if (interaction.customId === 'addBirthday-' + plugin.id) {

				let db = DatabaseManager.get()

				const dateString = interaction.fields.getTextInputValue('date');

				let arr = dateString.split("-")

				let birthdayObj = {}
				//wenn eine ungültige eingabe getätigt wird error=true
				let error = false

				//wenn Jahr angegeben ist prüfe es grob und füge es hinzu
				if(arr.length == 2 || arr.length == 3){

					let day = parseInt(arr[0])
					let month = parseInt(arr[1])
					let year = false
					
					console.log("abfrage")
					console.log(!isNaN(day) && day > 0 && day < 31 && !isNaN(month) && month > 0 && month < 12)

					if(
						!isNaN(day) && day > 0 && day <= 31 &&
						!isNaN(month) && month > 0 && month <= 12
					)
					{
						birthdayObj = {
							day: day,
							month: month
						}
						
					}else{
						error = true
					}

					//wenn Jahr angegeben ist prüfe es grob und füge es hinzu
					if(arr.length == 3){

						let year = parseInt(arr[2])

						if(!isNaN(year) && year > 1900 && year < (new Date().getFullYear())){
							
							birthdayObj = {
								day: day,
								month: month,
								year: year
							}
						}else{
							error = true
						}
					}

				}else{
					error = true
				}
			
				if(error){
					await interaction.reply({ content: 'Ungültiges Format, das Format muss TT-MM-JJJJ oder TT-MM entsprechen um gültig zu sein zB. 30-07-1997, 14-03', ephemeral: true });
					return
				}

				const collection = db.collection('userCollection');

				const returnvalue = await collection.updateOne(
					{ discordId: interaction.user.id },
					{
						$set: {
							["birthday"]: birthdayObj
						}
					}
				);

				//update birthday role for everyone, this should normaly only update this player who sets his birthday today
				await setBirthdayRole(client, plugin)

				await interaction.reply({ content: 'Dein Geburtstag wurde erfolgreich eingetragen', ephemeral: true });

			}

			if (isButton(interaction, 'getBirthdayModal')) {

				const modal = new ModalBuilder()
					.setCustomId('addBirthday-' + plugin.id)
					.setTitle('Frage');

				// Add components to modal

				// Create the text input components
				const firstComponent = new TextInputBuilder()
					.setCustomId('date')
					// The label is the prompt the user sees for this input
					.setLabel("Wann ist dein Geburtstag? TT-MM-JJJJ/TT-MM")
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
		await deleteMessage(client, plugin, db)

		let channel = await client.channels.cache.get(plugin['var'].channelTicket)

		let description = "Setze dein Geburtstag"

		if(plugin['var'].description && plugin['var'].description.length > 1){
			description = plugin['var'].description
		}

		const exampleEmbed = new EmbedBuilder()
			.setColor('#2b2d31')
			.setDescription(description)
			.setTitle("Geburtstag")

		const actionRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('getBirthdayModal')
					.setLabel('Eintragen')
					.setStyle(ButtonStyle.Primary)
			);

		let message = await channel.send({ 
			embeds: [exampleEmbed],
			components: [actionRow]
		})


		await saveMessage(db, plugin.id, message.channelId, message.id)
		
		return ({ saved: true, infoMessage: "Embed wurde erstellt", infoStatus: "Info" })
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
	const { channelId, messageId } = await getMessageId(db, plugin.id)

	if (channelId && messageId) {

		try{
			let channel = await client.channels.fetch(channelId)
			let message = await channel.messages.fetch(messageId)
			message.delete()

		}catch(e){
			//mach nichts, die message wurde wahrscheinlich schon gelöscht
		}

		await saveMessage(db, plugin.id, '', '')
	}
}

async function saveMessage(db, pluginId, channelId, messageId) {

	const collection = db.collection('pluginCollection');

	const filteredDocs = await collection.updateOne(
		{ _id: ObjectId(pluginId) },
		{
			$set: {
				channelId: channelId,
				messageId: messageId
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
		channelId: filteredDocs.channelId,
		messageId: filteredDocs.messageId
	}
}


function isButton(interaction, buttonId) {
	if (interaction.customId && (interaction.customId == buttonId || interaction.customId.includes(buttonId + "-"))) {
		return true
	}
	return false
}




async function setBirthdayRole(client, plugin) {

	//set birthday role and unset birthday role
	let db = DatabaseManager.get()

	const collection = db.collection('userCollection');

	var currentdate = new Date()

	function isLeapYear() { 
		return ((currentdate.getFullYear() % 4 == 0 && 
		currentdate.getFullYear() % 100 != 0)) || 
		(currentdate.getFullYear() % 400 == 0)
	}


	let allUserInDatabase = await collection.find(
		{ $and: [
			{"birthday.day": currentdate.getDate()}, 
			{"birthday.month": currentdate.getMonth()+1} 
		]}
	).toArray()

	//wenn erster Mai im SchaltJahr dann haben die am 29.Februar auch hier Geburtstag
	if(isLeapYear() && currentdate.getMonth()+1 == 3 && currentdate.getDate() == 1){
		let allUserInDatabaseLeapYear = await collection.find(
			{ $and: [
				{"birthday.day": 29}, 
				{"birthday.month": 2} 
			]}
		).toArray()
		allUserInDatabase = allUserInDatabase.concat(allUserInDatabaseLeapYear)
	}

	const guild = await client.guilds.fetch(plugin['var'].server)
	
	//remove birthday role on everyone 
	let usersIdsWithBirthdayRole = guild.roles.cache.get(plugin['var'].birthdayRole).members.map(m=>m.user.id);
	for (let i = 0; i < usersIdsWithBirthdayRole.length; i++) {
		const discordUserId = usersIdsWithBirthdayRole[i];
	
		let discordMember = await guild.members.resolve(discordUserId);

		//warte bis es gelöscht wird da es später unter umständen wieder hinzugefügt wird
		await discordMember.roles.remove(plugin['var'].birthdayRole);
	}

	//add birthday role on birthday user
	for (let i = 0; i < allUserInDatabase.length; i++) {
		const user = allUserInDatabase[i];
		
		let discordMember = await guild.members.resolve(user.discordId);

		discordMember.roles.add(plugin['var'].birthdayRole)

		//wenn ein Jahr exestiert gebe die entsprechende Altersrolle
		if(plugin['var'].ageRoleArray && user.birthday.year){

			plugin['var'].ageRoleArray.sort(function (a, b) {
				var valueA, valueB;
	
				valueA = a["numberString"]; // Where 1 is your index, from your example
				valueB = b["numberString"];
				if (valueA < valueB) {
					return -1;
				}
				else if (valueA > valueB) {
					return 1;
				}
				return 0;
			});

			let alter = currentdate.getFullYear() - user.birthday.year
			
			let i = 0;
			let ageRoleToGive = false

			while(plugin['var'].ageRoleArray[i].numberString <= alter && i < plugin['var'].ageRoleArray[i].length){

				//lösche vorherige Age Role wenn es nicht die erste/jüngste ist
				if(i > 0 && discordMember.roles.cache.has(plugin['var'].ageRoleArray[i-1].ageRole)){
					discordMember.roles.remove(plugin['var'].ageRoleArray[i-1].ageRole)
				}

				ageRoleToGive = plugin['var'].ageRoleArray[i].ageRole
				i++
			}
			if(ageRoleToGive){
				discordMember.roles.add(ageRoleToGive)
			}
			
		
			
		}

	}
}
