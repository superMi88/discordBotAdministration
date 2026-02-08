
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        let messageResponse = ""
        for(let i=0; i < data.data.length; i++) {

            try{
                const guild = botStruct.client.guilds.cache.get(data.data[i].guildId)
                const channel = await guild.channels.fetch(data.data[i].channelId)
                data.data[i].guildName = guild.name
                data.data[i].channelName = channel.name
            }catch{
                console.log("Kein Zugriff mehr auf Server")
            }

        };
        messageResponse= "textblock updatet"
            
        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: messageResponse,
                data: data
            }
        );
        
	}
};