
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        const guilds = botStruct.client.guilds.cache;
        //console.log(guilds)
        let responseEmojis = []

        guilds.forEach((guild, i) =>{

            let emojislist = []
            guild.emojis.cache.forEach((emoji, i) =>{

                emojislist.push(
                    {
                        id: emoji.id,
                        name: emoji.name
                    }

                )
            })
            

            responseEmojis.push(
                {
                    id: guild.id,
                    icon: guild.icon,
                    guild: guild.name,
                    emojis: emojislist
                }
            )
        })

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "emojis von Servern",
                data: responseEmojis
            }
        );
        
	}
};