//const Itemlist = require("./items.js")
//const Backgroundlist = require("./backgrounds.js")
const Animallist = require("./animals.js")
const DatabaseManager = require("../../discordBot/lib/DatabaseManager.js");
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync('discordBot/fonts/Quicksand-Bold.ttf');

const { date } = require('./lib/date.js');
const WaldCreator = require("./imageCreator/WaldCreator.js");

const Backgroundlist = require('./obj/BackgroundList.js');
const ItemList = require("./obj/ItemList.js");

function getQuicksandPath(text, x, y, size, color = "white", anchor = "start") {
	const metrics = textToSVG.getMetrics(text, { fontSize: size });
	let tx = x;
	if (anchor === "middle") tx = x - metrics.width / 2;
	if (anchor === "end") tx = x - metrics.width;

	const ty = y + (metrics.ascender - metrics.descender) / 2;
	const pathData = textToSVG.getD(text, { fontSize: size });

	return `<path d="${pathData}" fill="${color}" transform="translate(${tx},${ty})" />`;
}

module.exports = {


	async createMeinWald(discordUserDatabase) {
		const sharp = require('sharp');
		const WebP = require('node-webpmux');

		let staticOverlays = [];
		const imageCreator = new WaldCreator(discordUserDatabase["background"]);
		let backgroundBuffer = await sharp('plugins/waldspiel/images/backgrounds/' + imageCreator.background.filename + '.png')
			.composite(imageCreator.background.overlay ? [{ input: await sharp('plugins/waldspiel/images/backgrounds/' + imageCreator.background.overlay + '.png').toBuffer(), left: 0, top: 0 }] : [])
			.png().toBuffer();

		for (let i = 1; i <= 3; i++) {
			if (animalExist(discordUserDatabase, i) && await animalNameExist(discordUserDatabase, i)) {
				const leftOffset = i === 1 ? 30 : i === 2 ? 195 : 360;
				const textOffset = i === 1 ? 105 : i === 2 ? 270 : 430;
				staticOverlays.push({ input: await sharp('plugins/waldspiel/images/nametag.png').toBuffer(), left: leftOffset, top: 270 });
				staticOverlays.push({ input: getTextBuffer4(await getAnimalName(discordUserDatabase, i), textOffset, 290), left: 0, top: 0 });
			}
		}

		if (staticOverlays.length > 0) {
			backgroundBuffer = await sharp(backgroundBuffer).composite(staticOverlays).png().toBuffer();
		}

		const animals = [];
		for (let i = 1; i <= 3; i++) {
			if (animalExist(discordUserDatabase, i)) {
				let animalOverlays = [];
				let staticOverlays = [];
				let itemDetails = await getItemFilepaths(discordUserDatabase, i);
				for (const item of itemDetails) {
					const decorationBuf = await sharp(item.path).resize(150).toBuffer();
					if (item.animation) {
						animalOverlays.push({ input: decorationBuf });
					} else {
						staticOverlays.push({ input: decorationBuf, left: 0, top: 0 });
					}
				}
				const baseImgPath = await getAnimalFilepath(discordUserDatabase, i);
				const animalBuf = await sharp(baseImgPath).resize(150).composite(animalOverlays).png().toBuffer();

				const left = i === 1 ? 30 : i === 2 ? 195 : 360;
				const top = i === 1 ? 135 : i === 2 ? 130 : 135;
				const animType = await getAnimalAnimation(discordUserDatabase, i);
				animals.push({ buf: animalBuf, left, top, animType, staticOverlays });
			}
		}

		if (animals.length === 0) {
			const filename = 'temp/finalpicture.png';
			await sharp(backgroundBuffer).toFile(filename);
			return filename;
		}

		const width = 550;
		const height = 300;
		const frames = 20;
		const frameBuffers = [];

		for (let i = 0; i < frames; i++) {
			let frameComposites = [];

			for (let animal of animals) {
				let sqH = 1, sqW = 1, offX = 0, rot = 0, y = animal.top;
				const progress = i / frames;

				if (animal.animType === 'ATMEN') {
					sqH = 1 - 0.03 * Math.sin(progress * Math.PI * 2);
				} else if (animal.animType === 'WACKELN') {
					offX = 3 * Math.sin(progress * Math.PI * 2);
				} else if (animal.animType === 'WOBBELN') {
					sqH = 1 - 0.03 * Math.sin(progress * Math.PI * 4);
					offX = 5 * Math.sin(progress * Math.PI * 2);
					rot = 0.05 * Math.sin(progress * Math.PI * 2);
				} else if (animal.animType === 'SPRINGEN') {
					const frameInJump = i % frames;
					const jumpProgress = frameInJump / frames;
					y -= 50 * Math.sin(Math.PI * jumpProgress);

					if (frameInJump < 6) {
						const sp = 1 - frameInJump / 6;
						sqH = 1 - 0.3 * sp;
						sqW = 1 + 0.3 * sp;
					} else if (frameInJump >= frames - 6) {
						const sp = (frameInJump - (frames - 6)) / 6;
						sqH = 1 - 0.3 * sp;
						sqW = 1 + 0.3 * sp;
					}
				}

				const newH = Math.round(150 * sqH);
				const newW = Math.round(150 * sqW);
				const rotDeg = rot * (180 / Math.PI);

				let frameAnimalBuf = await sharp(animal.buf)
					.resize(newW, newH)
					.rotate(rotDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
					.png()
					.toBuffer();

				// Sharp will output an image potentially larger due to rotation bounding box, 
				// but for small angles it's extremely close to newW/newH.
				// We center the output buffer so it revolves around the same anchor as the canvas version.
				const meta = await sharp(frameAnimalBuf).metadata();
				const finalLeft = Math.round(animal.left + 75 + offX - meta.width / 2);
				const finalTop = Math.round(y + 75 - meta.height / 2);

				frameComposites.push({ input: frameAnimalBuf, left: finalLeft, top: finalTop });

				for (const sOverlay of animal.staticOverlays) {
					frameComposites.push({ input: sOverlay.input, left: animal.left, top: animal.top });
				}
			}

			// Composite animals over background for this frame
			let frameBuffer = await sharp(backgroundBuffer)
				.composite(frameComposites)
				.webp({ quality: 90 })
				.toBuffer();

			frameBuffers.push({ buffer: frameBuffer, delay: 80 });
		}

		const framesForSave = [];
		for (const fb of frameBuffers) {
			framesForSave.push(await WebP.Image.generateFrame({ buffer: fb.buffer, delay: fb.delay }));
		}
		const outPath = 'temp/finalpicture.webp';
		await WebP.Image.save(outPath, { width, height, loops: 0, frames: framesForSave });
		return outPath;
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
		const WebP = require('node-webpmux');

		let mergeArray = []

		let animalBuf = null;
		let animType = 'WACKELN';
		let animalStaticOverlays = [];

		if (animalExist(discordUserDatabase, animalId)) {
			let animalOverlays = [];
			let staticOverlays = [];
			let itemDetails = await getItemFilepaths(discordUserDatabase, animalId);
			for (const item of itemDetails) {
				const decorationBuf = await sharp(item.path).resize(150).toBuffer();
				if (item.animation) {
					animalOverlays.push({ input: decorationBuf });
				} else {
					staticOverlays.push({ input: decorationBuf });
				}
			}
			const baseImgPath = await getAnimalFilepath(discordUserDatabase, animalId);
			animalBuf = await sharp(baseImgPath).resize(150).composite(animalOverlays).png().toBuffer();
			animType = await getAnimalAnimation(discordUserDatabase, animalId);
			animalStaticOverlays = staticOverlays; // We need to define this variable outside or use it later

			if (await animalNameExist(discordUserDatabase, animalId)) {
				let imageToPush = await sharp('plugins/waldspiel/images/nametag.png').toBuffer()
				mergeArray.push({ input: imageToPush, left: 195, top: 270 })
				mergeArray.push({ input: getTextBuffer4(await getAnimalName(discordUserDatabase, animalId), 270, 290), left: 0, top: 0 })
			}
		}

		const imageCreator = new WaldCreator(discordUserDatabase["background"]);
		let backgroundBuffer = await sharp('plugins/waldspiel/images/backgrounds/' + imageCreator.background.filename + '.png')
			.composite(imageCreator.background.overlay ? [{ input: await sharp('plugins/waldspiel/images/backgrounds/' + imageCreator.background.overlay + '.png').toBuffer(), left: 0, top: 0 }] : [])
			.png().toBuffer();

		if (mergeArray.length > 0) {
			backgroundBuffer = await sharp(backgroundBuffer).composite(mergeArray).png().toBuffer();
		}

		if (!animalBuf) {
			const filename = 'temp/finalpicture.png';
			await sharp(backgroundBuffer).toFile(filename);
			return filename;
		}

		const width = 550;
		const height = 300;
		const frames = 20;
		const frameBuffers = [];

		for (let i = 0; i < frames; i++) {
			let sqH = 1, sqW = 1, offX = 0, rot = 0, y = 130;
			const progress = i / frames;

			if (animType === 'ATMEN') {
				sqH = 1 - 0.03 * Math.sin(progress * Math.PI * 2);
			} else if (animType === 'WACKELN') {
				offX = 3 * Math.sin(progress * Math.PI * 2);
			} else if (animType === 'WOBBELN') {
				sqH = 1 - 0.03 * Math.sin(progress * Math.PI * 4);
				offX = 5 * Math.sin(progress * Math.PI * 2);
				rot = 0.05 * Math.sin(progress * Math.PI * 2);
			} else if (animType === 'SPRINGEN') {
				const frameInJump = i % frames;
				const jumpProgress = frameInJump / frames;
				y -= 50 * Math.sin(Math.PI * jumpProgress);

				if (frameInJump < 6) {
					const sp = 1 - frameInJump / 6;
					sqH = 1 - 0.3 * sp;
					sqW = 1 + 0.3 * sp;
				} else if (frameInJump >= frames - 6) {
					const sp = (frameInJump - (frames - 6)) / 6;
					sqH = 1 - 0.3 * sp;
					sqW = 1 + 0.3 * sp;
				}
			}

			const newH = Math.round(150 * sqH);
			const newW = Math.round(150 * sqW);
			const rotDeg = rot * (180 / Math.PI);

			let frameAnimalBuf = await sharp(animalBuf)
				.resize(newW, newH)
				.rotate(rotDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
				.png()
				.toBuffer();

			const meta = await sharp(frameAnimalBuf).metadata();
			const finalLeft = Math.round(195 + 75 + offX - meta.width / 2);
			const finalTop = Math.round(y + 75 - meta.height / 2);

			let composites = [{ input: frameAnimalBuf, left: finalLeft, top: finalTop }];
			for (const sOverlay of animalStaticOverlays) {
				composites.push({ input: sOverlay.input, left: 195, top: 130 });
			}

			let frameBuffer = await sharp(backgroundBuffer)
				.composite(composites)
				.webp({ quality: 90 })
				.toBuffer();

			frameBuffers.push({ buffer: frameBuffer, delay: 80 });
		}

		const framesForSave = [];
		for (const fb of frameBuffers) {
			framesForSave.push(await WebP.Image.generateFrame({ buffer: fb.buffer, delay: fb.delay }));
		}
		const outPath = 'temp/finalpicture_animal.webp';
		await WebP.Image.save(outPath, { width, height, loops: 0, frames: framesForSave });
		return outPath;
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

	async createSetCustomization(pageItems, ownedItems, startIdx, animalType) {
		const sharp = require('sharp');
		let ItemlistObj = require('./obj/ItemList.js');
		let Itemlist = new ItemlistObj().getListAll();

		if (pageItems.length === 0) {
			await sharp('plugins/waldspiel/images/backgrounds/select.png').toFile('temp/finalpicture.png');
			return 'temp/finalpicture.png';
		}

		let baseAnimalPath = 'plugins/waldspiel/images/tiere/Empty.png';
		if (animalType && Animallist[animalType]) {
			baseAnimalPath = 'plugins/waldspiel/images/tiere/' + Animallist[animalType].filename + '.png';
		}
		let animalBuf = await sharp(baseAnimalPath).resize(60).png().toBuffer();

		const width = 550;
		const height = 300;
		const columns = 5;
		const itemCount = pageItems.length;
		const rows = Math.ceil(itemCount / columns);
		const cellW = 100;
		const cellH = 80;
		const offsetX = (width - (columns * cellW)) / 2; // Center items horizontally
		const offsetY = 35; // Top offset

		let bgSvg = `<svg width="${width}" height="${height}">`;

		let frameComposites = [];

		for (let i = 0; i < itemCount; i++) {
			let r = Math.floor(i / columns);
			let c = i % columns;
			let centerX = offsetX + c * cellW + (cellW / 2);
			let centerY = offsetY + r * cellH + (cellH / 2) - 10;
			let yText = offsetY + r * cellH + cellH - 3;

			let itemKey = pageItems[i];
			let itemName = Itemlist[itemKey] ? Itemlist[itemKey].name : "Unknown";

			let isOwned = itemKey === "ABBRECHEN" || ownedItems.includes(itemKey);
			let displayName = isOwned ? `${startIdx + i + 1}. ${itemName}` : `🔒 ${startIdx + i + 1}. ${itemName}`;
			let textColor = isOwned ? "#fff" : "#aaa";

			bgSvg += `<text x="${centerX}" y="${yText}" font-family="Arial, Helvetica, sans-serif" font-size="10px" fill="${textColor}" text-anchor="middle">${displayName}</text>`;

			frameComposites.push({ input: animalBuf, left: Math.round(centerX - 30), top: Math.round(centerY - 30) });

			if (itemKey !== "ABBRECHEN" && Itemlist[itemKey]) {
				let decorationBuf = await sharp('plugins/waldspiel/images/items/' + Itemlist[itemKey].filename + '.png')
					.resize(60)
					.png()
					.toBuffer();

				frameComposites.push({ input: decorationBuf, left: Math.round(centerX - 30), top: Math.round(centerY - 30) });

				if (!isOwned) {
					let overlaySvg = `<svg width="60" height="60"><rect width="60" height="60" fill="rgba(20,20,20,0.6)" rx="8" /></svg>`;
					let overlayBuf = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
					frameComposites.push({ input: overlayBuf, left: Math.round(centerX - 30), top: Math.round(centerY - 30) });

					let lockIconBuf = await sharp('plugins/waldspiel/images/sprites/lock_icon.svg').resize(24, 24).png().toBuffer();
					frameComposites.push({ input: lockIconBuf, left: Math.round(centerX - 12), top: Math.round(centerY - 12) });
				}
			}
		}
		bgSvg += `</svg>`;

		let textOverlayBuf = await sharp(Buffer.from(bgSvg)).png().toBuffer();

		let finalBuffer = await sharp('plugins/waldspiel/images/backgrounds/select.png')
			.composite([
				{ input: textOverlayBuf, left: 0, top: 0 },
				...frameComposites
			])
			.toBuffer();

		const outPath = 'temp/finalpicture_customization.png';
		await sharp(finalBuffer).toFile(outPath);
		return outPath;
	},

	async createSetAnimation(animationliste, ownedAnimations, animalType) {
		const sharp = require('sharp');
		const WebP = require('node-webpmux');
		let AnimationListObj = require('./obj/AnimationList.js');
		let AnimationList = new AnimationListObj().getListAll();

		if (animationliste.length === 0) {
			await sharp('plugins/waldspiel/images/backgrounds/select.png').toFile('temp/finalpicture.png');
			return 'temp/finalpicture.png';
		}

		let baseAnimalPath = 'plugins/waldspiel/images/tiere/Empty.png';
		if (animalType && Animallist[animalType]) {
			baseAnimalPath = 'plugins/waldspiel/images/tiere/' + Animallist[animalType].filename + '.png';
		}
		let animalBuf = await sharp(baseAnimalPath).resize(60).png().toBuffer();

		const width = 550;
		const height = 300;
		const columns = 5;
		const itemCount = Math.min(animationliste.length, 15);
		const rows = Math.ceil(itemCount / columns);
		const cellW = 100;
		const cellH = 80;
		const offsetX = (width - (columns * cellW)) / 2;
		const offsetY = 35;

		let bgSvg = `<svg width="${width}" height="${height}">`;
		for (let i = 0; i < itemCount; i++) {
			let r = Math.floor(i / columns);
			let c = i % columns;
			let x = offsetX + c * cellW + (cellW / 2);
			let y = offsetY + r * cellH + cellH - 3;

			let animKey = animationliste[i];
			let animName = "Aus / Keine";
			if (animKey !== "ABBRECHEN" && AnimationList[animKey]) {
				animName = AnimationList[animKey].name;
			}

			let isOwned = animKey === "ABBRECHEN" || ownedAnimations.includes(animKey);
			let displayName = isOwned ? `${i + 1}. ${animName}` : `🔒 ${i + 1}. ${animName}`;
			let textColor = isOwned ? "#fff" : "#aaa";

			bgSvg += `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="10px" fill="${textColor}" text-anchor="middle">${displayName}</text>`;
		}
		bgSvg += `</svg>`;

		let textOverlayBuf = await sharp(Buffer.from(bgSvg)).png().toBuffer();
		const framesCount = 20;
		const frameBuffers = [];

		for (let f = 0; f < framesCount; f++) {
			let frameComposites = [];
			const progress = f / framesCount;

			for (let i = 0; i < itemCount; i++) {
				let r = Math.floor(i / columns);
				let c = i % columns;
				let animKey = animationliste[i];

				let sqH = 1, sqW = 1, offX = 0, rot = 0, yOffset = 0;

				if (animKey === 'ATMEN') {
					sqH = 1 - 0.03 * Math.sin(progress * Math.PI * 2);
				} else if (animKey === 'WACKELN') {
					offX = 2 * Math.sin(progress * Math.PI * 2);
				} else if (animKey === 'WOBBELN') {
					sqH = 1 - 0.03 * Math.sin(progress * Math.PI * 4);
					offX = 3 * Math.sin(progress * Math.PI * 2);
					rot = 0.05 * Math.sin(progress * Math.PI * 2);
				} else if (animKey === 'SPRINGEN') {
					const frameInJump = f % framesCount;
					const jumpProgress = frameInJump / framesCount;
					yOffset -= 30 * Math.sin(Math.PI * jumpProgress);

					if (frameInJump < 6) {
						const sp = 1 - frameInJump / 6;
						sqH = 1 - 0.3 * sp;
						sqW = 1 + 0.3 * sp;
					} else if (frameInJump >= framesCount - 6) {
						const sp = (frameInJump - (framesCount - 6)) / 6;
						sqH = 1 - 0.3 * sp;
						sqW = 1 + 0.3 * sp;
					}
				}

				const newH = Math.round(60 * sqH);
				const newW = Math.round(60 * sqW);
				const rotDeg = rot * (180 / Math.PI);

				let frameAnimalBuf = await sharp(animalBuf)
					.resize(newW, newH)
					.rotate(rotDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
					.png()
					.toBuffer();

				const meta = await sharp(frameAnimalBuf).metadata();
				let centerX = offsetX + c * cellW + (cellW / 2);
				let centerY = offsetY + r * cellH + (cellH / 2) - 10;
				const finalLeft = Math.round(centerX + offX - meta.width / 2);
				const finalTop = Math.round(centerY + yOffset - meta.height / 2);

				frameComposites.push({ input: frameAnimalBuf, left: finalLeft, top: finalTop });

				let isOwned = animKey === "ABBRECHEN" || ownedAnimations.includes(animKey);
				if (!isOwned) {
					let overlaySvg = `<svg width="60" height="60"><rect width="60" height="60" fill="rgba(20,20,20,0.6)" rx="8" /></svg>`;
					let overlayBuf = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
					frameComposites.push({ input: overlayBuf, left: Math.round(finalLeft + meta.width / 2 - 30), top: Math.round(finalTop + meta.height / 2 - 30) });

					let lockIconBuf = await sharp('plugins/waldspiel/images/sprites/lock_icon.svg').resize(24, 24).png().toBuffer();
					frameComposites.push({ input: lockIconBuf, left: Math.round(finalLeft + meta.width / 2 - 12), top: Math.round(finalTop + meta.height / 2 - 12) });
				}
			}

			let frameBuffer = await sharp('plugins/waldspiel/images/backgrounds/select.png')
				.composite([
					{ input: textOverlayBuf, left: 0, top: 0 },
					...frameComposites
				])
				.webp({ quality: 80 })
				.toBuffer();
			frameBuffers.push({ buffer: frameBuffer, delay: 80 });
		}

		const framesForSave = [];
		for (const fb of frameBuffers) {
			framesForSave.push(await WebP.Image.generateFrame({ buffer: fb.buffer, delay: fb.delay }));
		}
		const outPath = 'temp/finalpicture_animations.webp';
		await WebP.Image.save(outPath, { width, height, loops: 0, frames: framesForSave });
		return outPath;
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

	},

	async createBerryCollectImage(member, collectedBerrys, roleBonus, boosterBonus, totalCollected, roleName) {
		const sharp = require('sharp');
		const width = 550;
		const height = 80;

		let mergeArray = [];

		// User Name
		const displayName = member.displayName || (member.user ? member.user.username : 'Spieler');
		const nameText = displayName.length > 14 ? displayName.substring(0, 12) + "..." : displayName;
		mergeArray.push({
			input: Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
				${getQuicksandPath(nameText + " hat Beeren geerntet!", 30, 16, 20, "white")}
			</svg>`),
			left: 0, top: -1
		});

		let statsY = 32;
		let statsX = 30;

		// 1. Basis
		mergeArray.push({
			input: Buffer.from(`<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
				${getQuicksandPath("Basis", 0, 8, 12, "#efebe9")}
				${getQuicksandPath("+" + collectedBerrys, 0, 24, 18, "#ffecb3")}
			</svg>`),
			left: statsX, top: statsY
		});
		statsX += 80;

		// 2. Rang (if exists)
		if (roleBonus > 0) {
			mergeArray.push({
				input: Buffer.from(`<svg width="130" height="40" xmlns="http://www.w3.org/2000/svg">
					${getQuicksandPath("Rang Bonus", 0, 8, 12, "#efebe9")}
					${getQuicksandPath("+" + roleBonus, 0, 24, 18, "#ccff90")}
				</svg>`),
				left: statsX, top: statsY
			});
			statsX += 110;
		}

		// 3. Booster (if exists)
		if (boosterBonus > 0) {
			mergeArray.push({
				input: Buffer.from(`<svg width="130" height="40" xmlns="http://www.w3.org/2000/svg">
					${getQuicksandPath("Booster Bonus", 0, 8, 12, "#efebe9")}
					${getQuicksandPath("+" + boosterBonus, 0, 24, 18, "#ffd180")}
				</svg>`),
				left: statsX, top: statsY
			});
			statsX += 110;
		}

		// 4. Gesamt
		mergeArray.push({
			input: Buffer.from(`<svg width="150" height="80" xmlns="http://www.w3.org/2000/svg">
				${getQuicksandPath("Gesamt", 0, 10, 16, "white")}
				${getQuicksandPath(String(totalCollected), 0, 35, 45, "white")}
			</svg>`),
			left: width - 155, top: 4
		});

		const outPath = 'temp/berry_collect.png';
		await sharp('plugins/waldspiel/images/backgrounds/collect_berry.png')
			.resize(550, 80)
			.composite(mergeArray)
			.png()
			.toFile(outPath);

		return outPath;
	},

	async createCatchAnimalImage(member, animalId) {
		const sharp = require('sharp');
		const animal = Animallist[animalId];

		const width = 550;
		const height = 80;

		let mergeArray = [];

		// User Name + Catch Message
		const displayName = member.displayName || (member.user ? member.user.username : 'Spieler');
		const nameText = displayName.length > 14 ? displayName.substring(0, 12) + "..." : displayName;

		mergeArray.push({
			input: Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
				${getQuicksandPath(nameText + " hat ein Tier gefangen!", 30, 16, 20, "white")}
				${getQuicksandPath(animal.name || "Unbekanntes Tier", 30, 46, 32, "#74cc5e")}
			</svg>`),
			left: 0, top: -1
		});

		// Animal Image (Large and cut off on the right)
		const animalImg = await sharp('plugins/waldspiel/images/tiere/' + animal.filename + '.png')
			.resize(160, 160)
			.extract({ left: 0, top: 45, width: 116, height: 80 })
			.toBuffer();

		mergeArray.push({ input: animalImg, left: width - 116, top: 0 });

		const outPath = 'temp/animal_catch.png';
		await sharp('plugins/waldspiel/images/backgrounds/collect_animal.png')
			.resize(width, height)
			.composite(mergeArray)
			.png()
			.toFile(outPath);

		return outPath;
	},




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

async function getItemFilepaths(discordUserDatabase, id) {

	var animalObjId = discordUserDatabase["animalId" + id]
	let db = DatabaseManager.get()
	const collection = db.collection('animals');
	let animal = await collection.findOne({ _id: animalObjId })

	if (!animal) {
		return [];
	}

	let ItemlistObj = new ItemList()
	let Itemlist = ItemlistObj.getListAll()
	let items = [];
	let activeItems = new Set();

	// Support slot 1 (with legacy fallback), 2, and 3
	let s1 = animal.customization1 || animal.customization;
	if (s1 && Itemlist[s1]) activeItems.add(s1);
	if (animal.customization2 && Itemlist[animal.customization2]) activeItems.add(animal.customization2);
	if (animal.customization3 && Itemlist[animal.customization3]) activeItems.add(animal.customization3);

	for (const itemId of activeItems) {
		items.push({
			path: 'plugins/waldspiel/images/items/' + Itemlist[itemId].filename + '.png',
			animation: Itemlist[itemId].animation !== false
		});
	}

	return items;
}


async function itemExist(discordUserDatabase, id) {
	let paths = await getItemFilepaths(discordUserDatabase, id);
	return paths.length > 0;
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

async function getAnimalAnimation(discordUserDatabase, id) {
	var animalObjId = discordUserDatabase["animalId" + id]
	let db = DatabaseManager.get()
	const collection = db.collection('animals');
	let animal = await collection.findOne({ _id: animalObjId })

	if (!animal || !animal.animation || animal.animation === "0") return "WACKELN" // default
	return animal.animation;
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

