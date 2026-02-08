const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const System = require("../../lib/system.js");

class Plugin {
	async execute(client, plugin) {
		let db = DatabaseManager.get()

		//guildMemberUpdate
		plugin.on(client, 'guildMemberUpdate', async (oldMember, newMember) => {

			//wenn der status von pending von true auf false springt führe den ganzen code hier unten drunter aus
			if (!(oldMember.pending == true && newMember.pending == false)) return ""

			await giveMemberRole(db, plugin, newMember)

		});

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
	System.log(db, System.status.INFO, "[welcomeRole]", member.user.username+"["+member.user.id+"] ist beigetreten und hat rolle["+plugin['var'].welcomeRole+"] erhalten" )

	//try to add role until it is added every 5 seconds
	while(! member.roles.cache.has(plugin['var'].welcomeRole) ){
		member.roles.add(plugin['var'].welcomeRole)
		await new Promise(resolve => setTimeout(resolve, 5000));
	}

}