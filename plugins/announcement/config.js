module.exports = {
	name: "announcement",
	shortDescription: "Announcement",
	blocks: [
		{
			type: "iconAndText",
			name: "announcementRoles",
			description: "Rollen die gepingt werden sollen",
			fields: [
				{
					type: "roles",
					name: "roleId",
					required: true,
				}
			]
		},
		{
			type: "alone",
			description: "Channel wo das Announcement gesendet werden soll",
			fields: [
				{
					type: "channel",
					name: "channel1", 
					options: { 
						voice: false,
						text: true,
						announcement: true,
						category: false
					},
					required: true
				}
			]
		},
		{
			type: "alone",
			description: "Titel für das Announcement",
			fields: [
				{
					type: "text", 
					name: "title", 
					required: true,
					maxZeichen: 50
				}
			]
		},
		{
			type: "alone",
			description: "Beschreibung für das Embed",
			fields: [
				{
					type: "textarea", 
					name: "description", 
					required: true,
					maxZeichen: 1500
				}
			]
		},
		{
			type: "alone",
			description: "Anhang (optionale Nachricht)",
			fields: [
				{
					type: "textarea", 
					name: "followupMessage", 
					maxZeichen: 1500
				}
			]
		}
	],
	buttons: [
		{
			name: "Create",
			onClick: "create"
		},
		{
			name: "Update",
			onClick: "update"
		},
		{
			name: "Delete",
			onClick: "delete"
		}
	]
};




