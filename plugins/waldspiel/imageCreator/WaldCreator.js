const { date } = require("../lib/date.js");
const Backgroundlist = require('../obj/BackgroundList.js');
const fs = require('fs');
const crypto = require('crypto');

class WaldCreator {

    sharpobj = null;
    mergeArray = [];
    background = null;

    constructor(background) {
        this.background = getBackgroundByTag(background)
    }

    setMergeArray(mergeArray) {
        this.mergeArray = (mergeArray || []).map(item => ({ ...item })); // Clone to avoid side effects
    }
    
    async createImage() {
        const sharp = require('sharp');

        // Ensure the cache directory exists
        const cacheDir = 'plugins/waldspiel/images/cache';
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // Generate a unique hash for the image based on background and mergeArray
        const hash = crypto.createHash('md5');
        hash.update(this.background.filename || 'default');
        
        // For mergeArray, we'll hash the positions and input if possible
        this.mergeArray.forEach(item => {
            hash.update(item.left.toString());
            hash.update(item.top.toString());
            if (Buffer.isBuffer(item.input)) {
                hash.update(item.input.length.toString()); 
            } else if (typeof item.input === 'string') {
                hash.update(item.input);
            }
        });

        const imageHash = hash.digest('hex');
        const filename = `${cacheDir}/wald_${imageHash}.png`;

        if (fs.existsSync(filename)) {
            return filename;
        }

        let sharpobj = sharp('plugins/waldspiel/images/backgrounds/' + this.background.filename + '.png')

        //add background overlay if needed
        if (this.background && this.background.overlay) {
            this.mergeArray.unshift({ input: await sharp('plugins/waldspiel/images/backgrounds/' + this.background.overlay + '.png').toBuffer(), left: 0, top: 0 })
        }

        //add mergeArray if exists
        if (Array.isArray(this.mergeArray) && this.mergeArray.length > 0) {
            sharpobj = sharpobj.composite(this.mergeArray)
        }

        await sharpobj.toFile(filename)
        return (filename)
    }

}

function getUserBackgroundFilepath(discordUserDatabase) {
    var background = discordUserDatabase["background"]
    if (!background) {
        return 'plugins/waldspiel/images/backgrounds/Default.png'
    }
    const Background = getBackgroundByTag(background)
    return 'plugins/waldspiel/images/backgrounds/' + Background.filename + '.png'
}

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
			retunObj["overlay"] = currentBackground.filename.dayoverlay;
		}
	}
	return retunObj
}

module.exports = WaldCreator;
