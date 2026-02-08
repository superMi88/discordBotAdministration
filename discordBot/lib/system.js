const DatabaseManager = require("./DatabaseManager");



module.exports = {
    status: {
        INFO: "INFO",
        WARNING: "WARNING",
        ERROR: "ERROR"
    },
    async log(dbAlt, status, title, text){

        let db = DatabaseManager.get()

        
        const botCollection = db.collection('log');

        const insertResult = await botCollection.insertOne(
            {
                status: status,
                title: title,
                text: text,
                timestamp: new Date()
            }
        )
    }
}