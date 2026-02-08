//TODO umbenennen in getChannels oder sowas -> !!!! getGuild ist außerdem in index.js for all guilds 
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        const GUILD_CATEGORY = 4
        const GUILD_TEXT = 0
        const GUILD_VOICE = 2

        const guilds = botStruct.client.guilds.cache;

            let resGuild = []

            for (let guild of guilds) {

                let noCatChannelsText = []
                let noCatChannelsVoice = []
                let catChannel = []
                const channels = await guild[1].channels.fetch()


                resGuild.push()

                for (let channel of channels) {

                    if(channel[1].parentId == null && channel[1].type != GUILD_CATEGORY){
                        if(channel[1].type == GUILD_VOICE){
                            noCatChannelsVoice[channel[1].position] = 
                            {
                                id: channel[1].id,
                                name: channel[1].name,
                                type: channel[1].type,
                                position: channel[1].position,
                                textChannel: [],
                                voiceChannel: []
                            }
                        }
                        if(channel[1].type == GUILD_TEXT){
                            noCatChannelsText[channel[1].position] = 
                            {
                                id: channel[1].id,
                                name: channel[1].name,
                                type: channel[1].type,
                                position: channel[1].position,
                                textChannel: [],
                                voiceChannel: []
                            }
                        }
                    }

                    if(channel[1].type == GUILD_CATEGORY){

                        
                        catChannel[channel[1].position] = 
                        {
                            id: channel[1].id,
                            name: channel[1].name,
                            type: channel[1].type,
                            position: channel[1].position,
                            textChannel: [],
                            voiceChannel: []
                        }
                        
                    }
                }
                

                for (let channel of channels) {
                    if(channel[1].parentId == null){
                    }
                    else if(channel[1].type != GUILD_CATEGORY){

                        for (let i = 0; i < catChannel.length; i++) {
                            const activeCat = catChannel[i];
                            if(activeCat.id == channel[1].parentId){
                                
                                if(channel[1].type == GUILD_VOICE){
                                    activeCat.voiceChannel[channel[1].position] = 
                                    {
                                        id: channel[1].id,
                                        parentId: channel[1].parentId,
                                        name: channel[1].name,
                                        type: channel[1].type,
                                        nsfw: channel[1].nsfw,
                                        position: channel[1].position
                                    }
                                }
                                if(channel[1].type == GUILD_TEXT){
                                    activeCat.textChannel[channel[1].position] = 
                                    {
                                        id: channel[1].id,
                                        parentId: channel[1].parentId,
                                        name: channel[1].name,
                                        type: channel[1].type,
                                        nsfw: channel[1].nsfw,
                                        position: channel[1].position
                                    }
                                }
                            }
                            
                        }

                    }
                }
                
                    
                

                /*sortieren*/

                catChannel.sort(function(x, y) {
                    if (x.position < y.position) {
                      return -1;
                    }
                    if (x.position >= y.position) {
                      return 1;
                    }
                    return 0;
                });

                noCatChannelsText.sort(function(x, y) {
                    if (x.position < y.position) {
                      return -1;
                    }
                    if (x.position >= y.position) {
                      return 1;
                    }
                    return 0;
                });

                noCatChannelsVoice.sort(function(x, y) {
                    if (x.position < y.position) {
                      return -1;
                    }
                    if (x.position >= y.position) {
                      return 1;
                    }
                    return 0;
                });

                
                resGuild.push(
                    {
                        id: guild[1].id,
                        icon: guild[1].icon,
                        guild: guild[1].name,
                        channels: catChannel,
                        noCatChannelsText: noCatChannelsText,
                        noCatChannelsVoice: noCatChannelsVoice
                    }
                )
            }

            ipc.server.emit(
                socket,
                'DiscordBotResponse',
                {
                    message: "channel usw von Servern",
                    data: resGuild
                    /*response: resGuild*/
                }
            );
        
	}
};