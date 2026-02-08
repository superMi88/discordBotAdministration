module.exports = {
	name: "gifReactionInteraction",
	shortDescription: "Gif Reaction",
	description: "Slash Command Interactions",
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
			style: "column",
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
			description: "User Interation",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "userText", //datenbank name
					buttons: [
						{
							name: "User",
							addText: "<@user>"
						},
						{
							name: "Mentioned User",
							addText: "<@userMentioned>"
						}
					],
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 200
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Self Interaction",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "selfText", //datenbank name
					buttons: [
						{
							name: "User",
							addText: "<@user>"
						}
					],
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 200
					//optionen für das text feld
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Bot Interaction",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "botText", //datenbank name
					buttons: [
						{
							name: "User",
							addText: "<@user>"
						}
					],
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 200
					//optionen für das text feld
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "imageList", //datenbank name
			description: "imageList",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "image", //definiert wie die felder heißen text und icon
					name: "image", //datenbank name
					//optionen für das text feld
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "imageSelfList", //datenbank name
			description: "imageSelfList",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "image", //definiert wie die felder heißen text und icon
					name: "image", //datenbank name
					//optionen für das text feld
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "imageBotList", //datenbank name
			description: "imageBotList",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "image", //definiert wie die felder heißen text und icon
					name: "image", //datenbank name
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



