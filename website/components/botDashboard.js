
import Layout, { siteTitle } from '/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import BotMenu from '/components/helper/botMenu';

import cookie from 'js-cookie'

import Link from 'next/link'

/*Styles*/
import utilStyles from '/styles/utils.module.css'

/*Icons*/
import IconPlus from '/components/icons/plus.js'
import IconMinus from '/components/icons/minus.js'
/*Button*/
import Button from '/components/button/button.js'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'

import { useRouter } from 'next/router';


export default function bot({ botexist, botId }) {

    const router = useRouter()
    const {projectAlias} = router.query

    //const projectAlias = useSelector(state => state.project.value)

    cookie.set(projectAlias+"-selectedBotId", botId)

    //Alle Plugins die Activ ausgewählt sind
    const {
        data: dataPlugins,
        mutate: mutate,
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
            {!botexist ?
                <div className="content">
                    Bot mit der id exestiert nicht
                </div>
                :

                <>
                    <div className="content">
                        <BotMenu botId={botId} />
                    </div>

                    <div>
                        <div className="content">
                            <div className={utilStyles.guildName}>Plugins</div>
                        </div>

                        {
                            !dataPlugins || !dataAllPlugins || !projectAlias ? <div>loading...</div> :

                                <div className="content">

                                    <div className={utilStyles.botPluginBoxContainer}>
                                        {dataAllPlugins.response.map(function (plugin, i) {

                                            var count = 0

                                            dataPlugins.data.plugins.map(function (pluginBlock, i) {
                                                if (plugin.name == pluginBlock.pluginTag) {
                                                    count++
                                                }
                                            })

                                            /*
                                                                  const getElement = () => {
                                                                    for (let i = 0; i < dataAllPlugins.response.length; i++) {
                                                                      const element = dataAllPlugins.response[i];
                                                                      if (element.name == plugin.pluginTag) {
                                                                        return (element)
                                                                      }
                                                                    }
                                                                  }
                                                                  const activePlugin = getElement()*/
                                            { console.log("----------plugin") }
                                            { console.log(plugin) }
                                            return (
                                                <div className={utilStyles.botPluginBox} key={"pluginLink-" + plugin.name}>
                                                    <Link key={i} href={`/admin/${projectAlias}/bot/${botId}/${plugin.name}`} >

                                                        <div className={utilStyles.botPluginBoxInnerContainer}>

                                                            {plugin.banner ? <img className={utilStyles.botPluginBoxImage + ' image'} src={`${"https://storage.googleapis.com/ttezlowaplugins/" + plugin.name + ".png"}`} /> : ""}

                                                            <div className={utilStyles.pluginShortDescription}>{plugin.shortDescription}</div>
                                                            <div className={utilStyles.pluginCount}>{count}</div>
                                                        </div>

                                                    </Link>
                                                </div>
                                            )


                                        })}
                                    </div>
                                </div>
                        }
                    </div>
                </>
            }
        </>
    )
}




