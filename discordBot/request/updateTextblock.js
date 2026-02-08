
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        let messageResponse = ""

            try{
                const currentGuild = botStruct.client.guilds.cache.get(data.data.guildId)
                const channel = await currentGuild.channels.fetch(data.data.channelId)
                const message = await channel.messages.fetch(data.data.messageId)
                
                await message.edit(data.data.content)

                messageResponse= "textblock updatet"
            }catch{
                messageResponse = "error"
            }
            
            ipc.server.emit(
                socket,
                'DiscordBotResponse',
                {
                    message: messageResponse
                }
            );
        
	}
};