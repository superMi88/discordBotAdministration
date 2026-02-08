module.exports = {
	name: "voiceCreator",
	shortDescription: "Voice Creator",
	description: "Erstelle ein voice ceator",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel für voice creator",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "voiceCategory", //datenbank name
					options: { //nicht vorhanden = false
						voice: false,
						text: false,
						category: true
					},
					required: true,
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel für voice creator",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "voiceChannel", //datenbank name
					options: { //nicht vorhanden = false
						voice: true,
						text: false,
						category: false
					},
					required: true,
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
