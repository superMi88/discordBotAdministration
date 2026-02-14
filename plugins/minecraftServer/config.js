module.exports = {
	name: "minecraftServer",
	shortDescription: "Minecraft Server",
	description: "Hier kannst du deinen eigenen kleinen Mincraft server erstellen",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Minecraft Server für Commands",
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
			description: "Start File (server.jar)",
			fields: [
				{  //name abhängig von type
					type: "file", //definiert wie die felder heißen text und icon
					name: "file", //datenbank name
					required: true,
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
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 30
				},
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description1", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 200
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
					name: "name2", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 30
				},
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "description2", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					required: true,
					maxZeichen: 200
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			style: "column",
			description: "server.properties",
			fields: [
				{  //name abhängig von type
					type: "textarea", //definiert wie die felder heißen text und icon
					name: "server_properties", //datenbank name
					regex: "^[a-zA-Z0-9\\s\\<\\>\\@]+$",
					maxZeichen: 10000
				}
			]
		},

	],
	buttons: [
		{
			name: "Save",
			onClick: "save" //calls function name on click
		},
		{
			name: "Verschieben",
			onClick: "verschieben"
		}
	]
};



