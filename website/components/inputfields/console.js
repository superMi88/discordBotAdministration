
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState, useRef } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'

/*Styles*/
import utilStyles from '/styles/utils.module.css'
import textStyles from '/components/inputfields/textarea.module.css'

/*Button*/
import Button from '/components/button/button.js'

/*Flexbox util*/
import Flexbox from '/components/button/flexbox';
import FlexItem from '/components/button/flexItem';

import { useRouter } from 'next/router';


//type={props.block.type} name={props.block.name}


import { UIDConsumer } from 'react-uid'


export default function component(props) {

    const [sendDataCurrentTimeoutFunction, setSendDataCurrentTimeoutFunction] = useState(false);

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(()=>{
        if(!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);
    

    //use the unsaved version from databaseObject

    let tempValue = props.databaseObject[props.databasename]
    const [value, setValue] = useState(tempValue? tempValue : "") //wenn nicht gesetzt dann auf 0 setzen


    const [isExternallyUpdated, setIsExternallyUpdated] = useState(true); // Flag für externe Updates
    
    // Effekt: Synchronisierung mit externen Änderungen, nur wenn der Wert nicht gerade lokal geändert wird
    useEffect(() => {
        const currentValue = props.databaseObject[props.databasename] || "";

        if (isExternallyUpdated) {
            setValue(currentValue); // Überschreibt nur, wenn extern aktualisiert
        }
    }, [props.databaseObject, isExternallyUpdated]);


    // Effekt: Nach einer kurzen Verzögerung wieder erlauben, dass Props den Wert setzen
    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsExternallyUpdated(true); // Externe Änderungen wieder erlauben
        }, 10); // Zeitfenster von 300ms nach der letzten Eingabe

        return () => clearTimeout(timeout);
    }, [value]); // Trigger, wenn der Benutzer tippt


    const {
        data: dataConsole,
        mutate: mutateConsole,
        isValidating: isValidatingConsole,
        error: errorConsole
    } = useSWR(projectAlias ? ['/api/plugins/botRequest', {
        botId: props.botId,
        command: "getConsole",
        pluginId: props.pluginId,
        onClick: props.databasename,
        pluginTag: props.pluginTag,
        type: props.block.type,
        name: props.block.name,
        projectAlias: projectAlias
    }] : null, getApiFetcher(
        (res) => {
            return res
        }
    ), {refreshInterval: 100} )

    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [dataConsole?.response]);

    return (
        <>
            <div className={`${textStyles.text}`}>
                <textarea
                    ref={textareaRef}
                    className={`${utilStyles.textfield} ${textStyles.textarea}`}
                    value={dataConsole?.response ?? "loading"}
                    readOnly
                />
            </div>
        </>
    )
}
