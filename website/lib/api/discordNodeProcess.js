import {IPCModule} from 'node-ipc';

export async function sendDataToNodeProcess(command, data) {
      
    const ipc=new IPCModule;

    ipc.config.id = 'webserver-'+uid();
    ipc.config.retry = 1000;
    ipc.config.maxRetries = 5;
    ipc.config.silent = true;

    var data = await new Promise(
        // Resolver-Funktion kann den Promise sowohl auflösen als auch verwerfen
        // reject the promise
        function(resolve, reject) {

            ipc.connectTo(
                'nodeProcess',
                function(){

                    ipc.of['nodeProcess'].on(
                        'connect',
                        function(){
                            ipc.of['nodeProcess'].emit(
                                'WebserverRequest',  //any event or message type your server listens for
                                {command:command, data:data}
                            )
                        }
                    );

                    ipc.of['nodeProcess'].on(
                        'disconnect',
                        function(){
                            if(
                                ipc.of['nodeProcess'] === undefined || 
                                ipc.of['nodeProcess'].retriesRemaining === 0
                            ){
                                reject("Bot Process nicht erreichbar")
                            }
                        }
                    );
                    
                    ipc.of['nodeProcess'].on(
                        ('NodeProcessResponse'),  //any event or message type your server listens for
                        function(data){
                            resolve(data)
                            ipc.disconnect('nodeProcess');
                        }   
                    );
                }
            )
        }
        
    ).catch(error => {
        console.log(error)
        return ({
            statusCode: "Error",
            message: error
        })
    })

    return data;
}

function uid() {
    return (performance.now().toString(36)+Math.random().toString(36)).replace(/\./g,"");
};
