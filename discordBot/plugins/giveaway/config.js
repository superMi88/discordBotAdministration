module.exports = {
	name: "giveaway",
	shortDescription: "Giveaway",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel wo der Selfrole block angezeigt werden soll",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "giveawayChannel", //datenbank name
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
			description: "Giveaway Rolle die gepingt wird",
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "pingRole", //datenbank name
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "GiveawayTitel",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "title", //datenbank name
					regex: "^[a-zA-Z0-9\\s]+$",
					required: true,
					maxZeichen: 50
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Giveaway Title AfterEnd",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "titleAfterEnd", //datenbank name
					regex: "^[a-zA-Z0-9\\s]+$",
					required: true,
					maxZeichen: 50
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Beschreibung für den das Giveaway",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 500

					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "GiveawayWinnerTitel",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "titleWinner", //datenbank name
					regex: "^[a-zA-Z0-9\\s]+$",
					required: true,
					maxZeichen: 50
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Beschreibung für den das Giveaway für den gewinner",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "descriptionWinner", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					buttons: [
						{
							name: "userWinner",
							addText: "<@userWinner>"
						}
					],
					required: true,
					maxZeichen: 500

					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Beschreibung Date",
			fields: [
				{  //name abhängig von type
					type: "date", //definiert wie die felder heißen text und icon
					name: "date", //datenbank name
					required: true,
					//optionen für das text feld
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "votingDistribution", //datenbank name
			description: "Gewichtung",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "role", //datenbank name
					required: true,
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "value", //datenbank name
					regex: "^[0-9\\s]+$",
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



