module.exports = {
    name: "bongoApp",
    shortDescription: "Bongo App",
    description: "API for the Bongo Cat App",
    category: "Utility",
    blocks: [
        {
            type: "alone",
            description: "Discord Client ID",
            fields: [
                {
                    type: "text",
                    name: "discordClientId",
                    required: true
                }
            ]
        },
        {
            type: "alone",
            description: "Discord Client Secret",
            fields: [
                {
                    type: "text",
                    name: "discordClientSecret",
                    required: true
                }
            ]
        },
        {
            type: "alone",
            description: "Discord Redirect URI",
            fields: [
                {
                    type: "text",
                    name: "redirectUri",
                    required: false
                }
            ]
        },
        {
            type: "alone",
            description: "JWT Secret (Optional)",
            fields: [
                {
                    type: "text",
                    name: "jwtSecret",
                    required: false
                }
            ]
        }
    ],
    buttons: [
        {
            name: "Speichern",
            onClick: "save"
        }
    ],
    defaultConfig: {}
};
