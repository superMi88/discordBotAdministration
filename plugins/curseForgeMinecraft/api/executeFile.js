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

    if (!plugin.processes) plugin.processes = {};

    // Stop existing process if running for THIS file
    if (plugin.processes[filename] && !plugin.processes[filename].killed) {
        return { saved: false, infoMessage: `Process ${filename} already running. Stop it first.`, infoStatus: "Warning" };
    }

    // Prepare separate log file
    const logFileName = `console_${filename}.txt`;
    const logFilePath = path.join(targetFolderPath, logFileName);

    // Clear log file
    try {
        fs.writeFileSync(logFilePath, '');
    } catch (e) { console.error("Error defining log file", e) }

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

    createEula(targetFolderPath);

    const mcProcess = spawn(command, args, options);
    plugin.processes[filename] = mcProcess; // Store process on plugin object specific to file

    console.log(`Process started with PID ${mcProcess.pid}`);

    const appendLog = (msg) => {
        try {
            fs.appendFileSync(logFilePath, msg); // msg already has newline or comes from data which might have it? Usually data is chunk.
            // also append to global cmd.txt for debugging
            fs.appendFileSync(path.join(targetFolderPath, 'cmd.txt'), `[${filename}] ${msg}`);
        } catch (e) { }
    }

    mcProcess.stdout.on('data', (data) => {
        const msg = data.toString();
        appendLog(msg);
        console.log(`[${filename}] ${msg}`);
    });

    mcProcess.stderr.on('data', (data) => {
        const msg = data.toString();
        appendLog(msg);
        console.error(`[${filename} ERROR] ${msg}`);
    });

    mcProcess.on('exit', (code) => {
        const msg = `\n${filename} finished with code: ${code}\n`;
        appendLog(msg);
        console.log(`[${filename}] finished with code: ${code}`);
        if (plugin.processes[filename] === mcProcess) {
            delete plugin.processes[filename];
        }
    });

    return { saved: true, infoMessage: `Started ${filename}`, infoStatus: "Info" };
}
