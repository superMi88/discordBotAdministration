//TODO umbenennen in getGuilds wenn name frei ist
module.exports = {
	async execute(ipc, botStruct, data, socket, createClient, db) {

        data = data.data

        const fs = require('fs');

        let content = ''
        let updatet = false

        if(fs.existsSync('./cache/bot-'+data.botId+'/plugin-'+data.pluginId+'/cache.txt')){

            let filedata = null
            try {
                filedata = fs.readFileSync('./cache/bot-'+data.botId+'/plugin-'+data.pluginId+'/cache.txt', 'utf8');
            } catch (err) {
                console.error(err);
            }

            var first_iteration = true;

            for (let line of filedata.split("\n")) {
                
                                
                let fieldname = line.split("=")[0]
                //console.log("TEST AUSGABE")
                //console.log(data.fieldnameToUpdate)
                //console.log(fieldname)

                if(data.fieldnameToUpdate == fieldname){
                    //console.log("updatet")
                    line = fieldname +'='+ data.value
                    updatet = true
                }
                
                if(first_iteration){
                    content += line
                }else{
                    content += '\n'+line
                }
                first_iteration = false;
            }
            if(!updatet){
                //console.log("neu")
                if(first_iteration){
                    content += data.fieldnameToUpdate +'='+ data.value
                }else{
                    content += '\n'+data.fieldnameToUpdate +'='+ data.value
                }
                
            }
        }else{
            content += data.fieldnameToUpdate +'='+ data.value
        }
        

        try {
            //console.log("write content")
            //console.log(content)
            writeFileSyncRecursive('./cache/bot-'+data.botId+'/plugin-'+data.pluginId+'/cache.txt', content);
            // file written successfully
        } catch (err) {
            console.error(err);
        }
        



        ipc.server.emit(
            socket,
            'DiscordBotResponse',
            {
                message: "field im cache geupdatet",
                data: {}
            }
        );
    
	}
};



function writeFileSyncRecursive(filename, content, charset) {

    const fs = require('fs');
    // -- normalize path separator to '/' instead of path.sep, 
    // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
    let filepath = filename.replace(/\\/g,'/');  
  
    // -- preparation to allow absolute paths as well
    let root = '';
    if (filepath[0] === '/') { 
      root = '/'; 
      filepath = filepath.slice(1);
    } 
    else if (filepath[1] === ':') { 
      root = filepath.slice(0,3);   // c:\
      filepath = filepath.slice(3); 
    }
  
    // -- create folders all the way down
    const folders = filepath.split('/').slice(0, -1);  // remove last item, file
    folders.reduce(
      (acc, folder) => {
        const folderPath = acc + folder + '/';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
        }
        return folderPath
      },
      root // first 'acc', important
    ); 
    
    // -- write file
    fs.writeFileSync(root + filepath, content, charset);
  }