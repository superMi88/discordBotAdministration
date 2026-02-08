module.exports = {
	name: "welcomeMessage",
	shortDescription: "Welcome Message",
	description: "Gibt eine Welcome Message im Channel aus",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Channel in dem die Nachricht gesendet werden soll",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "welcomeChannel", //datenbank name
					options: { //nicht vorhanden = false
						voice: false,
						text: true,
						category: false
					},
					required: true,
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Nachricht die ausgegeben werden soll wenn ein neuer User auf den Server joint",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "welcomeText1", //datenbank name
					//optionen für das text feld
					buttons: [
						{
							name: "newUser",
							addText: "<@newUser>"
						}
					],
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 50
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "coordinateX1", //datenbank name
					regex: "^[0-9\\s]+$",
					required: true,
					maxZeichen: 4
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "coordinateY1", //datenbank name
					regex: "^[0-9\\s]+$",
					required: true,
					maxZeichen: 4
				},
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Nachricht die ausgegeben werden soll wenn ein neuer User auf den Server joint",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "welcomeText2", //datenbank name
					//optionen für das text feld
					buttons: [
						{
							name: "newUser",
							addText: "<@newUser>"
						}
					],
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 50
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "coordinateX2", //datenbank name
					regex: "^[0-9\\s]+$",
					required: true,
					maxZeichen: 4
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "coordinateY2", //datenbank name
					regex: "^[0-9\\s]+$",
					required: true,
					maxZeichen: 4
				},
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Bild für Join Message",
			fields: [
				{  //name abhängig von type
					type: "image", //definiert wie die felder heißen text und icon
					name: "backgroundImage", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 50
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "coordinateX3", //datenbank name
					regex: "^[0-9\\s]+$",
					required: true,
					maxZeichen: 4
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "coordinateY3", //datenbank name
					regex: "^[0-9\\s]+$",
					required: true,
					maxZeichen: 4
				},
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "buttonLinks", //datenbank name
			description: "Button Links",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "buttonName", //datenbank name
					required: true,
				},
				{  //name abhängig von type
					type: "emoji", //definiert wie die felder heißen text und icon
					name: "buttonEmoji", //datenbank name
					required: true,
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "link", //datenbank name
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
