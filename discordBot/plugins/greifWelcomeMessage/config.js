module.exports = {
	name: "greifWelcomeMessage",
	shortDescription: "Greif Welcome Message",
	description: "Gibt eine Welcome Message im Channel aus",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Channel in dem die Nachricht gesendet werden soll",
			fields: [
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "welcomeChannel", //datenbank name
					options: { //nicht vorhanden = false
						voice: false,
						text: true,
						category: false
					},
					required: true,
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