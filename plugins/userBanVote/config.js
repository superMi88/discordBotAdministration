module.exports = {
	name: "userbanvote",
	shortDescription: "Banvote",
	shortDescription: "Banvote für User",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Server wo das Plugin läuft",
			fields: [
				{  //name abhängig von type
					type: "server", //definiert wie die felder heißen text und icon
					name: "server", //datenbank name
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "name für commands",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "name1", //datenbank name
					//optionen für das text feld
				},
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description", //datenbank name
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "vorstellung",
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "roles1", //datenbank name
					//optionen für das text feld
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "text1", //datenbank name
					//optionen für das text feld
				},
				{  //name abhängig von type
					type: "currency", //definiert wie die felder heißen text und icon
					name: "vorstellungCurrency", //datenbank name
					//optionen für das text feld
				},
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "vorstellungsForum", //datenbank name
					options: { //nicht vorhanden = false
						voice: false,
						text: true,
						category: false,
						forum: false,
						stage: false,
						announcement: false
					}
					//optionen für das text feld
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
