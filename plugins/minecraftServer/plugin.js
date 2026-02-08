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
	async execute(client, plugin) {

		let obj = {
			minecraftServerProcess: undefined,
			onlinePlayer: []
		}

		plugin.on(client, 'interactionCreate', async interaction => {

			if (!interaction.isChatInputCommand()) return;

			if (interaction.commandName == plugin['var'].name1) { 

				if (!obj.minecraftServerProcess) {

					
					await startServer(client, plugin, obj)


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
	async onLoad(plugin, data) {

		

		return (data)
	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		await PluginManager.reloadSlashCommands()

		return ({ saved: true, infoMessage: "Minecraft Plugin geupdatet", infoStatus: "Info" })
	}
	async addCommands(plugin, commandMap) {

		if(!commandMap) return

		if(! (
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
const { join } = require('path');
const fse = require('fs-extra');
var kill = require('tree-kill');

async function killServer(obj) {

	obj.onlinePlayer = []
	obj.minecraftServerProcess.kill()
	obj.minecraftServerProcess = undefined

}


async function startServer(client, plugin, obj) {
	// Dependencies
	var spawn = require('child_process').spawn;
	//var twilio = require('twilio');
	//var express = require('express');
	//var bodyParser = require('body-parser');

	obj.onlinePlayer = []

	// Our Minecraft multiplayer server process
	obj.minecraftServerProcess = spawn('java', [
		'-Xmx6144M',
		'-Xms2048M',
		'-jar',
		'./../'+plugin['var'].foldername+'/startFile/server.jar',
		'nogui'
	], {
		cwd: "./../minecraft/"+plugin['var'].foldername
	});

	obj.minecraftServerProcess.on('close', (code) => {
		console.log("child process exited with code " + code);

		// Stop the server
		/*
		if (obj.minecraftServerProcess) {
		  kill(obj.minecraftServerProcess.pid);
		}*/

	});

	

}





