module.exports = async function (client, plugin, config, projectAlias, data) {
    const { username } = data;
    if (username && plugin.activeUsers && plugin.activeUsers[username]) {
        plugin.activeUsers[username].lastSeen = new Date();
    }
    return { status: 'alive' };
};
