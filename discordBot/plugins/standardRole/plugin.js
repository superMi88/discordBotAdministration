const DatabaseManager = require("../../lib/DatabaseManager.js");
const dataManager = require("../../lib/dataManager.js")
const PluginManager = require("../../lib/PluginManager.js");

const { EmbedBuilder } = require('discord.js');


class Plugin {
	
	variable = { } //TODO hier stehen die plugin vars drin die geändert werden können
	async execute(client, plugin) {
		let db = DatabaseManager.get()
		

		addStandartRolesToAllMember(plugin, db, client)

		plugin.on(client, 'guildMemberUpdate', async (oldMember, newMember) => {
			addStandartRolesToMemberIfNeeded(newMember, plugin)
		})

	}
	async save(plugin, config) {
		
		let client = dataManager.client
		let db = DatabaseManager.get()

		let status = await PluginManager.save(plugin, config)
		if(!status.saved){
			return status
		}

		addStandartRolesToAllMember(plugin, db, client)

		return ({ saved: true, infoMessage: "Standart Rollen geupdatet", infoStatus: "Info" })
	}
};
module.exports = new Plugin();


function addStandartRolesToAllMember(plugin, db, client){
	const collection = db.collection('userCollection');

	const allUser = collection.find({})
	let guild = client.guilds.cache.get(plugin['var'].server); //TODO change this 

	allUser.forEach(async user => {
		let member = guild.members.cache.get(user.discordId)

		//if member dont exist anymore
		if(!member) return ""

		addStandartRolesToMemberIfNeeded(member, plugin)

	});
}

function addStandartRolesToMemberIfNeeded(member, plugin){
			
	plugin['var'].standardRoleArray.forEach(standardRoleObj => {
		let standardRole = standardRoleObj.standardRole
		let requiredRole = plugin['var'].requiredRole
		let hasRole = false
		let hasRequiredRole = false
		if (standardRole) {
			member._roles.forEach(memberRole => {

				if(memberRole === requiredRole){
					hasRequiredRole = true
				}

				if (memberRole === standardRole) {
					hasRole = true
				}
			})
			if(!hasRole && hasRequiredRole){
				member.roles.add(standardRole);
			}
		}
	})
}