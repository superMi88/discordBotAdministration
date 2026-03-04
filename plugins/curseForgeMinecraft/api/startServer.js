const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const PluginManager = require("../../../discordBot/lib/PluginManager.js");
const { log, createEula, sendToServer } = require('./utils.js');

module.exports = async function (client, plugin, config, projectAlias, data) {
    let status = await PluginManager.save(plugin, config);
    if (!status.saved) {
        return status;
    }

    const fileName = plugin.var.file;
    if (!fileName) {
        return { saved: false, infoMessage: "Keine Datei 'file' in config definiert", infoStatus: "Error" };
    }

    const sourcePath = path.join(__dirname, '../../../', 'uploads', projectAlias, plugin.botId, plugin.id, fileName);
    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const targetFilePath = path.join(targetFolderPath, fileName);

    // Log-Datei bei jedem Start zurücksetzen
    const logFileStream = fs.createWriteStream(path.join(targetFolderPath, 'console.txt'), { flags: 'w' });
    logFileStream.close(); // Clear file

    const isWindows = process.platform === 'win32';
    const scriptName = isWindows ? 'run.ps1' : 'run.sh';
    const scriptPath = path.join(targetFolderPath, scriptName);

    if (!fs.existsSync(scriptPath)) {
        console.error(`❌ ${scriptName} fehlt unter: ${scriptPath}`);
        return { saved: false, error: `${scriptName} fehlt` };
    }

    console.log("🟢 Starte Minecraft-Server...");

    const command = isWindows ? 'powershell.exe' : '/bin/bash';
    const args = isWindows
        ? ['-ExecutionPolicy', 'Bypass', '-File', scriptPath]
        : [scriptPath];
    const options = {
        cwd: targetFolderPath,
        env: process.env,
        shell: true
    };

    // Create new log stream for appending
    const logFile = fs.createWriteStream('cmd.txt', { flags: 'a' });

    createEula(targetFolderPath);

    if (plugin.mcProcess && !plugin.mcProcess.killed) {
        return { saved: false, infoMessage: "Server läuft bereits", infoStatus: "Warning" };
    }

    const mcProcess = spawn(command, args, options);
    plugin.mcProcess = mcProcess; // Store process on plugin object

    console.log(`Minecraft-Server gestartet mit PID ${mcProcess.pid}`);

    mcProcess.stdout.on('data', (data) => {
        log(targetFolderPath, `[Minecraft-Server] ${data.toString()}\n`);

        try {
            fs.appendFileSync('cmd.txt', `[Minecraft-Server] ${data.toString()}\n`);
        } catch (e) { }

        console.log(`[Minecraft-Server] ${data}`);

        const output = data.toString();
        if (output.includes('Done')) {
            console.log('✅ Server ist jetzt bereit!');
            if (plugin.var && plugin.var.op) {
                sendToServer(mcProcess, 'op ' + plugin.var.op);
            }
        }
    });

    mcProcess.stderr.on('data', (data) => {
        log(targetFolderPath, `[Minecraft-Server ERROR] ${data.toString()}\n`);
        try {
            fs.appendFileSync('cmd.txt', `[Minecraft-Server ERROR] ${data.toString()}\n`);
        } catch (e) { }
        console.error(`[Minecraft-Server ERROR] ${data}`);
    });

    mcProcess.on('exit', (code) => {
        log(targetFolderPath, `Minecraft-Server beendet mit Code: ${code}\n`);
        try {
            fs.appendFileSync('cmd.txt', `Minecraft-Server beendet mit Code: ${code}\n`);
        } catch (e) { }
        console.log(`Minecraft-Server beendet mit Code: ${code}`);
        plugin.mcProcess = null;
    });

    return { saved: true, infoMessage: "gestartet", infoStatus: "Info" };
}
