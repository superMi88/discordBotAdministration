
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

import verifyManager from '@/lib/verifyManager.js'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Styles*/
import utilStyles from '@/styles/utils.module.css'
import rolesStyles from '@/components/inputfields/roles.module.css'

/*Server Select helper component*/
import ServerSelect from '@/components/helper/serverSelect.js'
import SearchField from '@/components/helper/searchField.js'
import BottomDiv from '@/components/helper/bottomDiv.js'
import SelectMenu from '@/components/helper/selectMenu.js'

import RefBox from '@/components/inputfields/refBox.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'

/*Button*/
import Button from '@/components/button/button.js'

/*Icons*/
import IconShield from '@/components/icons/shield.js'

import { useRouter } from 'next/router';



export default function component(props) {

    const [sendDataCurrentTimeoutFunction, setSendDataCurrentTimeoutFunction] = useState(false);

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(()=>{
        if(!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);

    //if select field is open or not
    const [open, setOpen] = useState(false);
    const [searchName, setSearchName] = useState("");
    const [activeGuild, setActiveGuild] = useState(false);//guild id

    console.log("reset roles")
    console.log(activeGuild)


    const shouldFetchRoles = projectAlias !== false; // Check, ob projectAlias gesetzt ist

    const {
        data: dataRoles,
        mutate: mutateRoles,
        isValidating: isValidatingRoles,
        error: errorRoles
    } = useSWR(
        shouldFetchRoles 
            ? ['/api/plugins/getRoles', { 
                botId: props.botId, 
                pluginId: props.pluginId, 
                type: props.block.type, 
                name: props.block.name, 
                projectAlias: projectAlias 
            }] 
            : null, // Null, wenn die Abfrage pausiert werden soll
        getApiFetcher((res) => res)
    )

    async function handleRolesButton(e, rolesId, textId, fieldnameToUpdate, name) {

        setOpen(false)

        props.editPlugin(fieldnameToUpdate, rolesId, props.arrayId, props.arrayKey)
    
    }

    if (verifyManager.notValid(dataRoles)) {
        console.log("is not valid")
        return (<div>loading</div>)
    }

    function handleOpen(e) {
        if(open){
            setOpen(false)
        }else{
            setOpen(true)
        }
    }

    let found = false
    return (
        <RefBox setOpen={setOpen}>
            <div onClick={(e) => handleOpen(e)} className={`${rolesStyles.roles}`} id={"anchor-"+props.databasename+"-"+props.arrayId}>
                
                {dataRoles.data.map(function (guild, i) {
                    
                return (
                    <div key={i}>
                        {guild.roles.map(function (roles, i) {

                            if (props.databaseObject[props.databasename] == roles.id) {
                                found = true
                                return (
                                    <div key={i} className={`${rolesStyles.fieldWrapper}`}>
                                    <div className={rolesStyles.roleIcon}>
                                        <IconShield color={roles.color? roles.color.toString(16) : "fff"}/>
                                    </div>
                                
                                    <div
                                        className={` ${utilStyles.channelName} `}
                                        onClick={(e) => handleRolesButton(e, roles.id, props.databaseObject._id, props.databasename, props.block.name)}
                                    >
                                        
                                    {roles.name}
                                    
                                    
                                    </div>
                                    </div>
                                )
                            }
                        })}
                        
                        </div>
                )
            })}
            {found? null: 
            
                <div className={`${rolesStyles.fieldWrapper}`}>
                    <div className={rolesStyles.roleIcon}>
                        <IconShield color={"fff"}/>
                    </div>
                    <div
                        className={` ${utilStyles.channelName} `}
                    >     
                    Füge Rolle hinzu
                    </div>
                </div>
        
            }
            </div>
        {!open ? "" :
        <SelectMenu anchor={"anchor-"+props.databasename+"-"+props.arrayId}>
        
            <Flexbox>

                <FlexItem>
                    <SearchField handleTextfield={(e) => setSearchName(e.target.value)} />
                </FlexItem>

                <FlexItem>
                    <Button text={"remove"} color={"delete"} onClick={
                        async (e) => {
                            handleRolesButton(e, "", props.databaseObject._id, props.databasename, props.block.name)
                        }}
                    />  

                </FlexItem>
            </Flexbox>

            <ServerSelect guildMap={dataRoles.data} setActiveGuild={setActiveGuild} />

            <BottomDiv>
                {dataRoles.data.map(function (guild, i) {
                    if (activeGuild == guild.id) {
                        return (
                            <div key={i}>
                                {guild.guild}
                                
                                {guild.roles.map(function (roles, i) {
                                    if (roles.name.includes(searchName)) {

                                        //if selected == gerade durchlaufenes role -> dann select this
                                        let selected = false
                                        if (props.databaseObject[props.databasename] == roles.id) {
                                            selected = true
                                        }

                                        return (
                                            <div
                                                key={i}
                                                className={utilStyles.channelName + " " + (selected ? rolesStyles.selected : "")}
                                                onClick={(e) => handleRolesButton(e, roles.id, props.databaseObject._id, props.databasename, props.block.name)}
                                            >
                                            {roles.name}
                                            </div>
                                        )
                                    }
                                })}
                            </div>
                        )
                    }
                })}
            </BottomDiv>
        </SelectMenu>
        }
        </RefBox>
    )
}
