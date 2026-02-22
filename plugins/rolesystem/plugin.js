
const dataManager = require("../../discordBot/lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

const { v4: uuidv4 } = require('uuid');

var CronJob = require('cron').CronJob;

let { getUserCurrencyFromDatabase, updateUserFromDatabase } = require('../../discordBot/lib/helper.js')
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');

const PluginManager = require("../../discordBot/lib/PluginManager.js");
const helper = require("../../discordBot/lib/helper.js");
const VariableManager = require("../../discordBot/lib/VariableManager.js");

const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");

// Ganz oben, z.B. direkt nach den Imports oder als konstante Variable in der Plugin-Klasse:
const RANKS = [
	{ name: "maus", xp: 0, label: "Maus", roleIdKey: "rolesMaus", descriptionKey: "descriptionRankupMaus", image: 'plugins/rolesystem/images/maus.png' },
	{ name: "frosch", xp: 30, label: "Frosch", roleIdKey: "rolesFrosch", descriptionKey: "descriptionRankupFrosch", image: 'plugins/rolesystem/images/frosch.png' },
	{ name: "eichhoernchen", xp: 500, label: "Eichhörnchen", roleIdKey: "rolesEichhoernchen", descriptionKey: "descriptionRankupEichhoernchen", image: 'plugins/rolesystem/images/eichhoernchen.png' },
	{ name: "waschbaer", xp: 2000, label: "Waschbär", roleIdKey: "rolesWaschbaer", descriptionKey: "descriptionRankupWaschbaer", image: 'plugins/rolesystem/images/waschbaer.png' },
	{ name: "eule", xp: 7500, label: "Eule", roleIdKey: "rolesEule", descriptionKey: "descriptionRankupEule", image: 'plugins/rolesystem/images/eule.png' },
	{ name: "fuchs", xp: 15000, label: "Fuchs", roleIdKey: "rolesFuchs", descriptionKey: "descriptionRankupFuchs", image: 'plugins/rolesystem/images/fuchs.png' },
	{ name: "wildkuh", xp: 25000, label: "Wildkuh", roleIdKey: "rolesWildkuh", descriptionKey: "descriptionRankupWildkuh", image: 'plugins/rolesystem/images/wildkuh.png' },
	{ name: "hirsch", xp: 40000, label: "Hirsch", roleIdKey: "rolesHirsch", descriptionKey: "descriptionRankupHirsch", image: 'plugins/rolesystem/images/hirsch.png' },
	{ name: "wolf", xp: 50000, label: "Wolf", roleIdKey: "rolesWolf", descriptionKey: "descriptionRankupWolf", image: 'plugins/rolesystem/images/wolf.png' },
	{ name: "wildschwein", xp: 60000, label: "Wildschwein", roleIdKey: "rolesWildschwein", descriptionKey: "descriptionRankupWildschwein", image: 'plugins/rolesystem/images/wildschwein.png' },
	{ name: "baer", xp: 100000, label: "Bär", roleIdKey: "rolesBaer", descriptionKey: "descriptionRankupBaer", image: 'plugins/rolesystem/images/baer.png' },
];

function getRanksWithPluginVar(pluginVar) {
	let total = 0;

	return RANKS.map(rank => {
		total += rank.xp;
		return {
			...rank,
			roleId: pluginVar[rank.roleIdKey],
			description: pluginVar[rank.descriptionKey],
			cumulativeXp: total,
		};
	});
}

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


					const sharp = require('sharp')

					let mergeArray = []

					//füge background hinzu
					mergeArray.push({ input: 'plugins/rolesystem/images/background3.png', left: 0, top: 0 })

					var voiceActivity = discordUserDatabase[plugin['var'].voiceActivity]
					if (!voiceActivity) voiceActivity = 0
					voiceActivity = parseInt(voiceActivity)

					var chatActivity = discordUserDatabase[plugin['var'].chatActivity]
					if (!chatActivity) chatActivity = 0
					chatActivity = parseInt(chatActivity)

					const guild = await client.guilds.fetch(plugin['var'].server)

					let discordUser = await guild.members.resolve(discordId);


					let xp = voiceActivity + chatActivity;

					const rankData = getRanksWithPluginVar(plugin['var']);


					let currentRank = null;
					let nextRank = null;

					for (let i = 0; i < rankData.length; i++) {
						if (xp >= rankData[i].cumulativeXp) {
							currentRank = rankData[i];
						} else {
							nextRank = rankData[i];
							break;
						}
					}

					if (!currentRank) {
						currentRank = rankData[0]; // fallback zu Maus
					}

					// 📊 Fortschritt (zwischen 0 und 1)
					let progress = 1; // Standard: Max-Level erreicht
					if (nextRank && currentRank) {
						progress = (xp - currentRank.cumulativeXp) / (nextRank.cumulativeXp - currentRank.cumulativeXp);
						progress = Math.max(0, Math.min(1, progress)); // Clamp
					}

					console.log(currentRank?.name ?? 'unranked');

					const strokeColor = '#12ba69';      // hellgrün
					const backgroundColor = '#043116';  // dunkelgrün

					const radius = 46;
					const strokeWidth = 6;
					const circumference = 2 * Math.PI * radius;
					const progressLength = circumference * progress;

					const svgXpKreis = Buffer.from(`
					<svg width="${radius * 2 + strokeWidth}" height="${radius * 2 + strokeWidth}" viewBox="0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}" xmlns="http://www.w3.org/2000/svg">
					<!-- Hintergrund-Kreis -->
					<circle
						cx="${radius + (strokeWidth / 2)}"
						cy="${radius + (strokeWidth / 2)}"
						r="${radius}"
						stroke="${backgroundColor}"
						stroke-width="${strokeWidth}"
						fill="none"
					/>

					<!-- Fortschritts-Kreis -->
					<circle
						cx="${radius + (strokeWidth / 2)}"
						cy="${radius + (strokeWidth / 2)}"
						r="${radius}"
						stroke="${strokeColor}"
						stroke-width="${strokeWidth}"
						fill="none"
						stroke-dasharray="${progressLength} ${circumference - progressLength}"
						transform="rotate(90 ${radius + (strokeWidth / 2)} ${radius + (strokeWidth / 2)})"
					/>
					</svg>
					`);


					let nameToShow = discordUser.nickname
					if (!nameToShow) nameToShow = discordUser.user.globalName

					mergeArray.push({ input: getTextBuffer(nameToShow, 135, 125, 22), left: 0, top: 0 }) //name des Users

					let xpDisplay;
					if (nextRank) {
						xpDisplay = `XP: ${formatWithDots(xp - currentRank.cumulativeXp)} / ${formatWithDots(nextRank.cumulativeXp - currentRank.cumulativeXp)}`;
					} else {
						xpDisplay = `XP: ${formatWithDots(xp - currentRank.cumulativeXp)}`;
					}
					mergeArray.push({ input: getTextBuffer(xpDisplay, 130, 150, 13), left: 0, top: 0 });


					mergeArray.push({ input: getTextBuffer(currentRank.label, 145, 175), left: 0, top: 0 });

					let imageToPush = await sharp(currentRank.image).toBuffer();

					mergeArray.push({
						input: imageToPush,
						left: getTextStartX(currentRank.label, 135) - 24 + 10,
						top: 175 - 6,
					});




					//wenn booster
					if (discordUser.premiumSinceTimestamp) {
						let imageToPush = await sharp('plugins/rolesystem/images/booster.png').toBuffer();
						mergeArray.push({
							input: imageToPush,
							left: getTextStartX("Flower-Booster", 135) - 24 + 10, // Position wie du schon hast
							top: 199 - 6,
						});
						//mergeArray.push({ input: imageToPush, left: getTextStartX("Flower-Booster", 135)-24+10/*wegen icon 20px groß*/, top: 175-6 })
						mergeArray.push({ input: getTextBuffer("Flower-Booster", 135 + 10/*wegen icon 20px groß*/, 199), left: 0, top: 0 }) //Name der Rolle
					}


					//obere Leiste
					mergeArray.push({ input: getTextBufferLinks("Nachrichten", 50, 216 + 22, 13), left: 0, top: 0 })
					mergeArray.push({ input: getTextBufferLinks(formatWithK(chatActivity), 50, 234 + 22, 13), left: 0, top: 0 })

					mergeArray.push({ input: getTextBufferLinks("Voice/min", 179, 216 + 22, 13), left: 0, top: 0 })
					mergeArray.push({ input: getTextBufferLinks(formatWithK(voiceActivity), 179, 234 + 22, 13), left: 0, top: 0 })


					let berryUser = discordUserDatabase[plugin['var'].berry]
					if (!berryUser) berryUser = 0

					//untere Leiste
					mergeArray.push({ input: getTextBufferLinks("Beeren", 50, 216 + 83, 13), left: 0, top: 0 })
					mergeArray.push({ input: getTextBufferLinks(formatWithK(berryUser), 50, 234 + 83, 13), left: 0, top: 0 }) //TODO: anzahl von der Datenbank holen

					mergeArray.push({ input: getTextBufferLinks("Tiere", 179, 216 + 83, 13), left: 0, top: 0 })

					let animalCount = await db.collection('animals').countDocuments({ ownerDiscordId: discordId });


					mergeArray.push({ input: getTextBufferLinks(formatWithK(animalCount), 179, 234 + 83, 13), left: 0, top: 0 }) //TODO: anzahl von der Datenbank holen


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


					const fs = require('fs');

					//needed to fix lock bug and I cant unlink
					sharp.cache(false);

					let size = 86

					//create rounded Buffer Svg to make Image round later
					const roundedCorners = Buffer.from(
						`<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size}" ry="${size}"/></svg>`
					);

					var uuid = uuidv4()

					//download Image and save them in temp folder
					await downloadImage(discordUser.displayAvatarURL(), './temp/profileImage-' + discordUser.user.id + '-' + uuid + '.webp')
					let profileImage = await sharp('temp/profileImage-' + discordUser.user.id + '-' + uuid + '.webp').resize(size).composite([
						{ input: roundedCorners, blend: "dest-in" }
					]).png().toBuffer()

					mergeArray.push({ input: await sharp(svgXpKreis).toBuffer(), left: 86, top: 14 })

					mergeArray.push({ input: profileImage, left: (270 - size) / 2, top: 14 + strokeWidth })


					// Leeres transparentes Bild erstellen
					const baseImage = sharp({
						create: {
							width: 270,
							height: 350,
							channels: 4,
							background: { r: 0, g: 0, b: 0, alpha: 0 } // komplett transparent
						}
					});

					await baseImage
						.composite(mergeArray)
						.toFile('temp/finalpicture.png');


					await interaction.reply({
						files: ['temp/finalpicture.png'],
						ephemeral: true
					})


					fs.unlink('./temp/finalpicture.png', function (err, result) {
						if (err) console.log('error', err);
					})
					fs.unlink('./temp/profileImage-' + discordUser.user.id + '-' + uuid + '.webp', function (err, result) {
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
		if (!status.saved) {
			return status
		}

		await PluginManager.reloadSlashCommands()
		await PluginManager.reloadEvents()

		return ({ saved: true, infoMessage: "Rolesystem geupdatet", infoStatus: "Info" })
	}
	async assignCorrectRankRole(plugin, config) {

		let client = dataManager.client
		let db = DatabaseManager.get()

		const relativeRanks = getRanksWithPluginVar(plugin['var']);

		const guild = await client.guilds.fetch(plugin['var'].server);
		const members = await guild.members.fetch();

		members.forEach(async member => {
			if (member.user.bot) return; // Optional: Bots überspringen

			const discordUserDatabase = await getUserCurrencyFromDatabase(member.id, db);
			if (!discordUserDatabase) return;

			// XP aus Sprach- und Chataktivität berechnen
			let voiceActivity = parseInt(discordUserDatabase[plugin['var'].voiceActivity] || 0);
			let chatActivity = parseInt(discordUserDatabase[plugin['var'].chatActivity] || 0);
			let userXp = voiceActivity + chatActivity;

			await assignCorrectRankRole(member, userXp, relativeRanks);
		});

		console.log(`Alle Mitglieder durchgegangen.`);
	}
	async addEvents(plugin, eventsArray) {

		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Event,
				variable: plugin['var'].chatActivity,
				message: "benachrichte mich wenn chat erhört wird"
			},
		)
		eventsArray.push(
			{
				pluginId: plugin.id,
				pluginTag: plugin.pluginTag,
				type: VariableManager.Event,
				variable: plugin['var'].voiceActivity,
				message: "benachrichte mich wenn voice erhört wird"
			},
		)


		/*
		VariableManager.addEvent(client, plugin,
			[
				VariableManager.create(VariableManager.Event, plugin['var'].chatActivity, "benachrichte mich wenn chat erhört wird"),
				VariableManager.create(VariableManager.Event, plugin['var'].voiceActivity, "benachrichte mich wenn voice erhört wird")
			]
		)*/
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
	async triggerEvent(client, plugin, db, discordUserId, currencyId, oldValue, newValue) {

		console.log("Hier wird der trigger ausgeführt von: " + currencyId)
		console.log(oldValue)
		console.log(newValue)

		messageCounterAdd(plugin, client, discordUserId, currencyId, oldValue, newValue, db)
	}

};
module.exports = new Plugin();

//gebe einer Person Karma 
//logFixed -> nachkommastellen in der log ausgabe

async function messageCounterAdd(plugin, client, discordUserId, currencyId, oldActivityValue, newActivityValue, db) {
	if (isNaN(oldActivityValue) || isNaN(newActivityValue)) return;

	const discordUserDatabase = await getUserCurrencyFromDatabase(discordUserId, db);
	if (!discordUserDatabase) return;

	const guild = await client.guilds.fetch(plugin['var'].server);
	const member = await guild.members.fetch(discordUserId).catch(() => null);
	if (!member) return;

	// XP aus Sprach- und Chataktivität berechnen
	let voiceActivity = parseInt(discordUserDatabase[plugin['var'].voiceActivity] || 0);
	let chatActivity = parseInt(discordUserDatabase[plugin['var'].chatActivity] || 0);
	let xp = voiceActivity + chatActivity;

	// RELATIVE XP-Grenzen (werden gleich summiert)
	const relativeRanks = getRanksWithPluginVar(plugin['var']);

	// Relative XP in kumulative XP umwandeln
	const rankLevels = [];
	let total = 0;
	for (const r of relativeRanks) {
		total += r.xp;
		rankLevels.push({ ...r, cumulativeXp: total });
	}

	// Aktuellen Rang finden
	let currentRankIndex = -1;
	for (let i = rankLevels.length - 1; i >= 0; i--) {
		if (member.roles.cache.has(rankLevels[i].roleId)) {
			currentRankIndex = i;
			break;
		}
	}

	const nextRankIndex = currentRankIndex + 1;
	if (nextRankIndex >= rankLevels.length) return;

	const nextRank = rankLevels[nextRankIndex];

	// Reicht die XP für den nächsten Rang?
	if (xp >= nextRank.cumulativeXp) {
		// Alte Rolle entfernen
		if (currentRankIndex >= 0) {
			await member.roles.remove(rankLevels[currentRankIndex].roleId).catch(console.error);
		}

		// Neue Rolle geben
		await member.roles.add(nextRank.roleId).catch(console.error);

		//Get Discorduser and send him his rankup message
		let discordUser = await guild.members.resolve(discordUserId);
		const exampleEmbed = new EmbedBuilder()
			.setColor('#12ba69')
			.setTitle(`${capitalize(nextRank.label)} [Rolesystem]`)
			.setDescription(nextRank.description)
		discordUser.send({ embeds: [exampleEmbed] })

		// Log senden
		const embed = new EmbedBuilder()
			.setColor('#12ba69')
			.setTitle("🐾 Neues Tier-Rang erreicht!")
			.setDescription(`<@${discordUserId}> hat genug Aktivität für den Rang **${capitalize(nextRank.label)}** gesammelt! 🎉`)
			.setTimestamp();

		const logChannel = client.channels.cache.get(plugin['var'].logChannel);
		if (logChannel) {
			await logChannel.send({ embeds: [embed] });
		}
	}
}

async function assignCorrectRankRole(member, xp, relativeRanks) {


	// Relative XP in kumulative XP umwandeln
	const rankLevels = [];
	let total = 0;
	for (const r of relativeRanks) {
		total += r.xp;
		rankLevels.push({ ...r, cumulativeXp: total });
	}

	// Aktuellen Rang finden
	let currentRankIndex = -1;
	for (let i = rankLevels.length - 1; i >= 0; i--) {
		if (member.roles.cache.has(rankLevels[i].roleId)) {
			currentRankIndex = i;
			break;
		}
	}

	// Spieler-Rang basierend auf XP herausfinden
	let newRankIndex = -1;
	for (let i = 0; i < rankLevels.length; i++) {
		if (xp >= rankLevels[i].cumulativeXp) {
			newRankIndex = i;
		} else {
			break; // Da XP nur steigt, kann man hier abbrechen
		}
	}

	// Falls kein passender Rang gefunden wurde, beenden
	if (newRankIndex === -1) {
		console.log(`Kein passender Rang für ${member.user.tag} mit ${xp} XP`);
		return;
	}

	const newRank = rankLevels[newRankIndex];

	// Alle Rangrollen aus dem Array extrahieren
	const allRoleIds = relativeRanks.map(r => r.roleId);

	// Entferne alle Rangrollen, die das Mitglied derzeit hat
	const rolesToRemove = member.roles.cache.filter(role => allRoleIds.includes(role.id));
	if (rolesToRemove.size > 0) {
		await member.roles.remove(rolesToRemove);
	}

	// Weise die korrekte Rangrolle zu, wenn nicht bereits vorhanden
	if (!member.roles.cache.has(newRank.roleId)) {
		await member.roles.add(newRank.roleId);
		console.log(`Rolle ${newRank.name} zugewiesen an ${member.user.tag}`);
	} else {
		console.log(`${member.user.tag} hat bereits die korrekte Rolle (${newRank.name})`);
	}
}

// Erstbuchstabe groß
function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatWithK(number) {
	if (number >= 1000) {
		return Math.floor(number / 1000) + "k";
	}
	return number.toString();
}

function formatWithDots(number) {
	return number.toLocaleString("de-DE"); // Deutsches Format: Punkt als Tausendertrenner
}




const TextToSVG = require('text-to-svg');
const fs = require('fs');


function getTextStartX(text, x, fontsizeInPixel = 16) {
	const textToSVG = TextToSVG.loadSync('./discordBot/fonts/Quicksand-Bold.ttf');
	const metrics = textToSVG.getMetrics(text, { fontSize: fontsizeInPixel });

	// Da der Text zentriert ist, beginnt er bei x - width / 2
	return Math.round(x - metrics.width / 2);
}

function getTextBuffer(text, x, y, fontsizeInPixel = 16) {
	const textToSVG = TextToSVG.loadSync('./discordBot/fonts/Quicksand-Bold.ttf');

	// Metriken für Breite und Höhe
	const metrics = textToSVG.getMetrics(text, { fontSize: fontsizeInPixel });

	// Berechne Verschiebung, damit der Text mittig bei x steht
	// Der Pfad startet links, deshalb verschieben wir um die halbe Breite nach links
	const translateX = x - metrics.width / 2;

	// Vertikale Verschiebung: y = baseline, wir wollen vertikale Mitte, deshalb y + halbe Höhe
	const translateY = y + (metrics.ascender - metrics.descender) / 2;

	const options = {
		x: 0,
		y: 0,
		fontSize: fontsizeInPixel,
	};

	// Pfad an Ursprung generieren
	const svgPath = textToSVG.getD(text, options);

	return Buffer.from(`
    <svg width="270" height="350" xmlns="http://www.w3.org/2000/svg">
      <path d="${svgPath}" fill="white" transform="translate(${translateX},${translateY})" />
    </svg>`);
}


function getTextBufferLinks(text, x, y, fontsizeInPixel = 16) {
	const textToSVG = TextToSVG.loadSync('./discordBot/fonts/Quicksand-Bold.ttf');

	const metrics = textToSVG.getMetrics(text, { fontSize: fontsizeInPixel });

	// Keine horizontale Verschiebung notwendig – Start ist linksbündig
	const translateX = x;

	// Vertikal wieder zentriert an y (Textmitte)
	const translateY = y + (metrics.ascender - metrics.descender) / 2;

	const options = {
		x: 0,
		y: 0,
		fontSize: fontsizeInPixel,
	};

	const svgPath = textToSVG.getD(String(text), options);

	return Buffer.from(`
	<svg width="270" height="350" xmlns="http://www.w3.org/2000/svg">
		<path d="${svgPath}" fill="white" transform="translate(${translateX},${translateY})" />
	</svg>`);
}
