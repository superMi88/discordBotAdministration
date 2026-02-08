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
import emojiStyles from '/components/inputfields/currency.module.css'

/*Server Select helper component*/
import ServerSelect from '/components/helper/serverSelect.js'
import SearchField from '/components/helper/searchField.js'
import BottomDiv from '/components/helper/bottomDiv.js'
import SelectMenu from '/components/helper/selectMenu.js'

/*RefBox*/
import RefBox from '/components/inputfields/refBox.js'

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
        data: dataCurrency,
        mutate: mutateCurrency,
        isValidating: isValidatingCurrency,
        error: errorCurrency
    } = useSWRImmutable(projectAlias ? ['/api/currency/getAll', { projectAlias: projectAlias}] : null, getApiFetcher())


    async function handleEmojiButton(e, currencyId, textId, fieldnameToUpdate, name) {
        setOpen(false)
        
        props.editPlugin(fieldnameToUpdate, currencyId, props.arrayId, props.arrayKey)
        
    }

    if (!dataCurrency) {
        return (<div>loading</div>)
    }

    if (!props.databaseObject) {
        console.log("props")
        console.log(props)

        return (<div>no database Obj</div>)
    }

    function handleOpen(e) {
        if (open) {
            setOpen(false)
        } else {
            setOpen(true)
        }
    }

    return (
        <RefBox setOpen={setOpen}>
            <div onClick={(e) => handleOpen(e)} className={`${emojiStyles.emoji}`} id={"anchor-"+props.databasename+"-"+props.arrayId}>
                
                            {dataCurrency.data.currencys.map(function (emoji, i) { // selbe wie unten currencys field 
                                //selbe wie unten anzeige
                                if (props.databaseObject[props.databasename] == emoji.currencyId) { // auch anders weil currencyId field statt id
                                    return (
                                        <>
                                            {emoji.currencyName} 
                                        </>
                                    )
                                }
                            })}
                        
            </div>
            {!open ? "" :
                <SelectMenu anchor={"anchor-"+props.databasename+"-"+props.arrayId}>

                <Flexbox>

                    <FlexItem>
                        <SearchField handleTextfield={(e) =>setSearchName(e.target.value)} />
                    </FlexItem>

                    <FlexItem>
                        <Button text={"remove"} color={"delete"} onClick={
                            async (e) => {
                                handleEmojiButton(e, "", props.databaseObject._id, props.databasename, props.block.name)
                            }}
                        />  

                    </FlexItem>
                </Flexbox>
                
                
                <BottomDiv>
                                <div className={emojiStyles.selectField}>
                                    
                                    <div className={emojiStyles.emojiSelectField}>
                                        
                                        {dataCurrency.data.currencys.map(function (emoji, i) { //hier anders currencys field different
                                            if (emoji.currencyName.includes(searchName)) { //hier searchvalue different
                                                //if selected == gerade durchlaufenes emoji -> dann select this

                                                

                                                let selected = false
                                                if (props.databaseObject[props.databasename] == emoji.currencyId) {
                                                    selected = true
                                                }

                                                //die anzeige different bild text größe etc
                                                return (
                                                    <div
                                                        className={emojiStyles.emojiButton + " " + (selected ? emojiStyles.emojiSelected : "")}
                                                        onClick={(e) => handleEmojiButton(e, emoji.currencyId, props.databaseObject._id, props.databasename, props.block.name)}//currencyId anders
                                                    >
                                                        {emoji.currencyName} 
                                                    </div>
                                                )
                                            }
                                        })}
                                    </div>
                                </div>
                            
                </BottomDiv>
            </SelectMenu>
            }
        </RefBox>
    )
}
