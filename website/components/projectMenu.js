import styles from './layout.module.css'
import Link from 'next/link'

/*lib*/
import { getApiFetcher } from '../lib/apifetcher'

import DiscordImage from '@/components/helper/discordImage'
import useSWRImmutable from 'swr/immutable'
import cookie from 'js-cookie'
import { useRouter } from 'next/router'
import React from "react";

/*Icons*/
import IconList from '@/components/icons/list.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'

export default function Layout(req) {

    let selected = req.selected

    const router = useRouter()
    const { projectAlias } = router.query

    const botId = cookie.get(projectAlias + "-selectedBotId")

    const {
        data: dataBot,
        //mutate: mutateBot,
        //isValidating: isValidatingBot,
        //error: errorBot
    } = useSWRImmutable(projectAlias ? ['/api/bot/getInfo', { botId: botId, projectAlias: projectAlias }] : null, getApiFetcher())

    return (
        <div className={styles.selectWrapper}>
            <div className={styles.activeProjectAlias}> {projectAlias}</div>

            <InsertLink href={"/" + projectAlias + "/bot"} text="Botliste" classNameToAdd="" icon={<IconList />} active={selected == "bot"} />

            {!dataBot ? "Loading Bot Data" :
                <>
                    <InsertLink href={"/" + projectAlias + `/bot/${dataBot.id}`} text="Bot" classNameToAdd="" element={
                        <div className={styles.linkElementContainer}>
                            <DiscordImage type="avatar" id={dataBot.id} avatar={dataBot.avatar} />
                        </div>
                    } active={selected == `bot-${dataBot.id}`} />
                </>
            }
        </div>
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