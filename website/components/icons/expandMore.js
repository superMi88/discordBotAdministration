import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'


/*Styles*/
import styles from '@/components/icons/icon.module.css'

//just a small container for bottomdiv components
export default function component(props) {

    return(
      <svg className={styles.icon} viewBox="0 0 48 48"><path d="m24 30.75-12-12 2.15-2.15L24 26.5l9.85-9.85L36 18.8Z"/></svg>
    )
}
