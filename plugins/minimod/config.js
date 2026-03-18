module.exports = {
	name: "minimod",
	shortDescription: "Minimod Befehle",
	description: "Erlaubt es bestimmten Rollen (Mini-Mods), User unter bestimmten Bedingungen zu bannen oder zu muten.",
	blocks: [
		{
			type: "alone",
			description: "Server für das Plugin",
			fields: [
				{
					type: "server",
					name: "server",
					required: true,
				}
			]
		},
		{
			type: "alone",
			description: "Log Channel",
			fields: [
				{
					type: "channel",
					name: "logChannel",
					options: {
						voice: false,
						text: true,
						category: false
					},
					required: true,
				}
			]
		},
		{
			type: "alone",
			description: "Welche Rolle die Minimod Rechte haben soll",
			fields: [
				{
					type: "roles",
					name: "minimodRole",
					required: true,
				}
			]
		},
		{
			type: "alone",
			description: "Befehle für Ban und Mute",
			style: "column",
			fields: [
				{
					type: "text",
					name: "banCommand",
					regex: "^[a-zA-Z0-9]+$",
					required: true,
					maxZeichen: 20
				},
				{
					type: "text",
					name: "muteCommand",
					regex: "^[a-zA-Z0-9]+$",
					required: true,
					maxZeichen: 20
				}
			]
		},
		{
			type: "alone",
			description: "Wie viele Tage ein User maximal auf dem Server sein darf, um noch gebannt werden zu dürfen (z.B. 3)",
			fields: [
				{
					type: "text",
					name: "maxDays",
					regex: "^[0-9]+$",
					required: true,
					maxZeichen: 3
				}
			]
		},
		{
			type: "iconAndText",
			name: "banRolesBlock",
			description: "Welche Rollen dürfen vom Minimod gebannt (und dann automatisch auch gemutet) werden?",
			fields: [
				{
					type: "roles",
					name: "roleId",
					required: true,
				}
			]
		},
		{
			type: "iconAndText",
			name: "muteRolesBlock",
			description: "Welche WEITEREN Rollen dürfen vom Minimod gemutet werden?",
			fields: [
				{
					type: "roles",
					name: "roleId",
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
