module.exports = {
	name: "threadCreator",
	shortDescription: "Thread Creator",
	description: "Erstelle ein Thread Creator",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel für voice creator",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "threadCreatorChannel", //datenbank name
					options: { //nicht vorhanden = false
						voice: false,
						text: true
					},
					required: true,
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "thread name bei bild",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "threadName", //datenbank name
					buttons: [
						{
							name: "User",
							addText: "<@user>"
						}
					],
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 30
					//optionen für das text feld
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "iconAndText1", //datenbank name
			description: "reaction Emojis",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "emoji", //definiert wie die felder heißen text und icon
					name: "emoji1", //datenbank name
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