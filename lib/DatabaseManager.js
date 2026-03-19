var ObjectId = require('mongodb').ObjectId;

/**
 * Shared database manager for both Discord bot and Website.
 */
class DatabaseManager {

    db = undefined; 

    constructor() {
    }

    /**
     * Creates/Initiates the database connection.
     * @param {string} projectAlias - The MongoDB database name
     */
    async create(projectAlias){
        const { MongoClient } = require('mongodb')
        
        // Try getting url from config or default local
        let url = 'mongodb://localhost:27017';
        
        // This is a singleton of the DB for this process
        if (this.db) return this.db;

        const mongoClient = new MongoClient(url)
        await mongoClient.connect();
        this.db = mongoClient.db(projectAlias);
        return this.db;
    }

    /**
     * Returns the active database instance.
     * @returns {Object} MongoDB database instance
     */
    get(){
        if(!this.db) throw new Error('Datenbank wurde noch nicht erstellt. Rufe DatabaseManager.create(projectAlias) zuerst auf.');
        return this.db
    }

    /**
     * Closes the connection (optional)
     */
    async close(){
        // Handled by process exit usually
    }
}

module.exports = new DatabaseManager();
