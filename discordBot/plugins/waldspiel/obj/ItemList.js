const ExtensionManager = require('../ExtensionManager');

class ItemList {

    list = null;

    constructor() {
        this.list = {
            ...{
                ABBRECHEN: { name: "Default", filename: "Abbrechen" }
            },
            ...require("../items.js"),
            //...require("../itemsHalloween.js"), // Now via Extension
            //...require("../itemsWeihnachten.js"), // Now loaded via ExtensionManager
            //...require("../itemsValentinstag.js"), // Assuming this is next or I leave it
            //...require("../itemsOstern.js"), // Now via Extension
            //...require("../itemsCarrot.js"), // Now via Extension
            ...ExtensionManager.getItems()
        }
    }


    getListAll() {
        return this.list
    }


}



module.exports = ItemList;