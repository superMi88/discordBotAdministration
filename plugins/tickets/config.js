module.exports = {
	name: "tickets",
	shortDescription: "Tickets",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Channel wo man ein Ticket erstellen kann",
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
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "moderatorRole", //datenbank name
			description: "Moderator Rolle",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "roleId", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Text der beim erstellen des Tickets steht",
			style: "column",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 300
				}
			]
		},
	],
	buttons: [
		{
			name: "Speichern und Erstellen",
			onClick: "create" //calls function name on click
		},
		{
			name: "Speichern",
			onClick: "save" //calls function name on click
		},
		{
			name: "Delete",
			onClick: "delete" //calls function name on click
		}
	]
};



