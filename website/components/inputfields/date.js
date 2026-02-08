
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
import textStyles from '/components/inputfields/text.module.css'

/*Button*/
import Button from '/components/button/button.js'

/*Flexbox util*/
import Flexbox from '/components/button/flexbox';
import FlexItem from '/components/button/flexItem';

import { useRouter } from 'next/router';


//type={props.block.type} name={props.block.name}


export default function component(props) {

    const [sendDataCurrentTimeoutFunction, setSendDataCurrentTimeoutFunction] = useState(false);

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(()=>{
        if(!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);

    //use the unsaved version from databaseObject
    const [value, setValue] = useState(props.databaseObject[props.databasename]) //wenn nicht gesetzt dann auf 0 setzen

    

    async function handleTextfield(newValue, textId, fieldnameToUpdate, name) {

        setValue(newValue);

        props.editPlugin(fieldnameToUpdate, newValue, props.arrayId, props.arrayKey)

       

    }

    return (
        <>
            <div className={`${textStyles.text}`}>
                <input 
                className={utilStyles.textfield} type="datetime-local"
                onChange={e => handleTextfield(e.target.value, props.databaseObject._id, props.databasename, props.block.name)}
                value={value}
                />
            </div>
        </>
    )
}
