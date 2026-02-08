
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

import { useRouter } from 'next/router';



export default function component(props) {

    const [sendDataCurrentTimeoutFunction, setSendDataCurrentTimeoutFunction] = useState(false);

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(()=>{
        if(!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);

    //use the unsaved version from databaseObject
    const [checked, setChecked] = useState(props.databaseObject[props.databasename]);

    async function handleToggle(e, textId, fieldnameToUpdate, name) {


        setChecked(e.target.checked)

        props.editPlugin(fieldnameToUpdate, e.target.checked, props.arrayId, props.arrayKey)

    

        
    }

    return (
        <div>
            <label className={utilStyles.switch}>
                <input type="checkbox" 
                    onChange={e => handleToggle(e, props.databaseObject._id, props.databasename, props.block.name)} 
                    checked={checked}
                />
                <span className={`${utilStyles.slider} ${utilStyles.round}`}></span>
            </label>
        </div>
    )
}
