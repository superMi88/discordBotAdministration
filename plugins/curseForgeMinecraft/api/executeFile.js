const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const PluginManager = require("../../../discordBot/lib/PluginManager.js");
const { log, createEula, sendToServer } = require('./utils.js');

module.exports = async function (client, plugin, config, projectAlias, data) {
    let status = await PluginManager.save(plugin, config);
    if (!status.saved) {
        return status;
    }

    const { filename } = data; // Expected "run.sh" or "setup.ps1"

    if (!filename) {
        return { saved: false, infoMessage: "No file specified.", infoStatus: "Error" };
    }

    // Security check: Only allow files from the allowed directory, no path traversal.
    if (filename.includes('..') || filename.includes('/')) {
        return { saved: false, infoMessage: "Invalid filename.", infoStatus: "Error" };
    }

    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const targetFilePath = path.join(targetFolderPath, filename);

    if (!fs.existsSync(targetFilePath)) {
        return { saved: false, infoMessage: "File does not exist.", infoStatus: "Error" };
    }

    // Stop existing process if running?
    if (plugin.mcProcess && !plugin.mcProcess.killed) {
        return { saved: false, infoMessage: "Process already running. Stop it first.", infoStatus: "Warning" };
    }

    // Log-Datei bei jedem Start zurücksetzen? 
    // Maybe append? Or clear? Usually server logs append, but user might want fresh start.
    // Let's clear for now as per previous logic.
    const logFileStream = fs.createWriteStream(path.join(targetFolderPath, 'console.txt'), { flags: 'w' });
    logFileStream.close();

    const isWindows = process.platform === 'win32';

    console.log(`🟢 Starting execution of ${filename}...`);

    let command, args;

    if (filename.endsWith('.ps1')) {
        command = 'powershell.exe';
        args = ['-ExecutionPolicy', 'Bypass', '-File', targetFilePath];
    } else if (filename.endsWith('.bat')) {
        command = 'cmd.exe';
        args = ['/c', targetFilePath];
    } else if (filename.endsWith('.sh')) {
        command = '/bin/bash'; // Or 'sh'?
        args = [targetFilePath];
        // Ensure executable permissions
        fs.chmodSync(targetFilePath, '755');
    } else {
        // Fallback or error?
        return { saved: false, infoMessage: "Unsupported file type.", infoStatus: "Error" };
    }

    const options = {
        cwd: targetFolderPath,
        env: process.env,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe']
    };

    // Create new log stream for appending
    const logFile = fs.createWriteStream('cmd.txt', { flags: 'a' });

    createEula(targetFolderPath);

    const mcProcess = spawn(command, args, options);
    plugin.mcProcess = mcProcess; // Store process on plugin object

    console.log(`Process started with PID ${mcProcess.pid}`);

    mcProcess.stdout.on('data', (data) => {
        log(targetFolderPath, `[${filename}] ${data.toString()}`);

        try {
            fs.appendFileSync('cmd.txt', `[${filename}] ${data.toString()}`);
        } catch (e) { }

        console.log(`[${filename}] ${data}`);
    });

    mcProcess.stderr.on('data', (data) => {
        log(targetFolderPath, `[${filename} ERROR] ${data.toString()}`);
        try {
            fs.appendFileSync('cmd.txt', `[${filename} ERROR] ${data.toString()}`);
        } catch (e) { }
        console.error(`[${filename} ERROR] ${data}`);
    });

    mcProcess.on('exit', (code) => {
        log(targetFolderPath, `${filename} finished with code: ${code}\n`);
        try {
            fs.appendFileSync('cmd.txt', `${filename} finished with code: ${code}\n`);
        } catch (e) { }
        console.log(`${filename} finished with code: ${code}`);
        plugin.mcProcess = null;
    });

    return { saved: true, infoMessage: `Started ${filename}`, infoStatus: "Info" };
}
