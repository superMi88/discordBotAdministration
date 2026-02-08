module.exports = {
	name: "rules",
	shortDescription: "Rules",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel wo der Selfrole block angezeigt werden soll",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "channelRules", //datenbank name
					options: { //nicht vorhanden = false
						voice: false,
						text: true,
						category: false
					},
					required: true
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			name: "image", //datenbank name
			description: "image",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "image", //definiert wie die felder heißen text und icon
					name: "image", //datenbank name
					//optionen für das text feld
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
					type: "text", //definiert wie die felder heißen text und icon
					name: "headline", //datenbank name
					regex: "^[a-zA-Z0-9\\s]+$",
					required: true,
					maxZeichen: 30

					//optionen für das text feld
				},
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "text", //datenbank name
					required: true,
					maxZeichen: 1000,
					//optionen für das text feld
				}
			]
		}
	],
	buttons: [
		{
			name: "Create",
			onClick: "create" //calls function name on click
		},
		{
			name: "Delete",
			onClick: "delete" //calls function name on click
		}
	]
};



