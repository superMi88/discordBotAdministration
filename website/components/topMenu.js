
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


import ProjectMenu from '@/components/projectMenu.js'

import BotPluginList from '@/components/BotPluginList.js'

//standart hooks for my project
import * as Hooks from "@/hooks";



//children können ausgegeben werden zb. in main <main>{children}</main>
export default function Layout({ selected }) {

    const decodedToken = Hooks.useDecodedToken();

    const router = useRouter()
    const { projectAlias } = router.query

    //const projectAlias = useSelector(state => state.project.value)

    const [openProfileMenu, setOpenProfileMenu] = useState(false);

    if (!projectAlias) {
        console.log("loadingProjectAlias")
        return "loadingProjectAlias"
    }

    return (
        <Flexbox className={styles.rightNav}>
            <FlexItem>
                <InsertLink href={"/" + projectAlias + "/user"} text="Userliste" classNameToAdd="" icon={<IconGroup />} active={selected == "userliste"} />
            </FlexItem>
            <FlexItem>
                <InsertLink href={"/" + projectAlias + "/currency"} text="currency" classNameToAdd="" icon={<IconPayments />} active={selected == "currency"} />
            </FlexItem>
            {!(decodedToken && decodedToken.admin) ? "" :
                <>
                    <FlexItem>
                        <InsertLink href={"/" + projectAlias + "/server"} text="Server" classNameToAdd="" icon={<IconServer />} active={selected == "server"} />
                    </FlexItem>
                    <FlexItem>
                        <InsertLink href={"/" + projectAlias + "/log"} text="Log" classNameToAdd="" icon={<IconError />} active={selected == "errorlog"} />
                    </FlexItem>
                </>
            }
            <FlexItem type="spaceLeft">
                {!decodedToken ? "" :

                    <div className={styles.profileInfo}>
                        <div className={styles.linkElementContainer} onClick={(e) => {
                            if (openProfileMenu) {
                                setOpenProfileMenu(false)
                            } else {
                                setOpenProfileMenu(true)
                            }
                        }}
                        >
                            <DiscordImage type="avatar" id={decodedToken.userId} avatar={decodedToken.userAvatar /*TODO:useravatar dont exist currently*/} />
                        </div>

                        {openProfileMenu ?
                            <div className={styles.profileMenu}>
                                <div>
                                    {decodedToken.username}
                                </div>

                                <div className={styles.logoutContainer}
                                    onClick={(e) => {
                                        cookie.remove("token")
                                        router.push('/')
                                    }}
                                >
                                    <div className={styles.iconWrapper}><IconLogout /></div>
                                </div>
                            </div> : ""}
                    </div>
                }
            </FlexItem>
        </Flexbox>
    )


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
}