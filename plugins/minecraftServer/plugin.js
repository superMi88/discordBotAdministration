const dataManager = require("../../discordBot/lib/dataManager.js")

const { SlashCommandBuilder } = require('@discordjs/builders');

var CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
const helper = require('../../discordBot/lib/helper.js');
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const status = {
	BACKUP: 0,
	BACKUP_AND_RESTART: 1,
}

class Plugin {
	async execute(client, plugin, projectAlias) {

		let obj = {
			minecraftServerProcess: undefined,
			onlinePlayer: []
		}

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].name1) {

				if (!obj.minecraftServerProcess) {


					await startServer(client, plugin, obj, projectAlias)


					const exampleEmbed = new EmbedBuilder()
						.setColor('#0099ff')
						.setTitle("Minecraft Server Info")
						.setDescription("Starte Minecraft Server")

					return await interaction.reply({
						embeds: [exampleEmbed],
						ephemeral: true
					});

				} else {
					return await interaction.reply("minecraft server läuft schon")
				}
			}

			if (interaction.commandName == plugin['var'].name2) {

				if (obj.minecraftServerProcess) {


					//console.log("minecraftServerProcess")
					//console.log(obj.minecraftServerProcess)

					await killServer(obj)

					const exampleEmbed = new EmbedBuilder()
						.setColor('#0099ff')
						.setTitle("Minecraft Server Info")
						.setDescription("Minecraft server beendet")

					return await interaction.reply({
						embeds: [exampleEmbed],
						ephemeral: true
					});

				} else {

					const exampleEmbed = new EmbedBuilder()
						.setColor('#0099ff')
						.setTitle("Minecraft Server Info")
						.setDescription("Server läuft nicht")

					return await interaction.reply({
						embeds: [exampleEmbed],
						ephemeral: true
					});

				}
			}

		});
	}

	async verschieben(plugin, config, projectAlias) {
		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		const fileName = plugin.var.file;
		const path = require('path');
		const fs = require('fs');

		// Source: uploads/projectAlias/botId/pluginId/fileName
		const sourcePath = path.join(__dirname, '../../uploads', projectAlias, plugin.botId, plugin.id, fileName);

		// Target: minecraft/projectAlias/botId/pluginId/server.jar
		const targetFolderPath = path.join(__dirname, '../../minecraft', projectAlias, plugin.botId, plugin.id);
		const targetFilePath = path.join(targetFolderPath, "server.jar");

		try {
			console.log("Source:", sourcePath);
			console.log("Target Folder:", targetFolderPath);

			// Ensure source exists
			if (!fs.existsSync(sourcePath)) {
				return { saved: false, infoMessage: "Datei nicht gefunden in Uploads", infoStatus: "Error" };
			}

			// Ensure target folder exists
			if (!fs.existsSync(targetFolderPath)) {
				fs.mkdirSync(targetFolderPath, { recursive: true });
			}

			// Copy/Move file
			fs.copyFileSync(sourcePath, targetFilePath);
			console.log("File copied to server.jar");

			return { saved: true, infoMessage: "Datei erfolgreich verschoben", infoStatus: "Info" };
		} catch (err) {
			console.error("Fehler beim Verschieben: ", err);
			return { saved: false, infoMessage: "Fehler beim Verschieben", infoStatus: "Error" };
		}
	}
	async onLoad(plugin, data) {



		return (data)
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if (!status.saved) {
			return status
		}

		await PluginManager.reloadSlashCommands()

		return ({ saved: true, infoMessage: "Minecraft Plugin geupdatet", infoStatus: "Info" })
	}
	async addCommands(plugin, commandMap) {

		if (!commandMap) return

		if (!(
			plugin['var'].name1 &&
			plugin['var'].description1 &&
			plugin['var'].name2 &&
			plugin['var'].description2 &&
			plugin['var'].server
		)) return ""


		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].name1)
				.setDescription(plugin['var'].description1)
		)
		helper.addToCommandMap(commandMap, plugin['var'].server,
			new SlashCommandBuilder()
				.setName(plugin['var'].name2)
				.setDescription(plugin['var'].description2)
		)

	}
};

module.exports = new Plugin();


const { copyFile } = require('fs/promises');
const path = require('path');
const fs = require('fs');
var kill = require('tree-kill');

async function killServer(obj) {

	obj.onlinePlayer = []
	if (obj.minecraftServerProcess) {
		obj.minecraftServerProcess.kill()
		obj.minecraftServerProcess = undefined
	}

}


async function startServer(client, plugin, obj, projectAlias) {
	// Dependencies
	var spawn = require('child_process').spawn;

	obj.onlinePlayer = []

	// Determine the target folder path
	// Structure: servernew/minecraft/projectAlias/botId/pluginId
	const cwdPath = path.join(__dirname, '../../minecraft', projectAlias, plugin.botId, plugin.id);

	console.log("Minecraft Server CWD:", cwdPath);
	//console.log("Folder exists?", fs.existsSync(cwdPath));


	if (!fs.existsSync(cwdPath)) {
		console.error("Minecraft Server Error: Directory does not exist: " + cwdPath);
		return;
	}

	const jarPath = path.join(cwdPath, 'server.jar');
	if (!fs.existsSync(jarPath)) {
		console.error("Minecraft Server Error: server.jar not found in: " + cwdPath);
		return;
	}

	// Our Minecraft multiplayer server process
	obj.minecraftServerProcess = spawn('java', [
		'-Xmx6144M',
		'-Xms2048M',
		'-jar',
		'server.jar',
		'nogui'
	], {
		cwd: cwdPath
	});

	obj.minecraftServerProcess.on('close', (code) => {
		console.log("child process exited with code " + code);
		obj.minecraftServerProcess = undefined;
	});

	// Log stdout and stderr
	obj.minecraftServerProcess.stdout.on('data', (data) => {
		console.log(`[Minecraft] ${data}`);
	});
	obj.minecraftServerProcess.stderr.on('data', (data) => {
		//console.error(`[Minecraft Error] ${data}`);
		console.log(`[Minecraft Error] ${data}`);
	});

}





