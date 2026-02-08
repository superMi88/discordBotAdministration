module.exports = {
	name: "boosterRole",
	shortDescription: "boosterRole",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Channel wo man ein Ticket erstellen kann",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "channelMessage", //datenbank name
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
			description: "unter welcher Rolle die Channels erzeugt werden",
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "roleAbove", //datenbank name
					options: { //nicht vorhanden = false
						voice: false,
						text: true,
						category: false
					},
					required: true
					//optionen für das text feld
				}
			]
		}
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



