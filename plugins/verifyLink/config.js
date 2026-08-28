module.exports = {
	name: "verifyLink",
	shortDescription: "Verifizierungs-Link",
	description: "Erstellt eine Nachricht mit einem Link-Button zur Verifizierungs-Webseite.",
	blocks: [
		{
			type: "alone",
			description: "Channel wo die Verifizierungs-Nachricht gesendet werden soll",
			fields: [
				{
					type: "channel",
					name: "channelVerify",
					options: {
						voice: false,
						text: true,
						category: false
					},
					required: true
				}
			]
		},
		{
			type: "alone",
			description: "Titel der Verifizierungs-Nachricht",
			fields: [
				{
					type: "text",
					name: "title",
					regex: "^.+$",
					required: true,
					maxZeichen: 100
				}
			]
		},
		{
			type: "alone",
			description: "Beschreibungstext der Verifizierungs-Nachricht",
			fields: [
				{
					type: "textarea",
					name: "description",
					required: true,
					maxZeichen: 2000
				}
			]
		},
		{
			type: "alone",
			description: "Beschriftung des Buttons",
			fields: [
				{
					type: "text",
					name: "buttonLabel",
					regex: "^.+$",
					required: true,
					maxZeichen: 50
				}
			]
		},
		{
			type: "alone",
			description: "URL zur Webseite / Verifizierung (z.B. http://localhost:3002/dashboard)",
			fields: [
				{
					type: "text",
					name: "buttonUrl",
					required: true,
					maxZeichen: 300
				}
			]
		},
		{
			type: "alone",
			description: "Optionaler Emoji auf dem Button (z.B. ✅ oder 🔗)",
			fields: [
				{
					type: "text",
					name: "buttonEmoji",
					required: false,
					maxZeichen: 10
				}
			]
		}
	],
	buttons: [
		{
			name: "Erstellen / Aktualisieren",
			onClick: "create"
		},
		{
			name: "Verifizierung alt übernehmen",
			onClick: "migrateOldVerifications"
		},
		{
			name: "Löschen",
			onClick: "delete"
		}
	]
};
