module.exports = async function (client, plugin, config, projectAlias, data) {
    const now = new Date();
    const active = Object.keys(plugin.activeUsers || {})
        .filter(name => (now - plugin.activeUsers[name].lastSeen) < 120000)
        .map(name => ({
            id: plugin.activeUsers[name].id,
            name: name,
            skin: plugin.activeUsers[name].skin,
            displayName: plugin.activeUsers[name].displayName
        }));
    return active;
};
