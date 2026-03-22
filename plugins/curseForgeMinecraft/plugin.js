const dataManager = require("../../discordBot/lib/dataManager.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
var CronJob = require('cron').CronJob;
const { EmbedBuilder, Events } = require('discord.js');
const { interactionSlashCommand } = require('../../discordBot/lib/helper.js');
const VariableManager = require("../../discordBot/lib/VariableManager.js");
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const unzipper = require('unzipper');  // Neues Modul für das streaming Entpacken

const { spawn, exec } = require('child_process');



// Eigene Logging-Funktion
function log(folderPath, ...args) {

	const message = args.map(arg => {
		if (typeof arg === 'object') {
			return JSON.stringify(arg, null, 2);
		}
		return String(arg);
	}).join(' ') + '\n';

	const LOG_FILE = path.join(folderPath, 'console.txt');

	console.log(LOG_FILE)
	console.log(message)
	fs.appendFileSync(LOG_FILE, message);
	// Optional: auch in die Konsole schreiben
	// console.log(...args);
}

let mcProcess;

class Plugin {
	async execute(client, plugin, projectAlias) {

		let db = DatabaseManager.get();

		plugin.on(client, Events.MessageCreate, async interaction => {
			// Keine Bot-Interaktionen
			if (interaction.author.bot) return;
		});
	}

	async addEvents(plugin, eventsArray) {
		// ...
	}

	async console(plugin, config, projectAlias) {

		//log('write log test');

		const targetFolderPath = path.join(__dirname, '../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);

		const LOG_FILE = path.join(targetFolderPath, 'console.txt');
		try {
			const content = await fs.promises.readFile(LOG_FILE, 'utf-8');
			return content;
		} catch (err) {
			return `Fehler beim Lesen der Log-Datei: ${err.message}`;
		}
	}

	async verschieben(plugin, config, projectAlias) {
		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		const fileName = plugin.var.file;
		const sourcePath = path.join(__dirname, '../../', 'uploads', projectAlias, plugin.botId, plugin.id, fileName);
		const targetFolderPath = path.join(__dirname, '../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);

		try {
			console.log("Quellpfad:", sourcePath);
			console.log("Zielpfad Folder(nur fürs Entpacken):", targetFolderPath);

			// Sicherstellen, dass die Quelldatei existiert
			await fsp.access(sourcePath);

			// ZIP-Datei mit unzipper öffnen (Streaming/Random Access statt komplettem Laden in den RAM)
			const directory = await unzipper.Open.file(sourcePath);
			if (directory.files.length === 0) {
				throw new Error("ZIP-Datei enthält keine Einträge.");
			}

			// Erkenne gemeinsamen Wurzelordner (Logik beibehalten)
			const rootFolder = directory.files[0].path.split('/')[0];

			for (const file of directory.files) {
				let relativePath = file.path;

				// Entferne den ersten Ordneranteil, falls zutreffend
				if (relativePath.startsWith(rootFolder + '/')) {
					relativePath = relativePath.slice(rootFolder.length + 1);
				} else if (relativePath === rootFolder || relativePath === rootFolder + '/') {
					// Den Wurzelordner selbst ignorieren
					continue;
				}

				if (!relativePath) continue;

				const fullPath = path.join(targetFolderPath, relativePath);

				if (file.type === 'Directory') {
					await fsp.mkdir(fullPath, { recursive: true });
				} else {
					await fsp.mkdir(path.dirname(fullPath), { recursive: true });
					// Datei-Stream schreiben
					await new Promise((resolve, reject) => {
						file.stream()
							.pipe(fs.createWriteStream(fullPath))
							.on('finish', resolve)
							.on('error', reject);
					});
				}
			}

			console.log("ZIP-Datei wurde erfolgreich mit unzipper entpackt.");
			return { saved: true, infoMessage: "Entpacken erfolgreich", infoStatus: "Info" };
		} catch (err) {
			console.error("Fehler beim Entpacken der Datei (unzipper): ", err);
			return { saved: false, infoMessage: "Fehler beim Entpacken: " + err.message, infoStatus: "Error" };
		}
	}

	async sendInput(plugin, config, projectAlias, data) {
		const input = data?.input || "";
		if (mcProcess && !mcProcess.killed) {
			sendToServer(mcProcess, input);
			return { saved: true, infoMessage: "Befehl gesendet", infoStatus: "Info" };
		} else {
			return { saved: false, infoMessage: "Server läuft nicht", infoStatus: "Warning" };
		}
	}

	async stopServer(plugin, config, projectAlias) {
		let status = await PluginManager.save(plugin, config);
		if (!status.saved) {
			return status;
		}

		const targetFolderPath = path.join(__dirname, '../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
		const isWindows = process.platform === 'win32';
		const scriptName = isWindows ? 'run.ps1' : 'run.sh';
		const scriptPath = path.join(targetFolderPath, scriptName);

		if (!fs.existsSync(scriptPath)) {
			console.error(`❌ ${scriptName} fehlt unter: ${scriptPath}`);
			return { saved: false, error: `${scriptName} fehlt` };
		}

		console.log("🛑 Versuche Server zu stoppen...");
		console.log(mcProcess);

		if (mcProcess && !mcProcess.killed) {
			// Sende "stop" Befehl über stdin
			mcProcess.stdin.write('stop\n');

			// Timeout: falls nach 10 Sekunden nicht beendet, dann force kill
			setTimeout(() => {
				if (!mcProcess.killed) {
					console.log('⏱️ Prozess lebt noch – erzwinge Beendigung...');
					if (isWindows) {
						spawn('taskkill', ['/PID', mcProcess.pid.toString(), '/T', '/F']);
					} else {
						//mcProcess.kill('SIGKILL');

						exec(`pkill -P ${mcProcess.pid}`, (err) => {
							if (err) console.error("Fehler bei pkill:", err);
							try {
								process.kill(mcProcess.pid, 'SIGKILL'); // fallback
							} catch (e) {
								console.error("Fehler bei SIGKILL:", e);
							}
						});
					}
				}
			}, 10000);

			return { saved: true, infoMessage: "Stop-Befehl gesendet", infoStatus: "Info" };
		} else {
			console.warn("⚠️ Kein laufender Minecraft-Prozess gefunden.");
			return { saved: false, infoMessage: "Kein laufender Server gefunden", infoStatus: "Warning" };
		}
	}

}

function sendToServer(process, command) {
	if (process && !process.killed) {
		process.stdin.write(command + '\n');
		console.log(`[Command sent] ${command}`);
	} else {
		console.error('Server läuft nicht!');
	}
}

function createServerProperties(targetFolderPath) {
	const propertiesContent = `#Minecraft server properties
	#${new Date().toUTCString()}
	accepts-transfers=false
	allow-flight=true
	allow-nether=true
	broadcast-console-to-ops=true
	broadcast-rcon-to-ops=true
	bug-report-link=
	difficulty=hard
	enable-command-block=false
	enable-jmx-monitoring=false
	enable-query=false
	enable-rcon=false
	enable-status=true
	enforce-secure-profile=true
	enforce-whitelist=false
	entity-broadcast-range-percentage=100
	force-gamemode=false
	function-permission-level=2
	gamemode=survival
	generate-structures=true
	generator-settings={}
	hardcore=false
	hide-online-players=false
	initial-disabled-packs=
	initial-enabled-packs=vanilla
	level-name=world
	level-seed=
	level-type=minecraft\\:normal
	log-ips=true
	max-chained-neighbor-updates=1000000
	max-players=20
	max-tick-time=180000
	max-world-size=29999984
	motd=Deltas Server
	network-compression-threshold=256
	online-mode=true
	op-permission-level=4
	player-idle-timeout=0
	prevent-proxy-connections=false
	previews-chat=false
	pvp=true
	query.port=25565
	rate-limit=0
	rcon.password=
	rcon.port=25575
	region-file-compression=deflate
	require-resource-pack=false
	resource-pack=
	resource-pack-id=
	resource-pack-prompt=
	resource-pack-sha1=
	server-ip=
	server-port=25565
	simulation-distance=10
	spawn-animals=true
	spawn-monsters=true
	spawn-npcs=true
	spawn-protection=0
	sync-chunk-writes=true
	text-filtering-config=
	use-native-transport=true
	view-distance=10
	white-list=true`;

	const targetPath = path.join(targetFolderPath, 'server.properties');

	fs.writeFile(targetPath, propertiesContent, (err) => {
		if (err) {
			console.error('❌ Fehler beim Erstellen der server.properties:', err);
		} else {
			console.log('✅ Datei "server.properties" wurde erfolgreich erstellt!');
		}
	});
}


function createEula(targetFolderPath) {
	const propertiesContent = `#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).
	eula=true`;

	const targetPath = path.join(targetFolderPath, 'eula.txt');

	fs.writeFile(targetPath, propertiesContent, (err) => {
		if (err) {
			console.error('❌ Fehler beim Erstellen der eula.txt:', err);
		} else {
			console.log('✅ Datei "eula.txt" wurde erfolgreich erstellt!');
		}
	});
}

module.exports = new Plugin();
