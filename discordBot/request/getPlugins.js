const fs = require('fs');
const path = require('path');

//get Plugin Definitions from Bot
module.exports = {
    async execute(ipc, botStruct, data, socket, createClient, db) {

        const pluginsPath = path.resolve(__dirname, '..', '..', 'plugins');
        console.log(`[Bot] Loading plugins from: ${pluginsPath}`);

        let response = []
        if (!fs.existsSync(pluginsPath)) {
            console.error(`[Bot] CRITICAL: Plugins directory NOT FOUND at: ${pluginsPath}`);
        } else {
            const pluginFolders = fs.readdirSync(pluginsPath);

            for (const file of pluginFolders) {
                const configPath = path.join(pluginsPath, file, 'config.js');
                const pluginPath = path.join(pluginsPath, file, 'plugin.js');

                if (fs.existsSync(configPath)) {
                    // Using require with absolute path might be tricky, but since it's local it should work
                    // or use relative path back to the file
                    try {
                        let pluginConfig = require(`../../plugins/${file}/config.js`);
                        response.push(pluginConfig);
                    } catch (e) {
                        console.log(`[Bot] Error loading config for ${file}:`, e.message);
                    }
                } else if (fs.existsSync(pluginPath)) {
                    try {
                        let command = require(`../../plugins/${file}/plugin.js`);
                        if (command.info) {
                            response.push(command.info);
                        }
                    } catch (e) {
                        console.log(`[Bot] Error loading plugin for ${file}:`, e.message);
                    }
                }
            }
        }

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "get Plugin Definitions from Bot",
                response: response
            }
        );

    }
};