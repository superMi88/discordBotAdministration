import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'


/*Styles*/

import bottomdivStyles from '@/components/helper/bottomDiv.module.css'

//just a small container for bottomdiv components
export default function component(props) {

    return(
        <div className={bottomdivStyles.bottomdiv}>
            {props.children}
        </div>
    )
}
