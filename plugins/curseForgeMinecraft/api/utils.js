const fs = require('fs');
const path = require('path');

function log(folderPath, ...args) {
    const message = args.map(arg => {
        if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
        }
        return String(arg);
    }).join(' ') + '\n';

    const LOG_FILE = path.join(folderPath, 'console.txt');
    try {
        fs.appendFileSync(LOG_FILE, message);
    } catch (e) { console.error("Could not write to log file", e) }
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

function sendToServer(process, command) {
    if (process && !process.killed) {
        process.stdin.write(command + '\n');
        console.log(`[Command sent] ${command}`);
    } else {
        console.error('Server läuft nicht!');
    }
}

module.exports = {
    log,
    createEula,
    sendToServer
};
