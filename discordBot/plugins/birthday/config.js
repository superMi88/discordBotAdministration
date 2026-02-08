module.exports = {
	name: "birthday",
	shortDescription: "Birthday",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Channel wo man den Geburtstag festlegen kann",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "channelTicket", //datenbank name
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
			description: "birthdayRole",
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "birthdayRole", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "server",
			fields: [
				{  //name abhängig von type
					type: "server", //definiert wie die felder heißen text und icon
					name: "server", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "ageRoleArray", //datenbank name
			description: "selfrole blöcke",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "ageRole", //datenbank name
					required: true,
					maxZeichen: 30

					//optionen für das text feld
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "numberString", //datenbank name
					required: true,
					maxZeichen: 100,
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Beschreibung für das Geburtstagsfeld",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					maxZeichen: 500

					//optionen für das text feld
				}
			]
		},
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



