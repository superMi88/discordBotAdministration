const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../discordBot/lib/dataManager.js")
const PluginManager = require("../../discordBot/lib/PluginManager.js");

const System = require("../../discordBot/lib/system.js");

class Plugin {
	async execute(client, plugin) {
		// Event triggers are invoked via user verification (onUserVerified)
	}

	async onUserVerified(client, plugin, member) {
		let db = DatabaseManager.get()
		if (plugin && plugin['var'] && plugin['var'].welcomeRole) {
			return await giveMemberRole(db, plugin, member);
		}
		return true;
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



async function giveMemberRole(db, plugin, member){
	System.log(db, System.status.INFO, "[welcomeRole]", member.user.username+"["+member.user.id+"] wurde verifiziert und hat Rolle ["+plugin['var'].welcomeRole+"] erhalten" )

	let attempts = 0;
	// Try to add role up to 5 times (avoiding infinite loops)
	while(!member.roles.cache.has(plugin['var'].welcomeRole) && attempts < 5){
		try {
			await member.roles.add(plugin['var'].welcomeRole);
		} catch (err) {
			console.error("[welcomeRole] Fehler beim Hinzufügen der Rolle:", err);
		}
		attempts++;
		if (!member.roles.cache.has(plugin['var'].welcomeRole) && attempts < 5) {
			await new Promise(resolve => setTimeout(resolve, 3000));
		}
	}

	return member.roles.cache.has(plugin['var'].welcomeRole);
}
