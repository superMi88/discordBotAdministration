// Similar to ItemList
class AnimationList {

    list = null;

    constructor() {
        this.list = {
            ...{
                ABBRECHEN: { name: "Default" }
            },
            ...require("../animations.js")
        }
    }

    getListAll() {
        return this.list
    }
}

module.exports = AnimationList;
