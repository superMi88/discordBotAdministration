module.exports = {
	name: "testplugin",
	shortDescription: "testplugin",
	description: "testplugin",
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
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Rolle die einem neuen User gegeben wird",
			fields: [
				{  //name abhängig von type
					type: "server", //definiert wie die felder heißen text und icon
					name: "serveralone", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "iconAndText1", //datenbank name
			description: "selfrole blöcke",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "emoji", //definiert wie die felder heißen text und icon
					name: "emoji1", //datenbank name
					required: true,
				},
				{  //name abhängig von type
					type: "server", //definiert wie die felder heißen text und icon
					name: "serverIconAndText", //datenbank name
					required: true,
				},
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
