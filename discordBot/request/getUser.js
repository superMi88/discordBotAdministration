const { User } = require("discord.js");

//TODO umbenennen in getGuilds wenn name frei ist
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        const guilds = botStruct.client.guilds.cache;

            let resGuild = []

            //userdata (get from Server)
            let user = null

            for (let guild of guilds) {

                let member
                try{
                    member = await guild[1].members.fetch(data.data.discordId)
                    user = member.user
                }catch(e){
                    member = null
                }

                

                if(member){
                    resGuild.push(
                        {
                            id: guild[1].id,
                            icon: guild[1].icon,
                            guild: guild[1].name,
                            member: member
                        }
                    )
                }
            }

            ipc.server.emit(
                socket,
                'DiscordBotResponse',
                {
                    message: "channel usw von Servern",
                    data: resGuild,
                    user: user
                    /*response: resGuild*/
                }
            );
        
	}
};