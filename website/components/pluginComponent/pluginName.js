
import React, { useEffect, useState } from "react";

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Button*/
import InputText from '@/components/button/inputText.js'
import { useRouter } from 'next/router';

export default function component(props) {

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(() => {
        if (!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);

    const [pluginName, setPluginName] = useState(props.plugin.name) //wenn nicht gesetzt dann auf 0 setzen

    let botId = props.botId
    let plugin = props.plugin

    if (props.pluginName) {
        return <div>load component</div>
    }

    return (
        <InputText value={pluginName} setValue={async (e) => {

            setPluginName(e)
            plugin.name = e

            let returnValue = await apiFetcher('/plugins/setPluginName', {
                pluginId: props.plugin.id,
                pluginName: e,
                projectAlias: projectAlias
            }).then(async (data) => {
                return (await data.json()).response
            })

            props.mutatePlugin()
        }
        } />
    );
}

