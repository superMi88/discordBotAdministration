module.exports = {
	name: "activitySearcher",
		shortDescription: "Activity Searcher",
		blocks: [
			{
				type: "alone", //definiert wie die felder heißen text und icon
				description: "channel wo der Selfrole block angezeigt werden soll",
				fields: [
					{  //name abhängig von type
						type: "channel", //definiert wie die felder heißen text und icon
						name: "channel1", //datenbank name
						options: { //nicht vorhanden = false
							voice: false,
							text: true,
							category: false
						}
						//optionen für das text feld
					}
				]
			},
			{
				type: "alone", //definiert wie die felder heißen text und icon
				description: "image was angezeigt werden soll",
				fields: [
					{  //name abhängig von type
						type: "image", //definiert wie die felder heißen text und icon
						name: "image1", //datenbank name
					}
				]
			},
			{
				type: "alone", //definiert wie die felder heißen text und icon
				description: "title",
				fields: [
					{  //name abhängig von type
						type: "text", //definiert wie die felder heißen text und icon
						name: "title", //datenbank name
					}
				]
			},
			{
				type: "alone", //definiert wie die felder heißen text und icon
				description: "description",
				fields: [
					{  //name abhängig von type
						type: "text", //definiert wie die felder heißen text und icon
						name: "description", //datenbank name
					}
				]
			}
		],
		buttons: [
			{
				name: "Create",
				onClick: "create" //calls function name on click
			},
			/*
			{
				name: "Update",
				onClick: "update" //calls function name on click
			},*/
			{
				name: "Delete",
				onClick: "delete" //calls function name on click
			}
		]
};



