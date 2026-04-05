module.exports = async function (client, plugin, config, projectAlias, data) {
    const { state } = data;
    if (plugin.loginBridge && plugin.loginBridge[state]) {
        const result = plugin.loginBridge[state];
        delete plugin.loginBridge[state];
        return { success: true, ...result };
    }
    return { success: false };
};
