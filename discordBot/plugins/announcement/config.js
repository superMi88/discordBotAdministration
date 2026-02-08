module.exports = {
	name: "announcement",
	shortDescription: "Announcement",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel wo der Selfrole block angezeigt werden soll",
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "announcementRole", //datenbank name
					//optionen für das text feld
				}
			]
		},
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
						announcement: true,
						category: false
					},
					required: true
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Titel für den Selfrole Block",
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
			description: "Beschreibung für den das Embed",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description", //datenbank name
					regex: "^[a-zA-Z0-9\\s]+$",
					required: true,
					maxZeichen: 1500

					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Anhang",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "followupMessage", //datenbank name
					regex: "^[a-zA-Z0-9\\s]+$",
					maxZeichen: 1500

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
			name: "Update",
			onClick: "update" //calls function name on click
		},
		{
			name: "Delete",
			onClick: "delete" //calls function name on click
		}
	]
};



