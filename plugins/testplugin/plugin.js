const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const System = require("../../discordBot/lib/system.js");

class Plugin {
	async execute(client, plugin) {

	}
	async save(plugin, config) {

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		return ({ saved: true, infoMessage: "Infos gespeichert", infoStatus: "Info" })
	}
};
module.exports = new Plugin();
