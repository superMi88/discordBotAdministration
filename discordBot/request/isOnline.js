
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "test if bot is online",
                status: botStruct.status,
                timestamp: Date.now()
            }
        );
        
	}
};