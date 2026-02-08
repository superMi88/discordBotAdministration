const { AttachmentBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class ValentinesEvent {
    preExecute(client, plugin) {
        console.log('[ValentinesEvent] Extension started');
    }

    // Aktiv nur am Valentinstag (14. Februar)
    isExtensionActive() {
        const now = new Date();
        const m = now.getMonth() + 1; // 1-12
        const d = now.getDate();
        return m === 2 && d === 14;
    }

    async getShop(client, plugin, shopChannel, createItemShop, createBackgroundShop) {
        if (!this.isExtensionActive()) return;

        try {
            console.log("[ValentinesEvent] Creating shop...");
            await shopChannel.send({ content: "💖 **Valentinstag Shop** 💖" });
            await createItemShop(require('./items.js'));
            await createBackgroundShop(require('./backgrounds.js'));
        } catch (e) {
            console.error("[ValentinesEvent] Error creating shop:", e);
        }
    }

    getItems() {
        return require('./items.js');
    }

    getBackgrounds() {
        return require('./backgrounds.js');
    }
}

module.exports = ValentinesEvent;
