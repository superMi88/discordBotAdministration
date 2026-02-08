import {IPCModule} from 'node-ipc';

export async function sendDataToDiscordBot(botId, command, data) {
      
    const ipc=new IPCModule;

    ipc.config.id = 'webserver-'+uid();
    ipc.config.retry = 1000;
    ipc.config.maxRetries = 5;
    ipc.config.silent = true;

    var discordBotData = await new Promise(
        // Resolver-Funktion kann den Promise sowohl auflösen als auch verwerfen
        // reject the promise
        function(resolve, reject) {

            ipc.connectTo(
                'discordBot'+botId,
                function(){

                    ipc.of['discordBot'+botId].on(
                        'connect',
                        function(){
                            ipc.of['discordBot'+botId].emit(
                                'WebserverRequest',  //any event or message type your server listens for
                                {command:command, data:data}
                            )
                        }
                    );

                    ipc.of['discordBot'+botId].on(
                        'disconnect',
                        function(){
                            if(
                                ipc.of['discordBot'+botId] === undefined || 
                                ipc.of['discordBot'+botId].retriesRemaining === 0
                            ){
                                reject("Bot Process nicht erreichbar")
                            }
                        }
                    );
                    
                    ipc.of['discordBot'+botId].on(
                        ('DiscordBotResponse'),  //any event or message type your server listens for
                        function(data){
                            resolve(data)
                            ipc.disconnect('discordBot'+botId);
                        }   
                    );
                }
            )
        }
        
    ).catch(error => {
        return ({
            statusCode: "Error",
            message: error
        })
    })

    return discordBotData;
}

function uid() {
    return (performance.now().toString(36)+Math.random().toString(36)).replace(/\./g,"");
};

  