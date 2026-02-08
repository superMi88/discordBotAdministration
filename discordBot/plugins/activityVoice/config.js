module.exports = {
	name: "activityVoice",
	shortDescription: "Activity Voice",
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
		}
	],
	buttons: [
		{
			name: "Save",
			onClick: "save" //calls function name on click
		}
	]
};



