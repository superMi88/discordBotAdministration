module.exports = {
	name: "rolesystem",
	shortDescription: "Rolesystem",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Server wo das Rolesystem läuft",
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
			description: "voiceActivity",
			fields: [
				{  //name abhängig von type
					type: "currency", //definiert wie die felder heißen text und icon
					name: "voiceActivity", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "chatActivity",
			fields: [
				{  //name abhängig von type
					type: "currency", //definiert wie die felder heißen text und icon
					name: "chatActivity", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "alone",
			description: "role Bär",
			fields: [
				{
					type: "roles",
					name: "rolesBaer",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupBaer", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Wildschwein",
			fields: [
				{
					type: "roles",
					name: "rolesWildschwein",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupWildschwein", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Wolf",
			fields: [
				{
					type: "roles",
					name: "rolesWolf",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupWolf", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Hirsch",
			fields: [
				{
					type: "roles",
					name: "rolesHirsch",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupHirsch", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Wildkuh",
			fields: [
				{
					type: "roles",
					name: "rolesWildkuh",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupWildkuh", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Fuchs",
			fields: [
				{
					type: "roles",
					name: "rolesFuchs",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupFuchs", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Eule",
			fields: [
				{
					type: "roles",
					name: "rolesEule",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupEule", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Waschbär",
			fields: [
				{
					type: "roles",
					name: "rolesWaschbaer",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupWaschbaer", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Eichhörnchen",
			fields: [
				{
					type: "roles",
					name: "rolesEichhoernchen",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupEichhoernchen", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Frosch",
			fields: [
				{
					type: "roles",
					name: "rolesFrosch",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupFrosch", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone",
			description: "role Maus",
			fields: [
				{
					type: "roles",
					name: "rolesMaus",
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
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionRankupMaus", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 400
					//optionen für das text feld
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
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "log channel",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "logChannel", //datenbank name
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
			description: "berry",
			fields: [
				{  //name abhängig von type
					type: "currency", //definiert wie die felder heißen text und icon
					name: "berry", //datenbank name
					required: true,
				}
			]
		}
	],
	buttons: [
		{
			name: "Save",
			onClick: "save" //calls function name on click
		},
		{
			name: "assignCorrectRankRole",
			onClick: "assignCorrectRankRole" //calls function name on click
		}

		
	]
};



