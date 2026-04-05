module.exports = async function (client, plugin, config, projectAlias, data) {
    return { 
        clientId: plugin.var?.discordClientId || client.user.id,
        projectAlias: projectAlias
    };
};
