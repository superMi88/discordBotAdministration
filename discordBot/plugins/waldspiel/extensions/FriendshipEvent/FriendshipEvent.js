const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, SelectMenuBuilder, ButtonStyle, Events } = require('discord.js');
const CustomId = require('../../../../lib/CustomId.js');

class FriendshipEvent {
    // Aktuell deaktiviert (Test-Extension)
    isExtensionActive() {
        return false; // Active only when manually enabled/test
    }

    preExecute(client, plugin) {
        if (!this.isExtensionActive()) return;
        console.log('[FriendshipEvent-Extension] started');

        plugin.on(client, Events.InteractionCreate, async interaction => {
            if (!this.isExtensionActive()) return;
            let customId = new CustomId(interaction)

            if (isButton(interaction, 'freundschaftsevent')) {

            }
        })

    }

    /*
    getButtonsForMeinwald(){
        return new ButtonBuilder()
            .setCustomId('freundschaftsevent')
            .setLabel('❤️Freundschaftsevent')
            .setStyle(ButtonStyle.Primary)
    }*/
}


function isButton(interaction, buttonId) {
    if (interaction.customId && (interaction.customId == buttonId || interaction.customId.includes(buttonId + "-"))) {
        return true
    }
    return false
}

module.exports = FriendshipEvent;