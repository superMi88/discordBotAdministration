const Currency = require('../../lib/Currency.js');

module.exports = {
	//ABBRECHEN : { filename: "Abbrechen"},
	BOO: { name: "Boo", filename: "../../extensions/HalloweenEvent/images/boo", price: 5, currency: Currency.SWEET, animation: true },
	GHOST: { name: "Geist", filename: "../../extensions/HalloweenEvent/images/ghost", price: 5, currency: Currency.SWEET, animation: true },
	KESSEL: { name: "Kessel", filename: "../../extensions/HalloweenEvent/images/kessel", price: 5, currency: Currency.SWEET, animation: false },
	KNIFE: { name: "Messer", filename: "../../extensions/HalloweenEvent/images/knife", price: 5, currency: Currency.SWEET, animation: true },
	PUMPKIN: { name: "Kürbiss", filename: "../../extensions/HalloweenEvent/images/pumpkin", price: 5, currency: Currency.SWEET, animation: false },
	SWEETS: { name: "Süßigkeiten", filename: "../../extensions/HalloweenEvent/images/sweets", price: 5, currency: Currency.SWEET, animation: false },
	WITCHHUT: { name: "Hexenhut", filename: "../../extensions/HalloweenEvent/images/witchhut", price: 5, currency: Currency.SWEET, animation: true }
}
