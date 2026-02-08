import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useRef, useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'



/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'

/*Styles*/
import emojiStyles from '/components/inputfields/emoji.module.css'

/*Twitter Emojis*/
import Twemoji from 'react-twemoji';

/*Server Select helper component*/
import ServerSelect from '/components/helper/serverSelect.js'
import SearchField from '/components/helper/searchField.js'
import BottomDiv from '/components/helper/bottomDiv.js'
import SelectMenu from '/components/helper/selectMenu.js'

/*RefBox*/
import RefBox from '/components/inputfields/refBox.js'

/* Icons */
import IconAddReaction from '/components/icons/addReaction.js'

/*Flexbox util*/
import Flexbox from '/components/button/flexbox'
import FlexItem from '/components/button/flexItem'

/*Button*/
import Button from '/components/button/button.js'

import { useRouter } from 'next/router';


export default function component(props) {

    const [sendDataCurrentTimeoutFunction, setSendDataCurrentTimeoutFunction] = useState(false);

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(()=>{
        if(!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);

    const [open, setOpen] = useState(false);
    const [searchName, setSearchName] = useState("");
    const [activeGuild, setActiveGuild] = useState(false);//guild id

    
    const {
        data: dataEmojis,
        mutate: mutateEmojis,
        isValidating: isValidatingEmojis,
        error: errorEmojis
    } = useSWR(projectAlias ? ['/api/plugins/botRequest', {
        botId: props.botId,
        command: "getIcons",
        pluginId: props.pluginId,
        type: props.block.type,
        name: props.block.name,
        projectAlias: projectAlias
    }] : null, getApiFetcher(
        (res) => {
            return res
        }
    ))

    async function handleEmojiButton(e, emojiId, textId, fieldnameToUpdate, name) {
        setOpen(false)

        props.editPlugin(fieldnameToUpdate, emojiId, props.arrayId, props.arrayKey)

    }

    
    if (!dataEmojis) {
        return (<div>loading</div>)
    }

    function handleOpen(e) {
        if (open) {
            setOpen(false)
        } else {
            setOpen(true)
        }
    }


    const name = require("emoji-name-map");

    let dataEmojisCopy = Array.from(dataEmojis.data)

    //push so ServerSelect add one more button for unicode Emojis
    dataEmojisCopy.push({
        emojis: [],
        guild: "unicode emojis",
        icon: null,
        id: false
    })

    return (
        <RefBox setOpen={setOpen}>
            <div onClick={(e) => handleOpen(e)} className={`${emojiStyles.emoji}`} id={"anchor-"+props.databasename+"-"+props.arrayId}>

                {showActiveEmoji(dataEmojis, props)}
                
            </div>
            {!open ? "" :
                <div>
                    <SelectMenu anchor={"anchor-"+props.databasename+"-"+props.arrayId}>

                        <Flexbox>

                            <FlexItem>
                                <SearchField handleTextfield={(e) => setSearchName(e.target.value)} />
                            </FlexItem>

                            <FlexItem>
                                <Button text={"remove"} color={"delete"} onClick={
                                    async (e) => {
                                        handleEmojiButton(e, "", props.databaseObject._id, props.databasename, props.block.name)
                                    }}
                                />  

                            </FlexItem>
                        </Flexbox>

                        
                        <ServerSelect guildMap={dataEmojisCopy} setActiveGuild={setActiveGuild} />

                        <BottomDiv>
                            {!(activeGuild == false) ? "" :
                                <div className={emojiStyles.selectField}>
                                    <div className={emojiStyles.guildName}>
                                        Standart Emojis
                                    </div>
                                    <div className={emojiStyles.emojiSelectField}>
                                        {

                                            Object.keys(name.emoji).map((oneKey, i) => {

                                                if (oneKey.includes(searchName)) {
                                                    //if selected == gerade durchlaufenes emoji -> dann select this
                                                    let selected = false
                                                    if (props.databaseObject[props.databasename] == name.emoji[oneKey]) {
                                                        selected = true
                                                    }

                                                    return (
                                                        <div
                                                            key = {i}
                                                            className={emojiStyles.emojiButton + " " + (selected ? emojiStyles.emojiSelected : "")}
                                                            onClick={(e) => handleEmojiButton(e, name.emoji[oneKey], props.databaseObject._id, props.databasename, props.block.name)}
                                                        >
                                                            <Twemoji options={{ className: 'twemoji' }}>
                                                                {name.emoji[oneKey]}
                                                            </Twemoji>
                                                            
                                                        </div>
                                                    )
                                                }
                                            })
                                        }
                                    </div>
                                </div>
                            }

                            {dataEmojis.data.map(function (guild, i) {


                                if (activeGuild == guild.id) {
                                    return (
                                        <div key={i} className={emojiStyles.selectField}>
                                            <div className={emojiStyles.guildName}>
                                                {guild.guild}
                                            </div>
                                            <div className={emojiStyles.emojiSelectField}>
                                                {guild.emojis.map(function (emoji, i) {

                                                    if (emoji.name.includes(searchName)) {
                                                        //if selected == gerade durchlaufenes emoji -> dann select this
                                                        let selected = false
                                                        if (props.databaseObject[props.databasename] == emoji.id) {
                                                            selected = true
                                                        }

                                                        return (
                                                            <div
                                                                className={emojiStyles.emojiButton + " " + (selected ? emojiStyles.emojiSelected : "")}
                                                                onClick={(e) => handleEmojiButton(e, emoji.id, props.databaseObject._id, props.databasename, props.block.name)}
                                                            >
                                                                <img className='image' src={`${"https://cdn.discordapp.com/emojis/" + emoji.id + ".webp?size=32&quality=lossless"}`} />
                                                            </div>
                                                        )
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </BottomDiv>
                    </SelectMenu>
                </div>
            }
        </RefBox>
    )
}


function showActiveEmoji(dataEmojis, props){

    const name = require("emoji-name-map");

    let found = false

    let returnValue2 = Object.keys(name.emoji).map((oneKey, i) => {

            if (props.databaseObject[props.databasename] == name.emoji[oneKey]) {
                found = true
                return (
                    <Twemoji key={i} options={{ className: 'twemoji' }}>
                        {name.emoji[oneKey]}
                    </Twemoji>
                )
            }
        })
    

    let returnValue = dataEmojis.data.map(function (guild, i) {
        

        let test = guild.emojis.map(function (emoji, i) {
            if (props.databaseObject[props.databasename] == emoji.id) {
                return true
            }
        })

        return (
            <>
                {guild.emojis.map(function (emoji, i) {
                    if (props.databaseObject[props.databasename] == emoji.id) {
                        found = true
                        return (
                            <img key={i} className='image' src={`${"https://cdn.discordapp.com/emojis/" + emoji.id + ".webp?size=32&quality=lossless"}`} />
                        )
                    }
                    //if no emoji matches it is propebly empty
                    
                })}
            </>
        )
    })

    if(!found){
        
        return (<IconAddReaction />)
    }
    

    return <>{returnValue} {returnValue2} </>
}