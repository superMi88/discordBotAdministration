import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PluginComponent from '@/components/pluginComponent/pluginComponent';

const PluginLoader = (props) => {
    const { plugin } = props;
    const [CustomUI, setCustomUI] = useState(null);
    const [hasCustomUI, setHasCustomUI] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Attempt to load custom UI
        // We use a try-catch block around the dynamic import
        // Note: Webpack will bundle all files matching the pattern in @plugins
        const loadCustomUI = async () => {
            try {
                const module = await import(`@plugins/${plugin.pluginTag}/ui.js`);
                if (isMounted && module.default) {
                    setCustomUI(() => module.default);
                    setHasCustomUI(true);
                }
            } catch (err) {
                // Module not found or error loading, fallback to default UI
                if (isMounted) {
                    setHasCustomUI(false);
                }
            }
        };

        if (plugin && plugin.pluginTag) {
            loadCustomUI();
        }

        return () => {
            isMounted = false;
        };
    }, [plugin?.pluginTag]);

    if (hasCustomUI && CustomUI) {
        return <CustomUI {...props} />;
    }

    return <PluginComponent {...props} />;
};

export default PluginLoader;
