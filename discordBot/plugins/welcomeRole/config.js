module.exports = {
	name: "welcomeRole",
	shortDescription: "welcomeRole",
	description: "Gibt eine Welcome Message im Channel aus",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Rolle die einem neuen User gegeben wird",
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "welcomeRole", //datenbank name
					required: true,
				}
			]
		}
	],
	buttons: [
		{
			name: "Save",
			onClick: "save" //calls function name on click
		}
	]
};