
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
import channelStyles from '/components/inputfields/channel.module.css'

/*Server Select helper component*/
import ServerSelect from '/components/helper/serverSelect.js'
import SearchField from '/components/helper/searchField.js'
import BottomDiv from '/components/helper/bottomDiv.js'
import SelectMenu from '/components/helper/selectMenu.js'

import PopupBox from '/components/button/popupBox.js'

/*Button*/
import Button from '/components/button/button.js'

/*RefBox*/
import RefBox from '/components/inputfields/refBox.js'

/*Icons*/
import IconTextChannel from '/components/icons/discord/text.js'

/*Flexbox util*/
import Flexbox from '/components/button/flexbox'
import FlexItem from '/components/button/flexItem'


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

    if (!props && !props.botId) {
        return ""
    }

    const {
        data: dataChannel,
        mutate: mutateChannel,
        isValidating: isValidatingChannel,
        error: errorChannel
    } = useSWR(projectAlias ?['/api/plugins/getChannel', { botId: props.botId, pluginId: props.pluginId, type: props.block.type, name: props.block.name, projectAlias: projectAlias }] : null, getApiFetcher(
        (res) => {
            return res
        }
    ))

    const optionSelectVoice = props.field.options ? (props.field.options.voice ? true : false) : false
    const optionSelectText = props.field.options ? (props.field.options.text ? true : false) : false
    const optionSelectCategory = props.field.options ? (props.field.options.category ? true : false) : false
    const optionSelectForum = props.field.options ? (props.field.options.forum ? true : false) : false
    const optionSelectStage = props.field.options ? (props.field.options.stage ? true : false) : false
    const optionSelectAnnouncement = props.field.options ? (props.field.options.announcement ? true : false) : false

    async function handleChannelButton(e, channelId, textId, fieldnameToUpdate, name) {

        setOpen(false)

        props.editPlugin(fieldnameToUpdate, channelId, props.arrayId, props.arrayKey)

    }

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
                {dataChannel.data.map(function (guild, i) {
                    return (
                        <div key={i}>
                            {guild.channels.map(function (channel, i) {
                                if (props.databaseObject[props.databasename] == channel.id) {
                                    found = true
                                    return (
                                        <div key={i} className={`${channelStyles.fieldWrapper}`}>
                                            <div className={`${channelStyles.channelIcon}`}>
                                                <IconTextChannel />
                                            </div>
                                            <div
                                                className={` ${utilStyles.channelName} `}
                                            >   
                                            {channel.name}
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    )
                })}
                {found? null: 
            
                <div className={`${channelStyles.fieldWrapper}`}>
                    <div className={`${channelStyles.channelIcon}`}>
                        <IconTextChannel />
                    </div>
                    <div
                        className={` ${utilStyles.channelName} `}
                    >     
                    Füge Channel hinzu
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
                                    handleChannelButton(e, "", props.databaseObject._id, props.databasename, props.block.name)
                                }}
                            />  

                        </FlexItem>
                    </Flexbox>
                    
                    
                    

                    <ServerSelect guildMap={dataChannel.data} setActiveGuild={setActiveGuild} />

                    <BottomDiv>

                        {dataChannel.data.map(function (guild, i) {
                            if (activeGuild == guild.id) {
                                return (
                                    <div key={i} className={channelStyles.selectField}>
                                            {guild.channels.map(function (channel, i) {

                                                if (channel.name.includes(searchName)) {

                                                    //if selected == gerade durchlaufenes emoji -> dann select this
                                                    let selected = false
                                                    if (props.databaseObject[props.databasename] == channel.id) {
                                                        selected = true
                                                    }

                                                    if ((optionSelectVoice && channel.type == 2) ||  //voice
                                                        (optionSelectText && channel.type == 0) ||  //text
                                                        (optionSelectCategory && channel.type == 4) ||  //category
                                                        (optionSelectForum && channel.type == 15) ||  //forum
                                                        (optionSelectStage && channel.type == 13) ||  //stage
                                                        (optionSelectAnnouncement && channel.type == 5)  //announcement
                                                    ) {


                                                        return (
                                                            <Button key={i} text={channel.name} icon={<IconTextChannel />} color={selected ? "color" : ""} onClick={
                                                                async (e) => {
                                                                    handleChannelButton(e, channel.id, props.databaseObject._id, props.databasename, props.block.name)
                                                                }}
                                                            />
                                                        )
                                                    }
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
