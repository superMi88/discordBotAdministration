import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'


/*Styles*/
import styles from '/components/icons/icon.module.css'

//just a small container for bottomdiv components
export default function component(props) {

    return(
      <svg className={styles.icon} viewBox="0 0 48 48"><path d="M10 25.5v-3h28v3Z"/></svg>
    )
}
