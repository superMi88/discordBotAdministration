

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
import searchFieldStyles from '@/components/helper/searchField.module.css'

/*
props.setActiveGuild -> function to set id for state

props.guildMap -> map with icon and id
props.guildMap.id
props.guildMap.icon


*/

export default function component(props) {

    //handleTextfield funktion
    let handleTextfield = props.handleTextfield

    return (
        <div className={searchFieldStyles.topdiv}>
            <div className={`${searchFieldStyles.text}`}>
                <input
                    className={searchFieldStyles.textfield} type="text"
                    onChange={e => handleTextfield(e)}
                    defaultValue=""
                />
            </div>
        </div>
    )
}