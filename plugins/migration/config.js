module.exports = {
    name: "migration",
    shortDescription: "Migration Plugin",
    description: "Hier kannst du die Migration der Userdaten von der alten in die neue Datenbankstruktur starten.",
    blocks: [
        {
            type: "alone",
            description: "Migration Settings",
            fields: [
                {
                    type: "text",
                    name: "statusInfo",
                    description: "Status der Migration",
                    disabled: true,
                    placeholder: "Zuletzt ausgeführte Migration erscheint hier nach dem Speichern."
                }
            ]
        }
    ],
    buttons: [
        {
            name: "Speichern & Migrieren",
            onClick: "save"
        }
    ]
};
