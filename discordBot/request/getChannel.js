//TODO umbenennen in getChannels oder sowas -> !!!! getGuild ist außerdem in index.js for all guilds 
module.exports = {
    async execute(ipc, botStruct, data, socket, createClient, db) {

        const GUILD_CATEGORY = 4
        const GUILD_TEXT = 0
        const GUILD_VOICE = 2

        if(!botStruct.client.guilds) return "";
        const oAuth2GuildList = await botStruct.client.guilds.fetch()

        let guildlist = []
        for (const oAuth2Guild of oAuth2GuildList) {
            const guild = await oAuth2Guild[1].fetch()

            if(!guild.channels) return "";
            const channels = await guild.channels.fetch()
            let channellist = []

            for (const channel of channels) {
        
                channellist.push({
                    id: channel[1].id,
                    name: channel[1].name,
                    type: channel[1].type,
                })

            }

            guildlist.push({
                id: guild.id,
                icon: guild.icon,
                name: guild.name,
                channels: channellist
            })

        }

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "channel usw von Servern",
                data: guildlist
                /*response: resGuild*/
            }
        );

    }
};