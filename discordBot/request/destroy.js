
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "prozess wurde vernichtet",
                status: botStruct.status,
                timestamp: Date.now()
            }
        );

        botStruct.client.destroy()
        botStruct.status = 'offline'
        
	}
};