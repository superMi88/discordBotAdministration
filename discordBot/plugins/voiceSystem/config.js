module.exports = {
	name: "voiceSystem",
	shortDescription: "Voice System",
	description: "voiceSystem",
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
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "optionsVoiceChannel", //datenbank name
			description: "optionsVoiceChannel",
			//max: 1, //wie viele maximal
			fields: [
				/*
				{  //name abhängig von type
					type: "channel", //definiert wie die felder heißen text und icon
					name: "voiceChannel", //datenbank name
					options: { //nicht vorhanden = false
						voice: true,
						text: false,
						category: false
					},
				},*/
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "channelName", //datenbank name
					//regex: "^[a-zA-Z0-9\\s]+$",
					required: true,
					maxZeichen: 60
				},
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "memberlimit", //datenbank name
					regex: "^[0-9]+$",
					required: true,
					maxZeichen: 2
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