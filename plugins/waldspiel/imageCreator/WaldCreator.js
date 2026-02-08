const imageCreator = require('../imageCreator.js');
const { date } = require("../lib/date.js");
const Backgroundlist = require('../obj/BackgroundList.js');

class WaldCreator {

    sharpobj = null;
    mergeArray = [];
    background = null;

    constructor(background) {
        this.background = getBackgroundByTag(background)
    }

    setMergeArray(mergeArray) {
        this.mergeArray = mergeArray
    }
    
    async createImage() {

        const sharp = require('sharp');

        let sharpobj = sharp('plugins/waldspiel/images/backgrounds/' + this.background.filename + '.png')


        //add background overlay if needed
        if(this.background && this.background.overlay){
            this.mergeArray.push({ input: await sharp('plugins/waldspiel/images/backgrounds/' + this.background.overlay + '.png').toBuffer(), left: 0, top: 0 })
        }

        //add mergeArray if exists
        if(Array.isArray(this.mergeArray) && this.mergeArray.length > 0){
            sharpobj.composite(this.mergeArray)
        }

        //TODO: generate unique filename
        const filename = 'temp/finalpicture.png'

        await sharpobj.toFile(filename)
        return(filename)
    }

}

//all this functions exists two times ------------------------

function getUserBackgroundFilepath(discordUserDatabase) {

    var background = discordUserDatabase["background"]
    if (!background) {
        return 'plugins/waldspiel/images/backgrounds/Default.png'
    }

    const Background = getBackgroundByTag(background)

    return 'plugins/waldspiel/images/backgrounds/' + Background.filename + '.png'
}

//same as getTextBuffer4 but with custom font size
function getBackgroundByTag(tag) {

	const dateInfo = date();

    let backgroundlist = new Backgroundlist()
	const currentBackground = backgroundlist.getByTag(tag)

	let retunObj = {
		name: currentBackground.name,
		price: currentBackground.price
	}

	if(dateInfo.isNight){
		retunObj["filename"] = currentBackground.filename.night;
		if(currentBackground.filename.nightoverlay){
			retunObj["overlay"] = currentBackground.filename.nightoverlay;
		}
		
	}
	if(dateInfo.isDay){
		retunObj["filename"] = currentBackground.filename.day;
		if(currentBackground.filename.dayoverlay){
			retunObj["overlay"] = currentBackground.filename.nightoverlay;
		}
	}

	return retunObj
	
}


module.exports = WaldCreator;
