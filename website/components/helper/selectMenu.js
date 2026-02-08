import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'


/*

container for SelectMenu normal used like this, for roles, emojis, channels, etc.

<SelectMenu>
        
    <SearchField handleTextfield={(e) =>setSearchName(e.target.value)} />
    <ServerSelect guildMap={dataRoles.data} setActiveGuild={setActiveGuild} />

    <BottomDiv>
        //inhalt
    </BottomDiv>
<SelectMenu>

*/

/*Styles*/
import selectMenuStyles from '@/components/helper/selectMenu.module.css'

//just a small container for bottomdiv components
export default function component(props) {

    return(
        <div className={`${selectMenuStyles.selectMenu}`} anchor={props.anchor} >
            {props.children}
        </div>
    )
}
