const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const { v4: uuidv4 } = require('uuid');


class Plugin {
	async execute(client, plugin) {

		let userCache = new Set()


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

		let welcomeText1 = "Willkommen <@newUser> bei"
		welcomeText1 = welcomeText1.replace('<@newUser>', member.displayName);

		let welcomeText2 = '<@newUser>'
		welcomeText2 = welcomeText2.replace('<@newUser>', member.displayName);

		let message1coordinateX = 500
		let message1coordinateY = 256
		let message2coordinateX = 200
		let message2coordinateY = 220

		
		let imageCoordinateX = 426+4
		let imageCoordinateY = 52+4

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


		//await downloadImage("https://storage.googleapis.com/" + plugin['var'].backgroundImage, './temp/backgroundImage-' + member.user.id + '-'+uuid+'.png')

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
			`<svg width="1000" height="400">
				<style>
					.Rrrrr {
						font-size:40px;
						fill: #fff;
					}
					
				</style>
				<text x="500" y="${message1coordinateY}" class="Rrrrr" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">${welcomeText1}</text>

			 
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



		await sharp('plugins/greifWelcomeMessage/welcomebanner.png')
			.composite([
				{ input: profileImage, left: parseInt(imageCoordinateX), top: parseInt(imageCoordinateY) }, 
				{ input: sharpText1, left: 0, top: 0 },
				//{ input: sharpText2, left: parseInt(message2coordinateX), top: 0 }
			])
			.toFile('temp/final-' + member.user.id + '-'+uuid+'.png')


		

		//geht sicher das zumindest ein Array vorhanden ist
		if(!plugin['var'].buttonLinks) plugin['var'].buttonLinks = []

		
			

		console.log('temp/final-' + member.user.id + '-'+uuid+'.png')

		await channel.send({
			content: '<@' + member.id + '>',
			files: ['temp/final-' + member.user.id + '-'+uuid+'.png']
		})


		//delete all temp Images
		fs.unlink('./temp/profileImage-' + member.user.id + '-'+uuid+'.webp', function (err, result) {
			if (err) console.log('error', err);
		})
		fs.unlink('./temp/final-' + member.user.id + '-'+uuid+'.png', function (err, result) {
			if (err) console.log('error', err);
		})


}
