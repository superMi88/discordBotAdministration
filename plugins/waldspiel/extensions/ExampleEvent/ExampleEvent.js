class ExampleEvent {
    // Aktuell deaktiviert (Test-Extension)
    isExtensionActive() {
        return false;
    }

    preExecute(ctx) {
        if (!this.isExtensionActive()) return;
        console.log('[Example-Extension] started');
    }
}

module.exports = ExampleEvent;
