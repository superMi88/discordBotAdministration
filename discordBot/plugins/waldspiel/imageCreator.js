//const Itemlist = require("./items.js")
//const Backgroundlist = require("./backgrounds.js")
const Animallist = require("./animals.js")
const DatabaseManager = require("../../lib/DatabaseManager.js");

const { date } = require('./lib/date.js');
const WaldCreator = require("./imageCreator/WaldCreator.js");

const Backgroundlist = require('./obj/BackgroundList.js');
const ItemList = require("./obj/ItemList.js");


module.exports = {


	async createMeinWald(discordUserDatabase) {

		const sharp = require('sharp')

		if (!animalExist(discordUserDatabase, 1) && !animalExist(discordUserDatabase, 2) && !animalExist(discordUserDatabase, 3)) {
			await sharp(getUserBackgroundFilepath(discordUserDatabase))
				.toFile('temp/finalpicture.png')
		}

		let mergeArray = []

		if (animalExist(discordUserDatabase, 1)) {

			mergeArray.push({
				input: await sharp(await getAnimalFilepath(discordUserDatabase, 1)).resize(150).toBuffer(),
				left: 30,
				top: 135
			})

			if (await itemExist(discordUserDatabase, 1)) {


				mergeArray.push({
					input: await sharp(await getItemFilepath(discordUserDatabase, 1)).resize(150).toBuffer(),
					left: 30,
					top: 135
				})
			}
			if (await animalNameExist(discordUserDatabase, 1)) {

				mergeArray.push({
					input: await sharp('plugins/waldspiel/images/nametag.png').toBuffer(),
					left: 30,
					top: 270
				})
				mergeArray.push({ input: getTextBuffer4(await getAnimalName(discordUserDatabase, 1), 105, 290), left: 0, top: 0 })
			}
		}
		if (animalExist(discordUserDatabase, 2)) {
			mergeArray.push({ input: await sharp(await getAnimalFilepath(discordUserDatabase, 2)).resize(150).toBuffer(), left: 195, top: 130 })
			if (await itemExist(discordUserDatabase, 2)) {
				mergeArray.push({ input: await sharp(await getItemFilepath(discordUserDatabase, 2)).resize(150).toBuffer(), left: 195, top: 130 })
			}
			if (await animalNameExist(discordUserDatabase, 2)) {
				mergeArray.push({ input: await sharp('plugins/waldspiel/images/nametag.png').toBuffer(), left: 195, top: 270 })
				mergeArray.push({ input: getTextBuffer4(await getAnimalName(discordUserDatabase, 2), 270, 290), left: 0, top: 0 })
			}
		}
		if (animalExist(discordUserDatabase, 3)) {
			mergeArray.push({ input: await sharp(await getAnimalFilepath(discordUserDatabase, 3)).resize(150).toBuffer(), left: 360, top: 135 })
			if (await itemExist(discordUserDatabase, 3)) {
				mergeArray.push({ input: await sharp(await getItemFilepath(discordUserDatabase, 3)).resize(150).toBuffer(), left: 360, top: 135 })
			}
			if (await animalNameExist(discordUserDatabase, 3)) {
				mergeArray.push({ input: await sharp('plugins/waldspiel/images/nametag.png').toBuffer(), left: 360, top: 270 })
				mergeArray.push({ input: getTextBuffer4(await getAnimalName(discordUserDatabase, 3), 430, 290), left: 0, top: 0 })
			}
		}

		const imageCreator = new WaldCreator(discordUserDatabase["background"])
		imageCreator.setMergeArray(mergeArray)
		await imageCreator.createImage()
	},

	async createMeinStorage(animalStorage, currentPage) {

		const sharp = require('sharp');

		// Anzahl der Tiere pro Seite
		const animalsPerPage = 30;

		if (animalStorage) {

			// Berechnung der Start- und End-Index für die aktuelle Seite
			let startIndex = currentPage * animalsPerPage;
			let endIndex = Math.min((currentPage + 1) * animalsPerPage, animalStorage.length);  // Um sicherzustellen, dass es nicht über die Länge hinausgeht

			// Extrahiere die Tiere, die auf die aktuelle Seite gehören
			let animalsForCurrentPage = animalStorage.slice(startIndex, endIndex);

			let mergeArray = [];

			// Gehe durch alle Tiere der aktuellen Seite und erstelle die Bild-Pfade
			for (let i = 0; i < animalsForCurrentPage.length; i++) {
				let animal = animalsForCurrentPage[i];

				// Berechnung der Position (Reihe und Spalte)
				let row = i % 10;
				let column = parseInt(i / 10);

				// Berechnung des globalen Index (absolute Zahl)
				let globalIndex = startIndex + i;

				// Bild für das Tier
				let imageToPush = await sharp(getAnimalFilepathStorage(animal.type)).resize(50).toBuffer();

				// Position für das Tierbild
				let leftPosition = 25 + row * 50;
				let topPosition = 75 + column * 75;

				// Füge das Tierbild zum Merge-Array hinzu
				mergeArray.push({ input: imageToPush, left: leftPosition, top: topPosition });


				// Text mit der Tiernummer oder ID (kann angepasst werden)
				let animalText = `${globalIndex + 1}`;  // Anzeige der globalen Nummer (1-basiert)

				// Füge den Text über dem Bild hinzu (Position justieren)
				mergeArray.push({
					input: Buffer.from(
						`<svg width="50" height="40">
							<text x="50%" y="50%" font-size="22" text-anchor="middle" fill="white" font-family="Arial" dy="5">${animalText}</text>
						</svg>`
					),
					left: leftPosition,
					top: topPosition - 30
				});

				// Wenn das Tier eine Personalisierung hat, auch das Bild der Personalisierung hinzufügen
				if (animal.customization) {
					let imageToPush2 = await sharp(getItemFilepathStorage(animal.customization)).resize(50).toBuffer();
					mergeArray.push({ input: imageToPush2, left: 25 + row * 50, top: 75 + column * 75 });
				}
			}

			// Hintergrundbild und Tiere zusammenfügen
			await sharp('plugins/waldspiel/images/backgrounds/animalStorage.png')
				.composite(mergeArray)
				.toFile('temp/finalpicture.png');

		} else {
			// Falls kein Tier vorhanden ist, nur das Hintergrundbild verwenden
			await sharp('plugins/waldspiel/images/backgrounds/animalStorage.png')
				.toFile('temp/finalpicture.png');
		}
	},


	async createMeinWaldOneAnimal(discordUserDatabase, animalId) {

		const sharp = require('sharp')

		let mergeArray = []

		if (animalExist(discordUserDatabase, animalId)) {

			let imageToPush = await sharp(await getAnimalFilepath(discordUserDatabase, animalId)).resize(150).toBuffer()
			mergeArray.push({ input: imageToPush, left: 195, top: 130 })

			if (await itemExist(discordUserDatabase, animalId)) {
				let imageToPush = await sharp(await getItemFilepath(discordUserDatabase, animalId)).resize(150).toBuffer()
				mergeArray.push({ input: imageToPush, left: 195, top: 130 })
			}
			if (await animalNameExist(discordUserDatabase, animalId)) {
				let imageToPush = await sharp('plugins/waldspiel/images/nametag.png').toBuffer()
				mergeArray.push({ input: imageToPush, left: 195, top: 270 })
				mergeArray.push({ input: getTextBuffer4(await getAnimalName(discordUserDatabase, animalId), 270, 290), left: 0, top: 0 })
			}

		}

		const imageCreator = new WaldCreator(discordUserDatabase["background"])
		imageCreator.setMergeArray(mergeArray)
		await imageCreator.createImage()
	},

	async createAnimal(animalId, dateinfo) {

		const sharp = require('sharp')

		let tag = 'DEFAULT'
		if (dateinfo.isSummer) tag = "SUMMER"
		if (dateinfo.isWinter) tag = "WINTER"
		if (dateinfo.isSpring) tag = "SPRING"
		if (dateinfo.isAutumn) tag = "AUTUMN"

		const waldcreator = new WaldCreator(tag)

		waldcreator.setMergeArray([
			{ input: await sharp('plugins/waldspiel/images/tiere/' + Animallist[animalId].filename + '.png').toBuffer(), left: 120, top: 10 }
		])
		await waldcreator.createImage()
	},

	async createSetCustomization(itemliste, offset) {

		const sharp = require('sharp')

		let mergeArray = []

		let ItemlistObj = new ItemList()
		let Itemlist = ItemlistObj.getListAll()


		if (itemliste.length != 0) {


			let emptyAnimal = await sharp('plugins/waldspiel/images/tiere/Empty.png').resize(100).toBuffer()
			mergeArray.push({ input: emptyAnimal, left: 225, top: 60 })


			if (itemliste[offset] != "ABBRECHEN") {
				let imageToPush = await sharp('plugins/waldspiel/images/items/' + Itemlist[itemliste[offset]].filename + '.png').resize(100).toBuffer()
				mergeArray.push({ input: imageToPush, left: 225, top: 60 })
			}


			await sharp('plugins/waldspiel/images/itemBackground.png')
				.composite(mergeArray)
				.toFile('temp/finalpicture.png')
		} else {
			await sharp('plugins/waldspiel/images/itemBackground.png')
				.toFile('temp/finalpicture.png')
		}

	},

	async createEditBackground(discordUserDatabase, backgroundlistdatabase, offset) {

		const sharp = require('sharp')

		let mergeArray = []

		if (backgroundlistdatabase.length != 0) {

			const Background = getBackgroundByTag(backgroundlistdatabase[offset])

			let imageToPush = await sharp('plugins/waldspiel/images/backgrounds/editBackground.png').toBuffer()
			mergeArray.push({ input: imageToPush, left: 0, top: 0 })
			mergeArray.push({ input: getTextBuffer3(Background.name, 275, 290), left: 0, top: 0 })

			if (Background.overlay) {
				let imageToPush = await sharp('plugins/waldspiel/images/backgrounds/' + Background.overlay + '.png').toBuffer()
				mergeArray.push({ input: imageToPush, left: 0, top: 0 })
			}

			if (backgroundlistdatabase[offset] == "ABBRECHEN") {

				await sharp('plugins/waldspiel/images/backgrounds/Default.png')
					.composite(mergeArray)
					.toFile('temp/finalpicture.png')
			} else {

				console.log('plugins/waldspiel/images/backgrounds/' + Background.filename + '.png')
				await sharp('plugins/waldspiel/images/backgrounds/' + Background.filename + '.png')
					.composite(mergeArray)
					.toFile('temp/finalpicture.png')
			}



			/*
			await sharp(getUserBackgroundFilepath(discordUserDatabase))
				.composite(mergeArray)
				.toFile('temp/finalpicture.png')*/
		} else {
			//sollte nicht vorkommen
			await sharp(getUserBackgroundFilepath(discordUserDatabase))
				.toFile('temp/finalpicture.png')
		}

	},

	async createItemShop(plugin, itemId1, itemId2, itemId3) {

		const sharp = require('sharp')
		const Currency = require('./lib/Currency.js');

		let mergeArray = []

		let emptyAnimal = await sharp('plugins/waldspiel/images/tiere/Empty.png').resize(150).toBuffer()

		let ItemlistObj = new ItemList()
		let Itemlist = ItemlistObj.getListAll()

		let item1 = Itemlist[itemId1];
		let einheit = item1.currency;

		let currency = await sharp('plugins/waldspiel/images/sprites/berry.png').toBuffer()
		if (einheit == Currency.EGG) {
			currency = await sharp('plugins/waldspiel/images/sprites/ostereier.png').toBuffer()
		}
		if (einheit == Currency.SWEET) {
			currency = await sharp('plugins/waldspiel/images/sprites/sweets.png').toBuffer()
		}

		let imageItem1 = await sharp('plugins/waldspiel/images/items/' + item1.filename + '.png').resize(150).toBuffer()
		mergeArray.push({ input: emptyAnimal, left: 20, top: 20 })
		mergeArray.push({ input: imageItem1, left: 20, top: 20 })
		let sharpText1 = await sharp(getTextBuffer(item1.price, 130, 210, 550, 230)).toBuffer()
		mergeArray.push({ input: sharpText1, left: 0, top: 0 })

		mergeArray.push({ input: currency, left: 20 + 120, top: 20 + 164 })

		if (itemId2) {
			let item2 = Itemlist[itemId2];
			let imageItem2 = await sharp('plugins/waldspiel/images/items/' + item2.filename + '.png').resize(150).toBuffer()
			mergeArray.push({ input: emptyAnimal, left: 200, top: 20 })
			mergeArray.push({ input: imageItem2, left: 200, top: 20 })
			let sharpText2 = await sharp(getTextBuffer(item2.price, 310, 210, 550, 230)).toBuffer()
			mergeArray.push({ input: sharpText2, left: 0, top: 0 })

			mergeArray.push({ input: currency, left: 200 + 120, top: 20 + 164 })
		}

		if (itemId3) {
			let item3 = Itemlist[itemId3];
			let imageItem3 = await sharp('plugins/waldspiel/images/items/' + item3.filename + '.png').resize(150).toBuffer()
			mergeArray.push({ input: emptyAnimal, left: 380, top: 20 })
			mergeArray.push({ input: imageItem3, left: 380, top: 20 })
			let sharpText3 = await sharp(getTextBuffer(item3.price, 490, 210, 550, 230)).toBuffer()
			mergeArray.push({ input: sharpText3, left: 0, top: 0 })

			mergeArray.push({ input: currency, left: 380 + 120, top: 20 + 164 })
		}


		await sharp('plugins/waldspiel/images/shopItems.png')
			.composite(mergeArray)
			.toFile('temp/finalpicture.png')

	},

	async showBackpack(plugin, itemArray) {

		const sharp = require('sharp')

		let mergeArray = []

		let emptyItemfield = await sharp('plugins/waldspiel/images/sprites/itempunkt.png').toBuffer()


		//gehe alle möglichen felder durch und erstelle hintergrund
		for (let x = 0; x < 3; x++) {
			for (let y = 0; y < 3; y++) {

				let posx = x * 70 + 30
				let posy = y * 80 + 30

				mergeArray.push({ input: emptyItemfield, left: posx, top: posy })

				if (itemArray.length > x + (y * 3)) {
					let item = itemArray[x + (y * 3)]


					mergeArray.push({
						input: await sharp('plugins/waldspiel/images/sprites/' + item.filename).toBuffer(),
						left: posx + 6,
						top: posy + 6
					})
					mergeArray.push({
						input: await sharp(getTextBufferMiddle(item.count, posx + 22, posy + 60, 400, 285, '16px')).toBuffer(),
						left: 0,
						top: 0
					})
				}
			}
		}

		/*
		if(berryCount){
			let imageItem1 = await sharp('plugins/waldspiel/images/items/' + Itemlist[itemId1].filename + '.png').resize(150).toBuffer()
		}

		
		
		
		mergeArray.push({ input: imageItem1, left: 20, top: 20 })


		let sharpText1 = await sharp(getTextBuffer(Itemlist[itemId1].price, 130, 210, 550, 230)).toBuffer()
		mergeArray.push({ input: sharpText1, left: 0, top: 0 })

		if(itemId2){
			let imageItem2 = await sharp('plugins/waldspiel/images/items/' + Itemlist[itemId2].filename + '.png').resize(150).toBuffer()
			mergeArray.push({ input: emptyAnimal, left: 200, top: 20 })
			mergeArray.push({ input: imageItem2, left: 200, top: 20 })
			let sharpText2 = await sharp(getTextBuffer(Itemlist[itemId2].price, 310, 210, 550, 230)).toBuffer()
			mergeArray.push({ input: sharpText2, left: 0, top: 0 })
		}

		if(itemId3){
			let imageItem3 = await sharp('plugins/waldspiel/images/items/' + Itemlist[itemId3].filename + '.png').resize(150).toBuffer()
			mergeArray.push({ input: emptyAnimal, left: 380, top: 20 })
			mergeArray.push({ input: imageItem3, left: 380, top: 20 })
			let sharpText3 = await sharp(getTextBuffer(Itemlist[itemId3].price, 490, 210, 550, 230)).toBuffer()
			mergeArray.push({ input: sharpText3, left: 0, top: 0 })
		}*/


		await sharp('plugins/waldspiel/images/backgrounds/backpack.png')
			.composite(mergeArray)
			.toFile('temp/finalpicture.png')

		return ('temp/finalpicture.png')

	},

	async createBackgroundShop(plugin, BackgroundId) {

		const sharp = require('sharp')
		const Currency = require('./lib/Currency.js');

		const Background = getBackgroundByTag(BackgroundId)
		let einheit = Background.currency;

		let currency = await sharp('plugins/waldspiel/images/sprites/berry.png').toBuffer()
		if (einheit == Currency.EGG) {
			currency = await sharp('plugins/waldspiel/images/sprites/ostereier.png').toBuffer()
		}

		let mergeArrayBackground = []

		let imageBackground = await sharp('plugins/waldspiel/images/backgrounds/' + Background.filename + '.png').resize(390).toBuffer()
		mergeArrayBackground.push({ input: imageBackground, left: 20, top: 20 })

		if (Background.overlay) {
			let imageBackground = await sharp('plugins/waldspiel/images/backgrounds/' + Background.overlay + '.png').resize(390).toBuffer()
			mergeArrayBackground.push({ input: imageBackground, left: 20, top: 20 })
		}


		let shopBackground = await sharp('plugins/waldspiel/images/shopBackground.png').toBuffer()
		mergeArrayBackground.push({ input: shopBackground, left: 0, top: 0 })

		let sharpBackground = await sharp(getTextBuffer(Background.price, 360, 272, 550, 300)).toBuffer()
		mergeArrayBackground.push({ input: sharpBackground, left: 0, top: 0 })

		//490, 210, 550, 230
		mergeArrayBackground.push({ input: currency, left: 500 - 130, top: 184 + 62 })

		await sharp('plugins/waldspiel/images/shopBackground.png')
			.composite(mergeArrayBackground)
			.toFile('temp/finalpictureBackground.png')

	}




}








function getAnimalFilepathStorage(type) {

	if (!type) {
		return 'plugins/waldspiel/images/items/Default.png' //return no item
	}

	return 'plugins/waldspiel/images/tiere/' + Animallist[type].filename + '.png'
}

function getItemFilepathStorage(customization) {

	if (!customization) {
		return 'plugins/waldspiel/images/items/Default.png' //return no item
	}
	let ItemlistObj = new ItemList()
	let Itemlist = ItemlistObj.getListAll()

	return 'plugins/waldspiel/images/items/' + Itemlist[customization].filename + '.png'
}



function getUserBackgroundFilepath(discordUserDatabase) {

	var background = discordUserDatabase["background"]
	if (!background) {
		return 'plugins/waldspiel/images/backgrounds/Default.png'
	}

	const Background = getBackgroundByTag(background)

	return 'plugins/waldspiel/images/backgrounds/' + Background.filename + '.png'
}

async function getItemFilepath(discordUserDatabase, id) {

	var animalObjId = discordUserDatabase["animalId" + id]
	let db = DatabaseManager.get()
	const collection = db.collection('animals');
	let animal = await collection.findOne({ _id: animalObjId })

	if (!animal || !animal.customization) {
		return 'plugins/waldspiel/images/items/Default.png' //return no item
	}

	let ItemlistObj = new ItemList()
	let Itemlist = ItemlistObj.getListAll()

	return 'plugins/waldspiel/images/items/' + Itemlist[animal.customization].filename + '.png'
}


async function itemExist(discordUserDatabase, id) {
	var animalObjId = discordUserDatabase["animalId" + id]
	let db = DatabaseManager.get()
	const collection = db.collection('animals');
	let animal = await collection.findOne({ _id: animalObjId })

	if (!animal || !animal.customization) return false
	return true;
}

async function getAnimalFilepath(discordUserDatabase, id) {

	var animalObjId = discordUserDatabase["animalId" + id]
	let db = DatabaseManager.get()
	const collection = db.collection('animals');
	let animal = await collection.findOne({ _id: animalObjId })


	if (!animal) {
		return 'plugins/waldspiel/images/items/Default.png' //return no item
	}

	return 'plugins/waldspiel/images/tiere/' + Animallist[animal.type].filename + '.png'
}


function animalExist(discordUserDatabase, id) {
	var animalObjId = discordUserDatabase["animalId" + id]
	if (!animalObjId) return false
	return true
}

async function getAnimalName(discordUserDatabase, id) {

	var animalObjId = discordUserDatabase["animalId" + id]
	let db = DatabaseManager.get()
	const collection = db.collection('animals');
	let animal = await collection.findOne({ _id: animalObjId })

	if (!animal || !animal.name) return false
	return animal.name;
}


async function animalNameExist(discordUserDatabase, id) {

	var animalObjId = discordUserDatabase["animalId" + id]
	let db = DatabaseManager.get()
	const collection = db.collection('animals');
	let animal = await collection.findOne({ _id: animalObjId })

	if (!animal || !animal.name) return false
	return true;
}


function getTextBuffer(text, x, y, maxWidth, maxHeight) {
	return Buffer.from(
		`<svg width="${maxWidth}" height="${maxHeight}">
			<style>
				.Rrrrr {
					font-size:24px;
					fill: #fff;
				}
				.backgroundColor {
					fill: #2f3136;
					
				}
				
			</style>
			
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="end">${text}</text>

		  </svg>`
	)
}

function getTextBufferMiddle(text, x, y, maxWidth, maxHeight, fontsize) {

	if (!fontsize) fontsize = '24px'

	return Buffer.from(
		`<svg width="${maxWidth}" height="${maxHeight}">
			<style>
				.Rrrrr {
					font-size:${fontsize};
					fill: #fff;
				}
				
			</style>
			<text class="Rrrrr" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">${text}</text>
			

		  </svg>`
	)
}

function getTextBuffer3(text, x, y) {
	return Buffer.from(
		`<svg width="550" height="300">
			<style>
				.Rrrrr {
					font-size:24px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">${text}</text>
			

		  </svg>`
	)
}

function getTextBuffer4(text, x, y) {
	return Buffer.from(
		`<svg width="550" height="300">
			<style>
				.Rrrrr {
					font-size:18px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">${text}</text>
			

		  </svg>`
	)
}

//same as getTextBuffer4 but with custom font size
function getTextBuffer5(text, x, y, fontsizeInPixel) {
	return Buffer.from(
		`<svg width="550" height="300">
			<style>
				.Rrrrr {
					font-size:${fontsizeInPixel}px;
					color: #fff;
					fill: #fff;
					clip-path: inset(-5px -5px -5px -5px round 10px);
				}
				.backgroundColor {
					fill: #444;
					background-color: #444;
				}
				
			</style>
			<text class="Rrrrr" filter="url(#solid)" x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">${text}</text>
			

		  </svg>`
	)
}


//TODO: vielleicht auslagern in BackgroundList
function getBackgroundByTag(tag) {

	const dateInfo = date();

	let backgroundlist = new Backgroundlist()
	const currentBackground = backgroundlist.getByTag(tag)


	let retunObj = {
		name: currentBackground.name,
		price: currentBackground.price,
		currency: currentBackground.currency
	}

	if (dateInfo.isNight) {
		retunObj["filename"] = currentBackground.filename.night;
		if (currentBackground.filename.nightoverlay) {
			retunObj["overlay"] = currentBackground.filename.nightoverlay;
		}

	}
	if (dateInfo.isDay) {
		retunObj["filename"] = currentBackground.filename.day;
		if (currentBackground.filename.dayoverlay) {
			retunObj["overlay"] = currentBackground.filename.nightoverlay;
		}
	}

	return retunObj

}

