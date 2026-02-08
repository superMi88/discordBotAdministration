
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Styles*/
import utilStyles from '@/styles/utils.module.css'
import channelStyles from '@/components/inputfields/server.module.css'

/*Server Select helper component*/
import ServerSelect from '@/components/helper/serverSelect.js'
import SearchField from '@/components/helper/searchField.js'
import BottomDiv from '@/components/helper/bottomDiv.js'
import SelectMenu from '@/components/helper/selectMenu.js'

import PopupBox from '@/components/button/popupBox.js'

/*RefBox*/
import RefBox from '@/components/inputfields/refBox.js'

/*Icons*/
import IconTextChannel from '@/components/icons/discord/text.js'


import DiscordImage from '@/components/helper/discordImage'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'

/*Button*/
import Button from '@/components/button/button.js'

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

    console.log("props")
    console.log(props)


    let activeGuildTemp = undefined
    if(!props.databaseObject){
        activeGuildTemp = props.activeGuild
    }else{
        activeGuildTemp = props.databaseObject[props.databasename]
    }

    const [activeGuild, setActiveGuild] = useState(activeGuildTemp);//guild id

    async function setGuild(guildId) {

        props.editPlugin(props.databasename, guildId, props.arrayId, props.arrayKey)

        setOpen(false)
        /*

        async function sendData() {
            await props.setGuildFunction(guildId)
        }

        if(sendDataCurrentTimeoutFunction){
            clearTimeout(sendDataCurrentTimeoutFunction)
            setSendDataCurrentTimeoutFunction(false)
        }
        setSendDataCurrentTimeoutFunction(setTimeout(sendData, 3000))
*/
        setActiveGuild(guildId)

    }


    if (!props && !props.botId) {
        return ""
    }

    const {
        data: dataChannel,
        mutate: mutateChannel,
        isValidating: isValidatingChannel,
        error: errorChannel
    } = useSWR(projectAlias ? ['/api/plugins/getGuilds', { botId: props.botId, pluginId: props.pluginId, type: props.block.type, name: props.block.name, projectAlias: projectAlias }] : null, getApiFetcher(
        (res) => {
            return res
        }
    ))
    

    if (!dataChannel) {
        return (<div>loading</div>)
    }


    function handleOpen(e) {
        if (open) {
            setOpen(false)
        } else {
            setOpen(true)
        }
    }

    let found = false

    return (
        <RefBox setOpen={setOpen}>
            <div onClick={(e) => handleOpen(e)} className={`${channelStyles.channel}`} id={"anchor-"+props.databasename+"-"+props.arrayId}>
                
                {dataChannel.guilds.map(function (guild, i) {

                    console.log(guild)
                    if (activeGuild == guild.id) {
                        found = true
                        return (
                            <div className={`${channelStyles.fieldWrapper}`}>
                                <div className={`${channelStyles.serverIcon}`}>
                                    <DiscordImage type="icon" id={guild.id} icon={guild.icon} />
                                </div>
                                {guild.guild}
                            </div>
                        )
                    }
                })}
                {found? null: 
            
                    <div className={`${channelStyles.fieldWrapper}`}>
                        <div className={`${channelStyles.serverIcon}`}>
                            <DiscordImage type="icon" />
                        </div>
                        <div
                            className={` ${utilStyles.channelName} `}
                        >     
                        Füge Server hinzu
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
                                    setGuild("")
                                }}
                            />  

                        </FlexItem>
                    </Flexbox>


                    <ServerSelect guildMap={dataChannel.guilds} setActiveGuild={setGuild} />

                    
                </SelectMenu>
            }
        </RefBox>
    )
}
