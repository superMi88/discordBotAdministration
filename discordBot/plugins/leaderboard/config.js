module.exports = {
	name: "leaderboard",
	shortDescription: "leaderboard",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Rolesystem Plugin",
			fields: [
				{  //name abhängig von type
					type: "plugin", //definiert wie die felder heißen text und icon
					name: "plugin", //datenbank name
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
					type: "text", //definiert wie die felder heißen text und icon
					name: "title", //datenbank name
					required: true,
				},
				{  //name abhängig von type
					type: "currency", //definiert wie die felder heißen text und icon
					name: "currency1", //datenbank name
					required: true,
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "name1", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Server wo das Rolesystem läuft und die Erweiterung laufen soll",
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
			description: "name für commands",
			style: "column",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "name1", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 30
					//optionen für das text feld
				},
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description1", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 200
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



