module.exports = {
	name: "standardRole",
	shortDescription: "Standart Rolle",
	description: "zum zuweisen einer Standartrolle",
	blocks: [
		{
			type: "alone", //definiert wie die felder heißen text und icon
			description: "Server wo das Karmasystem läuft",
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
			description: "Rolle Die benötigt wird um die Standartroles zu bekommen",
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "requiredRole", //datenbank name
					//optionen für das text feld
				}
			]
		},
		{
			type: "iconAndText", //definiert wie die felder heißen text und icon
			name: "standardRoleArray", //datenbank name
			description: "selfrole blöcke",
			//max: 1, //wie viele maximal
			fields: [
				{  //name abhängig von type
					type: "roles", //definiert wie die felder heißen text und icon
					name: "standardRole", //datenbank name
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