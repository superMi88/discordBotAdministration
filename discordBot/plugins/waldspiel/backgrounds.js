const Currency = require('./lib/Currency.js');

module.exports = {
	SWAMP: {
		name: "Sumpf",
		filename: {
			day: "swamp",
			night: "swamp"
		},
		price: 200,
		currency: Currency.BERRY
	},
	BEACH: {
		name: "Strand",
		filename: {
			day: "beach",
			night: "beach"
		},
		price: 200,
		currency: Currency.BERRY
	},
	NIGHT: {
		name: "Nacht von Lillienn",
		filename: {
			day: "nacht",
			night: "nacht"
		},
		price: 200,
		currency: Currency.BERRY
	},
	SUNSET: {
		name: "Sonnenuntergang von Lillienn",
		filename: {
			day: "sonnenuntergang",
			night: "sonnenuntergang"
		},
		price: 200,
		currency: Currency.BERRY
	},

	SPRING: {
		name: "Frühling",
		filename: {
			day: "normal/frühling-day",
			night: "normal/frühling-night",
			nightoverlay: "normal/overlay-night"
		},
		price: 200,
		currency: Currency.BERRY
	},
	SUMMER: {
		name: "Sommer",
		filename: {
			day: "normal/summer-day",
			night: "normal/summer-night",
			nightoverlay: "normal/overlay-night"
		},
		price: 200,
		currency: Currency.BERRY
	},
	AUTUMN: {
		name: "Herbst",
		filename: {
			day: "normal/herbst-day",
			night: "normal/herbst-night",
			nightoverlay: "normal/overlay-night"
		},
		price: 200,
		currency: Currency.BERRY
	},
	WINTER: {
		name: "Winter",
		filename: {
			day: "normal/winter-day",
			night: "normal/winter-night",
			nightoverlay: "normal/overlay-night"
		},
		price: 200,
		currency: Currency.BERRY
	}
}