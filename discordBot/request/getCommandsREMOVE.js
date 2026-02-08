
const fs = require('fs');

module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        let response = []
        const clientFromDatabase = await getBotFromDatabase(db, botStruct.client.user.id)
        const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith(".js"));

        for (const file of commandFiles) {

            const command = require(`../commands/${file}`);
            const name = file.split('.')[0]
            if(clientFromDatabase.commands.includes(name)){
                command.info.active = true
            }else{
                command.info.active = false
            }
            //nur commands mit dem info attribute
            if(command.info){
                response.push(command.info)
            }       
        }
                
        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                response: response,
                data: {miau: "test"}
            }
        );
        
	}
};


async function getBotFromDatabase(id) {

    const collection = db.collection('botCollection');
    const filteredDocs = await collection.findOne({ id: id });
    return filteredDocs;
}