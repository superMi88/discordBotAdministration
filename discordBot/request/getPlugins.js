
const fs = require('fs');

//get Plugin Definitions from Bot
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {
        
        let response = []
            const commandFiles = fs.readdirSync(`./plugins`);

            for (const file of commandFiles) {

                let pluginConfig = ''

                if (fs.existsSync(`./plugins/${file}/config.js`)) {
                    //new way
                    let pluginConfig = require(`../plugins/${file}/config.js`);
                    response.push(pluginConfig)
                }else{
                    //old way remove later
                    let command = require(`../plugins/${file}/plugin.js`);
                    response.push(command.info)
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