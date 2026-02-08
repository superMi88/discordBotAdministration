module.exports = {
	name: "curseForgeMinecraft",
	shortDescription: "curse Forge Minecraft",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Server",
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
			description: "filetest",
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
			description: "owner ingame name",
			fields: [
				{  //name abhängig von type
					type: "text", //definiert wie die felder heißen text und icon
					name: "op", //datenbank name
					required: true,
				}
			]
		},
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "console",
			fields: [
				{  //name abhängig von type
					type: "console", //definiert wie die felder heißen text und icon
					name: "console", //datenbank name
				}
			]
		}
	],
	buttons: [
		{
			name: "Verschieben",
			onClick: "verschieben" //calls function name on click
		},
		{
			name: "startServer",
			onClick: "startServer" //calls function name on click
		},
		{
			name: "stopServer",
			onClick: "stopServer" //calls function name on click
		}
	]
};



