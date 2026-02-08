module.exports = {
	name: "untimeout",
	shortDescription: "untimeout",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Server wo das System läuft",
			fields: [
				{  //name abhängig von type							
					type: "server", //definiert wie die felder heißen text und icon
					name: "server", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "untimeoutCommand",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "untimeoutCommand", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 30
					//optionen für das text feld
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



