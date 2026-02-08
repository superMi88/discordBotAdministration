//TODO umbenennen in getGuilds wenn name frei ist
module.exports = {
	async execute(botStruct, data) {

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

            return(resGuild)
        
	}
};

//wird nicht verwendet delete maybe