
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'

/*Styles*/
import utilStyles from '@/styles/utils.module.css'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

import { useRouter } from 'next/router'

export default function bot(props) {

    const router = useRouter()
    const { projectAlias } = router.query

    //const projectAlias = useSelector(state => state.project.value)

    const {
        data: data,
        mutate: mutate,
        isValidating: isValidating,
        error: error
    } = useSWR(projectAlias ? ['/api/bot/getAll', { projectAlias: projectAlias }] : null, getApiFetcher())

    if (!data) {
        return "loading"
    }

    return (
        <div className={utilStyles.botListe}>
            {data.map(function (object, i) {

                //show all if admin else only show id owner of bot
                //if(dataAccount.admin != true /*&& object.ownerId != dataAccount.userinfo.id*/) return ""

                let url = "/" + projectAlias + "/bot/" + object.id

                return (
                    <Link key={i} href={url} className={utilStyles.abox}>
                        <div className={utilStyles.botListeBlock}>
                            <div className={utilStyles.botbild}>
                                {object.avatar != null ?
                                    <Image
                                        alt="Profile Picture"
                                        src={`https://cdn.discordapp.com/avatars/${object.id}/${object.avatar}.webp`}
                                        width="100"
                                        height="100"
                                    /> :
                                    <Image
                                        alt="Profile Picture"
                                        src={`/fragezeichen.png`}
                                        width="100"
                                        height="100"
                                    />
                                }
                            </div>
                            <div className={utilStyles.botname}>

                                {object.username}#{object.discriminator}
                            </div>

                        </div>
                    </Link>
                )
            })}

            <a href="bot/new" className={utilStyles.abox}>
                <div className={utilStyles.botListeBlock}>
                    <div className={utilStyles.botbild}>
                        <Image
                            alt="Profile Picture"
                            src={`/add.svg`}
                            width="100"
                            height="100"
                        />
                    </div>
                    <div className={utilStyles.botname}>
                        new Bot
                    </div>
                </div>
            </a>
        </div>
    )

}

