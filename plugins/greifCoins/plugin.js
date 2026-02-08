
const dataManager = require("../../discordBot/lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');


var CronJob = require('cron').CronJob;

let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../discordBot/lib/helper.js')
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');

const PluginManager = require("../../discordBot/lib/PluginManager.js");
const helper = require("../../discordBot/lib/helper.js");
const VariableManager = require("../../discordBot/lib/VariableManager.js");

const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");


class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].name1) {

				//get User by eingabe oder der der es ausgeführt hat bei keiner eingabe
				let discordUser = interaction.options.getUser('user')
				let discordId = ""
				if (discordUser) {
					discordId = discordUser.id
				} else {
					discordId = interaction.user.id
				}

				let discordUserDatabase = await getUserCurrencyFromDatabase(discordId, db)

				//wurde kein user gefunden nicht ausführen
				if (discordUserDatabase) {

					var coins = discordUserDatabase[plugin['var'].coins]
					if (!coins) coins = 0
					coins = parseInt(coins)

					const sharp = require('sharp')

					let mergeArray = []

					mergeArray.push({ input: getTextBufferRight(coins, 50, 45), left: 0, top: 0 })

					const fs = require('fs');

					//needed to fix lock bug and I cant unlink
					sharp.cache(false);

					let backgroundFilename = 'background.png'
					
					await sharp('plugins/greifCoins/images/'+backgroundFilename)
						.composite(mergeArray)
						.toFile('temp/finalpicture.png')



					await interaction.reply({
						files: ['temp/finalpicture.png'],
						ephemeral: true
					})

					fs.unlink('./temp/finalpicture.png', function (err, result) {
						if (err) console.log('error', err);
					})


					return 


				} else {

					return await interaction.reply({
						content: 'Fehler beim anzeigen',
						ephemeral: true
					});

				}

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

		return ({ saved: true, infoMessage: "System geupdatet", infoStatus: "Info" })
	}
	async addCommands(plugin, commandMap) {

		//if(!commandMap) return

		if (!(
			plugin['var'].name1 &&
			plugin['var'].description1 &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
			.setName(plugin['var'].name1)
			.setDescription(plugin['var'].description1)
			.addUserOption(option =>
				option
					.setName('user')
					.setDescription('The user')
					.setRequired(false)
			)
		)

	}
};
module.exports = new Plugin();

function getTextBuffer(text, x, y, fontsizeInPixel) {

	if(!fontsizeInPixel) fontsizeInPixel = 14

	return Buffer.from(
		`<svg width="100" height="60">
			<style>
				.Rrrrr {
					font-size:${fontsizeInPixel}px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">${text}</text>
			

		  </svg>`
	)
}

function getTextBufferRight(text, x, y, fontsizeInPixel) {

	if(!fontsizeInPixel) fontsizeInPixel = 14

	return Buffer.from(
		`<svg width="100" height="60">
			<style>
				.Rrrrr {
					font-size:${fontsizeInPixel}px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="end">${text}</text>
			

		  </svg>`
	)
}
