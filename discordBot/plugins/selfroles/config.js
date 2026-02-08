module.exports = {
	name: "selfroles",
	shortDescription: "Selfroles",
	description: "Mit Selfroles können User eines Discord Servers ganz einfach Rollen auswählen die sie haben möchten, dafür wird eine Nachricht in einem Channel erstellt und jede reaktion ist eine Rolle zugewiesen",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel wo der Selfrole block angezeigt werden soll",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "channel1", //datenbank name
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
			description: "selfrole blöcke",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "emoji", //definiert wie die felder heißen text und icon
					name: "emoji1", //datenbank name
					required: true,
				},
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "roles1", //datenbank name
					required: true,
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
			name: "Update",
			onClick: "update" //calls function name on click
		},
		{
			name: "Delete",
			onClick: "delete" //calls function name on click
		}
	]
};



