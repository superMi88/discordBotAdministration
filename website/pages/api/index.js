import { CommandInteractionOptionResolver } from "discord.js";
import { getFields } from "./bot/isRunning";

const path = require('path');
const fs = require('fs');


export default async function handler(req, res) {


    /*
        let filenames = fs.readdirSync("./pages/api", { withFileTypes: true });
    
        //listing all files using forEach
        filenames.forEach(function (file) {
            // Do whatever you want to do with the file
    
            if(file.isDirectory()){
                let filenames = fs.readdirSync("./pages/api/"+file.name, { withFileTypes: true });
                filenames.forEach(function (file2) {
                    // Do whatever you want to do with the file
            
                    filelist.push(file.name+"/"+file2.name) 
                });
            }
            filelist.push(file.name) 
        });*/


    res.status(200).json({
        status: "ok",
        files: readFile("")
    })

    if (req.method === 'POST') {

    } else {
        // Handle any other HTTP method
    }

}

function readInfo(zusatz) {

    try {
        const { getInfo } = eval('require')(path.join(process.cwd(), "pages/api" + zusatz + "/_info.js"));

        return getInfo()

        // do stuff
    } catch (ex) {
        return ""
    }

    return ""
}

function readFile(zusatz) {

    let filelistInFolder = []

    fs.readdirSync("./pages/api" + zusatz, { withFileTypes: true }).forEach(function (file) {
        // Do whatever you want to do with the file

        let information
        let fields

        if (file.isDirectory()) {
            filelistInFolder.push({
                type: "folder",
                name: file.name,
                information: readInfo(zusatz + "/" + file.name, file),
                files: readFile(zusatz + "/" + file.name)

            })
        } else {
            if (file.name !== "_info.js" && file.name !== "_middleware.js") {
                if (file.name !== "getGoogleApiPhotos.js") {

                    const { getInformation, getFields } = eval('require')(path.join(process.cwd(), "pages/api" + zusatz + "/" + file.name));
                    if (getInformation) {
                        information = getInformation()
                    }
                    if (getFields) {
                        fields = getFields()
                    }


                }

                filelistInFolder.push({
                    type: "file",
                    path: zusatz + "/" + file.name,
                    information: information,
                    fields: fields
                })
            }
        }

    });

    filelistInFolder.sort(function (a, b) {
        //sort by name
        if (a.type === "folder" && b.type === "folder") {
            return a - b
        }

        //sort by type
        if (a.type === "folder") {
            return -1
        }
        return 1;
    });


    return filelistInFolder
}
