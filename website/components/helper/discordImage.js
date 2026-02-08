import React, { useEffect, useState } from "react";

import Image from 'next/image'

/*Styles*/
import serverSelectStyles from '@/components/helper/serverSelect.module.css'

export default function component({ type, id, avatar, icon }) {


    if (type == "avatar" && id && avatar) {
        return (
            <Image
                alt="Profile Picture"
                src={`https://cdn.discordapp.com/avatars/${id}/${avatar}.webp`}
                width="100"
                height="100"
            />

        )
    }

    if (type == "icon" && id && icon) {
        return (
            <Image
                alt="Profile Picture"
                src={`https://cdn.discordapp.com/icons/${id}/${icon}.webp`}
                width="100"
                height="100"
            />

        )
    }

    return (
        <Image
            alt="Profile Picture"
            src={`/fragezeichen.png`}
            width="100"
            height="100"
        />
    )


}