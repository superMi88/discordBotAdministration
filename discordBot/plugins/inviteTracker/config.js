module.exports = {
	name: "inviteTracker",
	shortDescription: "Invite-Tracker",
	description: "inviteTracker",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "channel für voice creator",
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
		}
	],
	buttons: [
		{
			name: "Save",
			onClick: "save" //calls function name on click
		}
	]
};



