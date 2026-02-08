const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const { v4: uuidv4 } = require('uuid');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');


class Plugin {
	async execute(client, plugin) {

		let userCache = new Set()

		/*
		client.on('guildMemberUpdate', (oldMember, newMember) => {
			if (oldMember.pending && !newMember.pending) {
				
				if(userCache.has(newMember.user.id)) return
					userCache.add(newMember.user.id)
					createjoinMessage(plugin, client, newMember)
					setTimeout(() =>{
						userCache.delete(newMember.user.id)
					}, /*1000 * 60 * 60 * 24*/ /*30000) //keine neue join message wenn es kürzer her ist als 24 stunden
			}
		});*/

		plugin.on(client, 'guildMemberAdd', async member => {
			
			createjoinMessage(plugin, client, member)
		});

		

	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		return ({ saved: true, infoMessage: "Infos gespeichert", infoStatus: "Info" })
	}
};
module.exports = new Plugin();




async function createjoinMessage(plugin, client, member){

		var uuid = uuidv4()

		//wenn der status von pending von true auf false springt führe den ganzen code hier unten drunter aus
		//if (!(oldMember.pending == true && newMember.pending == false)) return ""

		//let member = newMember

		let channel = await client.channels.fetch(plugin['var'].welcomeChannel)

		//let welcomeText1 = "Willkommen im kleinen Wald!"

		let welcomeText1 = plugin['var'].welcomeText1
		welcomeText1 = welcomeText1.replace('<@newUser>', member.displayName);

		let welcomeText2 = plugin['var'].welcomeText2
		welcomeText2 = welcomeText2.replace('<@newUser>', member.displayName);

		let message1coordinateX = plugin['var'].coordinateX1
		let message1coordinateY = plugin['var'].coordinateY1
		let message2coordinateX = plugin['var'].coordinateX2
		let message2coordinateY = plugin['var'].coordinateY2

		
		let imageCoordinateX = plugin['var'].coordinateX3
		let imageCoordinateY = plugin['var'].coordinateY3

		const fs = require('fs');
		request = require('request');

		//download function
		function downloadImage(url, filepath) {
			return new Promise((resolve, reject) => {
				require('https').get(url, (res) => {
					if (res.statusCode === 200) {
						res.pipe(fs.createWriteStream(filepath))
							.on('error', reject)
							.once('close', () => resolve(filepath));
					} else {
						// Consume response data to free up memory
						res.resume();
						reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

					}
				});
			});
		}

		//download Image and save them in temp folder
		await downloadImage(member.displayAvatarURL(), './temp/profileImage-' + member.user.id + '-'+uuid+'.webp')
		await downloadImage("https://storage.googleapis.com/" + plugin['var'].backgroundImage, './temp/backgroundImage-' + member.user.id + '-'+uuid+'.png')

		const sharp = require('sharp')

		//needed to fix lock bug and I cant unlink profileImage than
		sharp.cache(false);

		let size = 140

		//create rounded Buffer Svg to make Image round later
		const roundedCorners = Buffer.from(
			`<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size}" ry="${size}"/></svg>`
		);

		/* <rect x="0" y="0" width="${200}" height="${100}"/> */
		const textBuffer1 = Buffer.from(
			`<svg>
				<style>
					.Rrrrr {
						font-size:50px;
						fill: #fff;
					}
					.backgroundColor {
						fill: #2f3136;
						
					}
					
				</style>
				<rect x="0" y="0" width="${200}" height="${100}" class="backgroundColor" fill-opacity="0"/>
				<text x="0" y="${message1coordinateY}" height="${100}" class="Rrrrr" font-family="Arial, Helvetica, sans-serif">${welcomeText1}</text>

			  </svg>`
		);
		let sharpText1 = await sharp(textBuffer1).toBuffer()

		const textBuffer2 = Buffer.from(
			`<svg>
				<style>
					.Rrrrr {
						font-size:50px;
						fill: #fff;
					}
					.backgroundColor {
						fill: #2f3136;
						
					}
					
				</style>
				<rect x="0" y="0" width="${200}" height="${100}" class="backgroundColor" fill-opacity="0"/>
				<text x="0" y="${message2coordinateY}" height="${100}" class="Rrrrr" font-family="Arial, Helvetica, sans-serif">${welcomeText2}</text>

			  </svg>`
		);
		let sharpText2 = await sharp(textBuffer2).toBuffer()

		let profileImage = await sharp('temp/profileImage-' + member.user.id + '-'+uuid+'.webp').resize(size).composite([
			{ input: roundedCorners, blend: "dest-in" }
		]).png().toBuffer()



		await sharp('temp/backgroundImage-' + member.user.id + '-'+uuid+'.png')
			.composite([
				{ input: profileImage, left: parseInt(imageCoordinateX), top: parseInt(imageCoordinateY) }, 
				{ input: sharpText1, left: parseInt(message1coordinateX), top: 0 },
				{ input: sharpText2, left: parseInt(message2coordinateX), top: 0 }
			])
			.toFile('temp/final-' + member.user.id + '-'+uuid+'.png')


		

		//geht sicher das zumindest ein Array vorhanden ist
		if(!plugin['var'].buttonLinks) plugin['var'].buttonLinks = []

		const row = new ActionRowBuilder()

		for (let i = 0; i < plugin['var'].buttonLinks.length; i++) {
			const buttonCreatorObj = plugin['var'].buttonLinks[i];
			
			console.log(buttonCreatorObj.buttonEmoji)

			row.addComponents(
				new ButtonBuilder()
					.setLabel(buttonCreatorObj.buttonName)
					.setURL(buttonCreatorObj.link)
					.setEmoji(buttonCreatorObj.buttonEmoji)
					.setStyle(ButtonStyle.Link),
			);

		}
			

		await channel.send({
			content: '<@' + member.id + '>',
			files: ['temp/final-' + member.user.id + '-'+uuid+'.png'],
			components: [row]
		})


		//delete all temp Images
		fs.unlink('./temp/backgroundImage-' + member.user.id + '-'+uuid+'.png', function (err, result) {
			if (err) console.log('error', err);
		})
		fs.unlink('./temp/profileImage-' + member.user.id + '-'+uuid+'.webp', function (err, result) {
			if (err) console.log('error', err);
		})
		fs.unlink('./temp/final-' + member.user.id + '-'+uuid+'.png', function (err, result) {
			if (err) console.log('error', err);
		})


}
