const Currency = require('../../lib/Currency.js');

module.exports = {
	CHRISTMAS_SNOW: {
		name: "Schneelandschaft",
		filename: {
			day: "../../extensions/ChristmasEvent/images/schnee",
			night: "../../extensions/ChristmasEvent/images/schnee"
		},
		price: 80,
		currency: Currency.BERRY
	},
	CHRISTMAS_TREE: {
		name: "Weihnachtsbaum",
		filename: {
			day: "../../extensions/ChristmasEvent/images/weihnachten",
			night: "../../extensions/ChristmasEvent/images/weihnachten"
		},
		price: 80,
		currency: Currency.BERRY
	},
}