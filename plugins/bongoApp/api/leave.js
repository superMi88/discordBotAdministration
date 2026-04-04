module.exports = async function (client, plugin, config, projectAlias, data) {
    const { username } = data;
    if (username && plugin.activeUsers) {
        delete plugin.activeUsers[username];
    }
    return { status: 'left' };
};
