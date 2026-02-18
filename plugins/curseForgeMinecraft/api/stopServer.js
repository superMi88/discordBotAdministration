const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const PluginManager = require("../../../discordBot/lib/PluginManager.js");
const { log } = require('./utils.js');

module.exports = async function (client, plugin, config, projectAlias, data) {
    let status = await PluginManager.save(plugin, config);
    if (!status.saved) {
        return status;
    }

    const { filename } = data;

    if (!filename) {
        return { saved: false, infoMessage: "No file specified.", infoStatus: "Error" };
    }

    if (!plugin.processes || !plugin.processes[filename]) {
        return { saved: false, infoMessage: `No running process found for ${filename}`, infoStatus: "Warning" };
    }

    const mcProcess = plugin.processes[filename];
    const isWindows = process.platform === 'win32';

    console.log(`🛑 Versuche Prozess ${filename} zu stoppen...`);

    if (mcProcess && !mcProcess.killed) {
        // Stop command (graceful attempt)
        try {
            mcProcess.stdin.write('stop\n');
        } catch (e) {
            console.warn(`Could not write stop to ${filename}:`, e);
        }

        // Timeout
        setTimeout(() => {
            if (mcProcess && !mcProcess.killed) {
                console.log(`⏱️ Prozess ${filename} lebt noch – erzwinge Beendigung...`);
                if (isWindows) {
                    spawn('taskkill', ['/PID', mcProcess.pid.toString(), '/T', '/F']);
                } else {
                    exec(`pkill -P ${mcProcess.pid}`, (err) => {
                        if (err) console.error("Fehler bei pkill:", err);
                        try {
                            process.kill(mcProcess.pid, 'SIGKILL');
                        } catch (e) {
                            console.error("Fehler bei SIGKILL:", e);
                        }
                    });
                }
            }
        }, 10000);

        return { saved: true, infoMessage: `Stop-Befehl an ${filename} gesendet`, infoStatus: "Info" };
    } else {
        console.warn(`⚠️ Prozess ${filename} scheint nicht mehr zu laufen.`);
        // Cleanup just in case
        if (plugin.processes && plugin.processes[filename]) {
            delete plugin.processes[filename];
        }
        return { saved: false, infoMessage: "Prozess läuft nicht mehr", infoStatus: "Warning" };
    }
}
