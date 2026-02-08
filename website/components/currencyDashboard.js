
import Layout, { siteTitle } from '/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'

/*Icons*/
import IconPlus from '/components/icons/plus.js'
import IconMinus from '/components/icons/minus.js'
/*Button*/
import Button from '/components/button/button.js'


/*Button*/
import InputText from '/components/button/inputText.js'

/*Flexbox util*/
import Flexbox from '/components/button/flexbox'
import FlexItem from '/components/button/flexItem'


/*Styles*/
import currencyStyles from '/styles/currency.module.css'
import utilStyles from '/styles/utils.module.css'
import styles from './layout.module.css'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'
import { useRouter } from 'next/router';


import DiscordImage from '/components/helper/discordImage'


export default function bot() {


    const router = useRouter()
    const { projectAlias } = router.query

    //const projectAlias = useSelector(state => state.project.value)

    const [currencyName, setcurrencyName] = useState("");

    const {
        data: dataCurrency,
        mutate: mutateCurrency,
        isValidating: isValidating,
        error: error
    } = useSWRImmutable(projectAlias ? ['/api/currency/getCurrency', { projectAlias: projectAlias }] : null, getApiFetcher())

    if (!dataCurrency) {
        return "loading bots"
    }
    //(e) =>setSearchName(e.target.value)
    //const [searchName, setSearchName] = useState("");
    return (
        <>
            <div className="content">
                <div className={utilStyles.contentBox}>
                    Currency
                </div>
            </div>

            <div className='content'>
                <Flexbox>
                    <FlexItem type="max">
                        <InputText value={currencyName} setValue={setcurrencyName} />
                    </FlexItem>
                    <FlexItem>

                        <Button text={"+"} color={"color"} onClick={
                            async () => {
                                await apiFetcher('/currency/create', {
                                    currencyName: currencyName,
                                    projectAlias: projectAlias
                                })
                                setcurrencyName("")
                                mutateCurrency()
                            }
                        }
                        />
                    </FlexItem>
                </Flexbox>


                <div className={currencyStyles.botListe}>
                    {dataCurrency.data.map(function (currency, i) {

                        return (
                            <Flexbox>
                                <FlexItem>
                                    {currency.currencyName}
                                </FlexItem>

                                <FlexItem>
                                    {!currency.events ? "" :
                                        <>
                                            Events:
                                            {currency.events.map(function (eventPlugin, i) {

                                                let botId = eventPlugin.botId
                                                let pluginTag = eventPlugin.pluginTag
                                                let pluginId = eventPlugin.pluginId
                                                let avatar = eventPlugin.avatar
                                                let botname = eventPlugin.botname

                                                console.log(eventPlugin)

                                                return <div className={currencyStyles.eventbox}>
                                                    <Link key={i} href={`/admin/${projectAlias}/bot/${botId}`} >
                                                        <Flexbox>
                                                            <FlexItem>
                                                                <div className={styles.linkElementContainer}>
                                                            
                                                                    <DiscordImage type="avatar" id={botId} avatar={avatar} />
                                                                
                                                                </div>
                                                            </FlexItem>
                                                            <FlexItem>
                                                                {botname}
                                                            </FlexItem>
                                                        </Flexbox>
                                                    </Link>

                                                    <Link key={i} href={`/admin/${projectAlias}/bot/${botId}/${pluginTag}#${pluginId}`} >
                                                        <Flexbox>
                                                            <FlexItem>
                                                                {pluginTag}
                                                            </FlexItem>
                                                            <FlexItem>
                                                                pluginName
                                                            </FlexItem>
                                                        </Flexbox>
                                                    </Link>

                                                    



                                                    
                                                    {eventPlugin.message}
                                                    </div>
                                                
                                            })}
                                        </>
                                    }
                                </FlexItem>

                                <FlexItem type="spaceLeft">

                                    <Button text={"delete"} color={"delete"} onClick={
                                        async () => {
                                            await apiFetcher('/currency/delete', {
                                                currencyId: currency.currencyId,
                                                projectAlias: projectAlias
                                            })
                                            mutateCurrency()
                                        }
                                    }
                                    />
                                </FlexItem>
                            </Flexbox>
                        )
                    })}

                </div>
            </div>
        </>
    )
}
