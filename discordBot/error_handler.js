
const System = require("./lib/system.js");

module.exports = (client, db) => {

    const errChannel = "123"
    const database = db

    process.on('unhandledRejection', (err) =>{

        console.log("[Crash] :: unhandledRejection")
        console.log(err)

        System.log(database, System.status.ERROR, "[uncaughtException]", err.stack.toString())

        const fs = require('fs');

        fs.appendFile('./../logs/error.log', err.stack.toString()+"\n\n", err => {
            if (err) {
                console.error(err);
            }
        });
    })

    process.on('uncaughtException', (err) =>{

        console.log("[Crash] :: uncaughtException")
        console.log(err)

        System.log(database, System.status.ERROR, "[uncaughtException]", err.stack.toString())

        const fs = require('fs');

        fs.appendFile('./../logs/error.log', err.stack.toString()+"\n\n", err => {
            if (err) {
                console.error(err);
            }
        });
    })

    process.on('uncaughtExceptionMonitor', (err) =>{

        console.log("[Crash] :: uncaughtExceptionMonitor")
        console.log(err)

        System.log(database, System.status.ERROR, "[uncaughtException]", err.stack.toString())

        const fs = require('fs');

        fs.appendFile('./../logs/error.log', err.stack.toString()+"\n\n", err => {
            if (err) {
                console.error(err);
            }
        });
    })

    /*
    process.on('multipleResolves', (type, promise, reason) =>{

        console.log("[Crash] :: multipleResolves")
        console.log(type, promise, reason)

        const fs = require('fs');

        fs.appendFile('./../logs/error.log', type+"\n\n"+promise+"\n\n"+reason+"\n\n", err => {
            if (err) {
                console.error(err);
            }
        });
    })*/

} 