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

    const targetFolderPath = path.join(__dirname, '../../../', 'MinecraftCurseForge', projectAlias, plugin.botId, plugin.id);
    const isWindows = process.platform === 'win32';
    const scriptName = isWindows ? 'run.ps1' : 'run.sh';
    const scriptPath = path.join(targetFolderPath, scriptName);

    if (!fs.existsSync(scriptPath)) {
        console.error(`❌ ${scriptName} fehlt unter: ${scriptPath}`);
        return { saved: false, error: `${scriptName} fehlt` };
    }

    const mcProcess = plugin.mcProcess; // Get process from plugin object

    console.log("🛑 Versuche Server zu stoppen...");
    //console.log(mcProcess);

    if (mcProcess && !mcProcess.killed) {
        // Stop command
        mcProcess.stdin.write('stop\n');

        // Timeout
        setTimeout(() => {
            if (mcProcess && !mcProcess.killed) {
                console.log('⏱️ Prozess lebt noch – erzwinge Beendigung...');
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

        return { saved: true, infoMessage: "Stop-Befehl gesendet", infoStatus: "Info" };
    } else {
        console.warn("⚠️ Kein laufender Minecraft-Prozess gefunden.");
        return { saved: false, infoMessage: "Kein laufender Server gefunden", infoStatus: "Warning" };
    }
}
