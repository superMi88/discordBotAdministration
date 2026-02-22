const { MongoClient } = require('mongodb');
const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');
const ipc = require('node-ipc').default;
const log = require('./lib/log');

const EventManager = require("./libIndex/eventManager.js");
const botManager = require('./libIndex/botManager'); // Singleton Instanz

const MONGO_URL = 'mongodb://localhost:27017';
const client = new MongoClient(MONGO_URL);

/**
 * Erstellt benötigte Verzeichnisse
 */
function ensureDirectories() {
    const dirs = ['./temp', './cache'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    });
}

/**
 * Startet einen Discord Bot Prozess und registriert ihn im Singleton
 */
function startBotProcess(id, token, ownerId, projectAlias) {

    // Prüfe, ob der Bot bereits läuft
    const existingBot = botManager.getBot(id);
    if (existingBot && !existingBot.killed) {
        console.log(`[BotManager] Bot ${id} läuft bereits. Beende den alten Prozess...`);
        existingBot.kill('SIGTERM');
        botManager.removeBot(id);
    }

    const child = fork(path.join(__dirname, `discordBot.js`), [id, token, ownerId, projectAlias]);

    child.on("message", async (message) => {
        // Event Management
        if (message.manager === "addEvent") {
            await EventManager.addEvents(message.events, message.botId);
        }

        if (message.manager === "triggerEvent") {
            // Hier nutzen wir jetzt den BotManager statt der lokalen Variable
            EventManager.triggerEvent(
                message.triggerPluginId,
                message.currencyId,
                message.discordUserId,
                message.oldValue,
                message.newValue
            );
        }
    });

    child.on('exit', () => {
        console.log(`[BotManager] Bot ${id} Prozess beendet.`);
        if (botManager.getBot(id) === child) {
            botManager.removeBot(id);
        }
    });

    // HIER: Registrierung im Singleton
    botManager.addBot(id, child);

    return child;
}

/**
 * IPC Server Setup
 */
function setupIPC() {
    ipc.config.id = 'nodeProcess';
    ipc.config.retry = 1500;
    ipc.config.silent = true;

    ipc.serve(() => {
        ipc.server.on('WebserverRequest', async (data, socket) => {
            console.log("IPC Command:", data.command);
            try {
                // Versuche den Command aus RequestNode zu laden
                const requestHandler = require(`./requestNode/${data.command}`);
                await requestHandler.execute(ipc, data, socket);
            } catch (e) {
                // Falls die Datei nicht existiert, prüfen wir ob es ein interner Command ist
                if (data.command === 'startNodeProcess') {
                    startBotProcess(data.data.id, data.data.token, data.data.ownerId, data.data.projectAlias);
                } else {
                    console.log(`[Bot] ${data.command} nicht gefunden.`);
                }
            }
        });
    });
    ipc.server.start();
}

async function main() {
    try {
        ensureDirectories();
        setupIPC();

        await client.connect();
        const projectsPath = path.join(__dirname, '../projects.json');
        const allProjects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

        for (const project of allProjects) {
            const projectDb = client.db(project.name);
            const bots = await projectDb.collection('botCollection').find({}).toArray();

            for (const botData of bots) {
                // Bots beim Starten automatisch registrieren
                startBotProcess(botData.id, botData.token, botData.ownerId, project.name);
            }
        }
        log.write("Alle Prozesse initialisiert.");
    } catch (error) {
        console.error("Main Error:", error);
    }
}

// Graceful Custom Shutdown
async function cleanup() {
    console.log("Shutting down... killing all child processes.");
    const bots = botManager.getAllBots();
    for (const botProcess of bots) {
        if (botProcess && !botProcess.killed) {
            botProcess.kill('SIGTERM');
        }
    }
    // Give them a moment to close
    setTimeout(() => {
        process.exit(0);
    }, 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

main();