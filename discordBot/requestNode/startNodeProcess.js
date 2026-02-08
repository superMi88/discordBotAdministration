const { fork } = require('child_process');
const botManager = require('../libIndex/botManager'); // Pfad anpassen falls nötig
const EventManager = require("../libIndex/eventManager.js");

module.exports = {
    /**
     * @param {Object} ipc - Das IPC Objekt
     * @param {Object} data - Die übertragenen Daten (id, token, ownerId, projectAlias)
     * @param {Object} socket - Der Socket für die Antwort an den Webserver
     */
    async execute(ipc, data, socket) {
        const { id, token, ownerId, projectAlias } = data.data;

        // Prüfen, ob der Bot eventuell schon läuft
        if (botManager.getBot(id)) {
            console.log(`[BotManager] Bot ${id} läuft bereits.`);
            return;
        }

        // Starte den Child-Prozess
        const child = fork(`./discordBot.js`, [id, token, ownerId, projectAlias]);

        // Event-Handler für Nachrichten vom Bot
        child.on("message", async (message) => {
            // 1. Weiterleitung an Webserver via IPC
            ipc.server.emit(
                socket,
                'NodeProcessResponse',
                { id, message }
            );

            // 2. Interne Logik (Events)
            if (message.manager === "addEvent") {
                await EventManager.addEvents(message.events, message.botId);
            }
            
            if (message.manager === "triggerEvent") {
                EventManager.triggerEvent(
                    message.triggerPluginId, 
                    message.currencyId, 
                    message.discordUserId, 
                    message.oldValue, 
                    message.newValue
                );
            }
        });

        // Im Singleton registrieren
        botManager.addBot(id, child);

        console.log(`[BotManager] Bot ${id} erfolgreich via Request gestartet.`);
        
        return true; 
    }
};