
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        const guilds = botStruct.client.guilds.cache;

        let responseRoles = []

        guilds.forEach((guild, i) =>{

            let roleslist = []
            guild.roles.cache.forEach((roles, i) =>{

                //console.log(roles)

                //remove roles managed by extern extensions and @everyone role
                if(!roles.managed && roles.name != "@everyone"){

                    roleslist.push(
                        {
                            id: roles.id,
                            name: roles.name,
                            color: roles.color
                        }
                    )
                }
            })

            responseRoles.push(
                {
                    id: guild.id,
                    icon: guild.icon,
                    guild: guild.name,
                    roles: roleslist
                }
            )
        })

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "roles von Servern",
                data: responseRoles
            }
        );
        
	}
};