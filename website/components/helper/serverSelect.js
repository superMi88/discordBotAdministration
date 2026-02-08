

import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Styles*/
import serverSelectStyles from '@/components/helper/serverSelect.module.css'

/*
props.setActiveGuild -> function to set id for state

props.guildMap -> map with icon and id
props.guildMap.id
props.guildMap.icon


*/


import DiscordImage from '@/components/helper/discordImage'

export default function component(props) {

    function handleGuildChange(e, guildId){
        props.setActiveGuild(guildId)
    }

    return(
        <div className={serverSelectStyles.serverSelect}>
            {props.guildMap.map(function (guild, i) {
                return (
                    <div key={i} className={serverSelectStyles.serverIcon} onClick={e => handleGuildChange(e, guild.id)}>
                        
                        
                        <DiscordImage type="icon" id={guild.id} icon={guild.icon} />

                        {guild.guild}
                    </div>
                )
            })}
        </div>
    )
}