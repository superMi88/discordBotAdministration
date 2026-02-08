// lib/botManager.js
class BotManager {
    constructor() {
        if (!BotManager.instance) {
            this.discordBots = new Map();
            BotManager.instance = this;
        }
        return BotManager.instance;
    }

    addBot(id, process) {
        this.discordBots.set(id, process);
    }

    getBot(id) {
        return this.discordBots.get(id);
    }

    getAllBots() {
        return Array.from(this.discordBots.values());
    }

    removeBot(id) {
        this.discordBots.delete(id);
    }
}

const instance = new BotManager();
module.exports = instance;