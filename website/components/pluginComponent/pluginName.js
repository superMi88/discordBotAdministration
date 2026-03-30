import React, { useEffect, useState } from "react";

/*lib*/
import { apiFetcher } from '@/lib/apifetcher'

/*Button*/
import InputText from '@/components/button/inputText.js'
import { useRouter } from 'next/router';

export default function PluginName(props) {

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(() => {
        if (!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);

    const [pluginName, setPluginName] = useState(props.plugin.name)
    const [saveStatus, setSaveStatus] = useState("saved") // "saved", "unsaved", "saving"

    let plugin = props.plugin

    useEffect(() => {
        // Initiale Projekt-Alias Werte nicht direkt fetchen
        if (!projectAlias) return;

        // Falls wir nichts geändert haben, auch nicht speichern
        if (pluginName === props.plugin.name && saveStatus === "saved") {
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            // Check in case user reverted back to the original name manually before timeout
            if (pluginName === props.plugin.name) {
                setSaveStatus("saved")
                return;
            }
            
            setSaveStatus("saving")
            
            plugin.name = pluginName
            
            // Kompatibiltät für DB pluginId Notation und Bot runtime id
            const targetId = plugin.pluginId || plugin.id || plugin._id;
            
            try {
                let returnValue = await apiFetcher('/plugins/setPluginName', {
                    pluginId: targetId,
                    pluginName: pluginName,
                    projectAlias: projectAlias
                }).then(async (data) => {
                    return (await data.json()).response
                })

                if (props.mutatePlugin) {
                    props.mutatePlugin()
                }
                setSaveStatus("saved")
            } catch (error) {
                console.error("Fehler beim Speichern des Namens:", error);
                setSaveStatus("unsaved")
            }

        }, 5000)

        return () => clearTimeout(delayDebounceFn)
    }, [pluginName, projectAlias, props.plugin.name])

    let borderStyle = "var(--border-transparent)"; // Default ist transparent wenn gesaved
    if (saveStatus === "unsaved") borderStyle = "2px solid red";
    if (saveStatus === "saving") borderStyle = "2px solid orange";
    if (saveStatus === "saved") borderStyle = "2px solid green";

    return (
        <InputText 
            value={pluginName} 
            style={{ border: borderStyle, transition: "border 0.2s" }}
            setValue={(e) => {
                setPluginName(e)
                setSaveStatus("unsaved")
            }} 
        />
    );
}
