
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "prozess wird bereits gestartet",
                status: botStruct.status,
                timestamp: Date.now()
            }
        );

        if(botStruct.status == 'offline'){
            botStruct.status = 'starting'
    
            botStruct.client = await createClient(db);
            try{
                botStruct.client.login(botStruct.token).then(() => {

                    botStruct.status = 'online'

                    /*
                    ipc.server.emit(
                        socket,
                        'DiscordBotResponse',
                        {
                            message: "prozess wurde gestartet",
                            status: botStruct.status,
                            timestamp: Date.now()
                        }
                    );*/
                });
            }catch(error){
                console.log(error)
            }
        }else{
            /*
            ipc.server.emit(
                socket,
                'DiscordBotResponse',
                {
                    message: "prozess wird bereits gestartet",
                    status: botStruct.status,
                    timestamp: Date.now()
                }
            );*/
        }
        
	}
};