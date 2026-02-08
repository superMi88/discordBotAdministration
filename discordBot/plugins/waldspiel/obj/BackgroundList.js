const ExtensionManager = require('../ExtensionManager');

class Backgroundlist {

    list = null;

    constructor() {
        this.list = {
            ...{
                DEFAULT: {
                    name: "Default",
                    filename: {
                        day: "Default",
                        night: "Default"
                    },
                },
            },
            //...require("../backgroundsWeihnachten.js"), // Now loaded via ExtensionManager
            //...require("../backgroundsOstern.js"), // Now via Extension
            ...require("../backgrounds.js"),
            ...ExtensionManager.getBackgrounds()
        }
    }


    getBackgroundListAll() {
        return this.list
    }

    getByTag(tag) {

        const backgrounds = this.getBackgroundListAll();

        // Falls das Tag existiert, gib das Objekt zurück
        if (backgrounds[tag]) return backgrounds[tag];

        //default value "ABBRECHEN"
        return backgrounds["DEFAULT"];
    }

}



module.exports = Backgroundlist;