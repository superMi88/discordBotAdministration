//TODO umbenennen in getGuilds wenn name frei ist
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        const guilds = botStruct.client.guilds.cache;

            let resGuild = []

            for (let guild of guilds) {

                resGuild.push(
                    {
                        id: guild[1].id,
                        icon: guild[1].icon,
                        guild: guild[1].name,
                    }
                )
            }


            ipc.server.emit(
                socket,
                'DiscordBotResponse',
                {
                    message: "get guild from server",
                    data: resGuild
                    /*response: resGuild*/
                }
            );
        
	}
};