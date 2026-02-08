
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'

import useSWRImmutable from 'swr/immutable'
import cookie from 'js-cookie'
import DiscordImage from '@/components/helper/discordImage'

/*Icons*/
import IconPlugin from '@/components/icons/plugin.js'
import IconMinus from '@/components/icons/minus.js'

/*Icons*/
import IconAccountCircle from '@/components/icons/accountCircle.js'
import IconWork from '@/components/icons/work.js'
import IconGroup from '@/components/icons/group.js'
import IconHome from '@/components/icons/home.js'
import IconLogout from '@/components/icons/logout.js'
import IconList from '@/components/icons/list.js'
import IconError from '@/components/icons/error.js'
import IconPayments from '@/components/icons/payments.js'
import IconServer from '@/components/icons/server.js'

/*Styles*/
import styles from './layout.module.css'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

import { useRouter } from 'next/router';

export default function bot(props) {

    let selected = props.selected

    const router = useRouter()
    const { projectAlias } = router.query

    //const projectAlias = useSelector(state => state.project.value)
    const botId = cookie.get(projectAlias + "-selectedBotId")

    const {
        data: dataBot,
        mutate: mutateBot,
        isValidating: isValidatingBot,
        error: errorBot
    } = useSWRImmutable(projectAlias ? ['/api/bot/getInfo', { botId: botId, projectAlias: projectAlias }] : null, getApiFetcher())

    //Alle Plugins die Activ ausgewählt sind
    const {
        data: dataPlugins,
        mutate: mutatePlugins,
        isValidating: isValidating,
        error: error
    } = useSWR(projectAlias ? ['/api/plugins/getAll', { botId: botId, projectAlias: projectAlias }] : null, getApiFetcher())

    //Alle Plugins die es gibt
    const {
        data: dataAllPlugins,
        mutate: mutateAllPlugins,
        isValidating: isValidatingAllPlugins,
        error: errorAllPlugins
    } = useSWR(projectAlias ? ['/api/plugins/botRequest', {
        botId: botId,
        command: "getPlugins",
        projectAlias: projectAlias
    }] : null, getApiFetcher())


    return (
        <>
            <div className={`${styles.navItemWrapper}`}>
                <div className={`${styles.navItemInnerWrapper}`} >

                    <div className={`${styles.closebutton} ${styles.showOnSmallSize}`}>
                        <i id="closeMenuButton" className="closeIcon button material-icons md-24 md-light" onClick={(e) => setShowMenu(false)}>close</i>
                    </div>

                    {!dataBot ? "Loading Bot Data" :
                        <>

                            <InsertLink href={"/admin/" + projectAlias + `/bot/${dataBot.id}`} text="Bot" classNameToAdd="" element={

                                <div className={styles.linkElementContainer}>
                                    <DiscordImage type="avatar" id={dataBot.id} avatar={dataBot.avatar} />

                                </div>

                            } active={selected == `bot-${dataBot.id}`} />
                        </>
                    }

                    {
                        !dataPlugins || !dataAllPlugins || !dataAllPlugins.response ? <div>loading Plugins...</div> :

                            dataPlugins.data.plugins.length !== 0 ?
                                <>
                                    {dataAllPlugins.response.map(function (plugin, i) {

                                        //if (plugin.pluginTag != pluginTag) return ""

                                        var count = 0

                                        dataPlugins.data.plugins.map(function (pluginBlock, i) {
                                            if (plugin.name == pluginBlock.pluginTag) {
                                                count++
                                            }
                                        })

                                        //wenn es kein Plugin für den Plugin type gibt dann soll er nicht angezeigt werden im layout
                                        if (count == 0) return ""

                                        return (
                                            <InsertLink
                                                key={i}
                                                href={"/admin/" + projectAlias + `/bot/${botId}/${plugin.name}`}
                                                text={plugin.shortDescription}
                                                classNameToAdd="" icon={<IconPlugin />}
                                                active={selected == `bot-${botId}-${plugin.name}`}
                                                pluginCount={count}
                                            />
                                        )
                                    })}
                                </>
                                :
                                <div> keine Plugins </div>
                    }

                </div>
            </div>
        </>
    )

}

function InsertLink({ href, text, classNameToAdd, icon, active, element, pluginCount }) {

    let className = styles.link + " " + classNameToAdd

    if (active) {
        className = className + " " + styles.menuButtonActive
    }

    return (
        <div className={className}>
            <Link href={href}>
                <div className={styles.linkContainer}>
                    <Flexbox>
                        {!element ? "" :
                            <FlexItem>
                                {element}
                            </FlexItem>
                        }
                        {!icon ? "" :
                            <FlexItem>
                                <div className={styles.iconWrapper}>{icon}</div>
                            </FlexItem>
                        }
                        <FlexItem type="max">
                            <div>{text}</div>
                        </FlexItem>
                        {!pluginCount ? "" :
                            <FlexItem>
                                <div className={styles.pluginCount}>{pluginCount}</div>
                            </FlexItem>
                        }
                    </Flexbox>
                </div>
            </Link>
        </div>
    )
}