
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
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
        }, 300); // Zeitfenster von 300ms nach der letzten Eingabe

        return () => clearTimeout(timeout);
    }, [value]); // Trigger, wenn der Benutzer tippt



    
    async function handleTextfield(newValue, textId, fieldnameToUpdate, name) {

        if(newValue === '' || !props.regex || (newValue).match(new RegExp(props.regex))){
            setValue(newValue);
            setIsExternallyUpdated(false); // Signalisiert, dass der Benutzer tippt

            props.editPlugin(fieldnameToUpdate, newValue, props.arrayId, props.arrayKey)
            
            props.mutatePluginsWrapper()
        }
    }

    return (
        <>
            {!props.fieldoptions.buttons ? "":
                <Flexbox>
                    {
                        props.fieldoptions.buttons.map(button => {
                            return (
                                <FlexItem>
                                    <Button text={button.name} onClick={(e) => handleTextfield(value + button.addText, props.databaseObject._id, props.databasename, props.block.name)}/>
                                </FlexItem>
                            )
                        })
                    }
                
                </Flexbox>
            }
            <div className={`${textStyles.text}`}>

                <textarea
                    className={`${utilStyles.textfield} ${textStyles.textarea}`} type="text"
                    onChange={e => handleTextfield(e.target.value, props.databaseObject._id, props.databasename, props.block.name)}
                    value={value}
                />
            </div>

        </>
    )
}
