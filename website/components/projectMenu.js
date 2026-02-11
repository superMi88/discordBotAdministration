import Head from 'next/head'
import Image from 'next/image'
import styles from './layout.module.css'
import Link from 'next/link'

import LayoutBlank from '@/components/layoutBlank'

const name = 'Your Name'
export const siteTitle = 'Lowas Website'

/*lib*/
import { apiFetcher, getApiFetcher } from '../lib/apifetcher'

import DiscordImage from '@/components/helper/discordImage'

import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'

import cookie from 'js-cookie'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from "react";

import Router from 'next/router'

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

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'


//standart hooks for my project
import * as Hooks from "@/hooks";


//children können ausgegeben werden zb. in main <main>{children}</main>
export default function Layout(req) {

    let selected = req.selected

    const router = useRouter()
    const { projectAlias } = router.query

    //const count = useSelector(state => state.counter.value)
    //const projectAlias = useSelector(state => state.project.value)
    //const dispatch = useDispatch()

    //let dataAccount = req.dataAccount

    const decodedToken = Hooks.useDecodedToken();

    const [openProjectMenu, setOpenProjectMenu] = useState(false);

    const botId = cookie.get(projectAlias + "-selectedBotId")

    const {
        data: dataBot,
        mutate: mutateBot,
        isValidating: isValidatingBot,
        error: errorBot
    } = useSWRImmutable(projectAlias ? ['/api/bot/getInfo', { botId: botId, projectAlias: projectAlias }] : null, getApiFetcher())


    const openMenu = (e) => {
        if (openProjectMenu) {
            setOpenProjectMenu(false)
        } else {
            setOpenProjectMenu(true)
        }
    }

    const handleClick = (e, projectName) => {
        //window.location.assign("/admin/" + projectName + "/bot")

        Router.push({
            pathname: "/" + projectName + "/bot",
            //query: { sortBy: 'price' }
        },
            undefined, { shallow: true }
        )

        //dispatch(setProject(projectName))

        setOpenProjectMenu(false)

    }

    return (
        <div className={styles.selectWrapper}>
            <div onClick={(e) => openMenu(e)} className={styles.activeProjectAlias}> {projectAlias}</div>
            {openProjectMenu ?
                <div className={styles.projectMenuOpen}>
                    <div >
                        {decodedToken.projects.map(function (projectName, i) {
                            if (projectName == projectAlias) {
                                return <div className={styles.selectedProjectName} onClick={(e) => handleClick(e, projectName)}>{projectName}</div>
                            }
                            return <div onClick={(e) => handleClick(e, projectName)}>{projectName}</div>
                        })}
                    </div>
                </div>
                : ""}

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