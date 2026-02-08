module.exports = {
	name: "dailyQuestion",
	shortDescription: "dailyQuestion",
	description: "dailyQuestion",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel wo der Selfrole block angezeigt werden soll",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "channelAddQuestion", //datenbank name
					options: { //nicht vorhanden = false
						voice: false,
						text: true,
						category: false
					},
					required: true,
					//optionen für das text feld
				},
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "channelQuestion", //datenbank name
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
			description: "Titel und Beschreibung des Selfrole Blocks",
			style: "column",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "title", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 50
				},
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 300
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "iconAndText1", //datenbank name
			description: "Fragenliste",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "question", //datenbank name
					required: true,
				}
			]
		}
	],
	buttons: [
		{
			name: "Erstelle+Speichern",
			onClick: "create" //calls function name on click
		},
		{
			name: "Speichern",
			onClick: "save" //calls function name on click
		},
		{
			name: "Löschen",
			onClick: "delete" //calls function name on click
		}
	]
};



