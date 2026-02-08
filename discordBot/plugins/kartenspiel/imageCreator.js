module.exports = {


	async createSammelheft(discordUserDatabase, type, page) {

		const sharp = require('sharp')

		console.log(discordUserDatabase)

		let cardObj = require("./cards-"+type+".js");

		let mergeArray = []

		let i = 0
		let cardkey1 = null
		let cardkey2 = null
		let cardkey3 = null
		let cardkey4 = null
		Object.keys(cardObj).forEach(function(key) {
			console.log(key)
			console.log(i)
			if(i == page*4){
				cardkey1 = key
			}
			if(i == page*4+1){
				cardkey2 = key
			}
			if(i == page*4+2){
				cardkey3 = key
			}
			if(i == page*4+3){
				cardkey4 = key
			}
			i++;
		});

		console.log(cardkey2)

		if(cardkey1){
			let imageToPush = await sharp("plugins/kartenspiel/images/cards/"+cardObj[cardkey1].filename).resize(80).toBuffer()
			mergeArray.push({ input: imageToPush, left: 20, top: 20 })
			
			if(!discordUserDatabase["cardlist-"+type] || !discordUserDatabase["cardlist-"+type].includes(cardkey1)){
				let imageToPush = await sharp("plugins/kartenspiel/images/cards/cardOverlay.png").resize(80).toBuffer()
				mergeArray.push({ input: imageToPush, left: 20, top: 20 })
			}
		}
		if(cardkey2){
			let imageToPush = await sharp("plugins/kartenspiel/images/cards/"+cardObj[cardkey2].filename).resize(80).toBuffer()
			mergeArray.push({ input: imageToPush, left: 120, top: 20 })
			if(!discordUserDatabase["cardlist-"+type] || !discordUserDatabase["cardlist-"+type].includes(cardkey2)){
				let imageToPush = await sharp("plugins/kartenspiel/images/cards/cardOverlay.png").resize(80).toBuffer()
				mergeArray.push({ input: imageToPush, left: 120, top: 20 })
			}
		}
		if(cardkey3){
			let imageToPush = await sharp("plugins/kartenspiel/images/cards/"+cardObj[cardkey3].filename).resize(80).toBuffer()
			mergeArray.push({ input: imageToPush, left: 20, top: 160 })
			if(!discordUserDatabase["cardlist-"+type] || !discordUserDatabase["cardlist-"+type].includes(cardkey3)){
				let imageToPush = await sharp("plugins/kartenspiel/images/cards/cardOverlay.png").resize(80).toBuffer()
				mergeArray.push({ input: imageToPush, left: 20, top: 160 })
			}
		}
		if(cardkey4){
			let imageToPush = await sharp("plugins/kartenspiel/images/cards/"+cardObj[cardkey4].filename).resize(80).toBuffer()
			mergeArray.push({ input: imageToPush, left: 120, top: 160 })
			if(!discordUserDatabase["cardlist-"+type] || !discordUserDatabase["cardlist-"+type].includes(cardkey4)){
				let imageToPush = await sharp("plugins/kartenspiel/images/cards/cardOverlay.png").resize(80).toBuffer()
				mergeArray.push({ input: imageToPush, left: 120, top: 160 })
			}
		}
		

		console.log(mergeArray)

		await sharp('plugins/kartenspiel/images/backgrounds/sammelheft.png')
				.composite(mergeArray)
				.toFile('temp/finalpicture.png')


	},

	async createShop(objCard1, objCard2, objCard3) {

		const sharp = require('sharp')


		let mergeArray = []

		

		let cardObj = require("./cards-"+objCard1.type+".js");

		console.log(cardObj)
		console.log(cardObj[objCard1.cardKey])
		console.log(cardObj)

		let imageToPush1 = await sharp("plugins/kartenspiel/images/cards/"+cardObj[objCard1.cardKey].filename).resize(150).toBuffer()
		mergeArray.push({ input: imageToPush1, left: 30, top: 135 })

		let cardObj2 = require("./cards-"+objCard2.type+".js");
		let imageToPush2 = await sharp("plugins/kartenspiel/images/cards/"+cardObj2[objCard2.cardKey].filename).resize(150).toBuffer()
		mergeArray.push({ input: imageToPush2, left: 30+30, top: 135 })

		let cardObj3 = require("./cards-"+objCard3.type+".js");
		let imageToPush3 = await sharp("plugins/kartenspiel/images/cards/"+cardObj3[objCard3.cardKey].filename).resize(150).toBuffer()
		mergeArray.push({ input: imageToPush3, left: 30+60, top: 135 })
		

		await sharp('plugins/kartenspiel/images/backgrounds/shop.png')
				.composite(mergeArray)
				.toFile('temp/finalpicture.png')


	},

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

	if(!fontsize) fontsize = '24px'

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
