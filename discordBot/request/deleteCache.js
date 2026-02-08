
const fs = require('fs');

module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {
        
        let pluginObj = {}
        let botId = botStruct.clientId

        let messageText = ""

        try {
            if (fs.existsSync('./cache/bot-'+botId+'/plugin-'+data.data.pluginId+'.txt')) {
                fs.unlinkSync('./cache/bot-'+botId+'/plugin-'+data.data.pluginId+'.txt');
                messageText = "Erfolgreich gelöscht"
            }else{
                messageText = "Cache exestiert nicht"
            }

        } catch(err) {
            messageText = "Ein Fehler ist aufgetreten"

            console.error(err)
        }

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: messageText,
            }
        );
        
	}
};