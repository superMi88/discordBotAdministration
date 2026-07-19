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
		if (plugin && plugin['var']) {
			return await handleUserVerifiedRoles(db, plugin, member);
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



async function handleUserVerifiedRoles(db, plugin, member){
	// Rolle entfernen, falls eine definiert ist und auf dieser Guild existiert
	const removeRoleId = plugin['var']?.welcomeRoleRemove;
	if (removeRoleId && member.guild.roles.cache.has(removeRoleId)) {
		if (member.roles.cache.has(removeRoleId)) {
			try {
				await member.roles.remove(removeRoleId);
				System.log(db, System.status.INFO, "[welcomeRole]", `${member.user.username}[${member.user.id}] Rolle [${removeRoleId}] auf ${member.guild.name} entfernt`);
			} catch (err) {
				console.error("[welcomeRole] Fehler beim Entfernen der Rolle:", err);
			}
		}
	}

	// Rolle hinzufügen, falls eine definiert ist
	const roleId = plugin['var']?.welcomeRole;
	if (!roleId) return true;

	if (!member.guild.roles.cache.has(roleId)) {
		// Rolle existiert auf dieser Guild nicht - überspringe ohne Fehler
		return true;
	}

	System.log(db, System.status.INFO, "[welcomeRole]", member.user.username+"["+member.user.id+"] wurde verifiziert und hat Rolle ["+roleId+"] auf "+member.guild.name+" erhalten" )

	let attempts = 0;
	// Try to add role up to 5 times (avoiding infinite loops)
	while(!member.roles.cache.has(roleId) && attempts < 5){
		try {
			await member.roles.add(roleId);
		} catch (err) {
			console.error("[welcomeRole] Fehler beim Hinzufügen der Rolle:", err);
		}
		attempts++;
		if (!member.roles.cache.has(roleId) && attempts < 5) {
			await new Promise(resolve => setTimeout(resolve, 3000));
		}
	}

	return member.roles.cache.has(roleId);
}
