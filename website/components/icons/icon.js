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
  
  if (props.color) {
    return (
      <>
        <style jsx>{`
          .roleIcon {
            fill: #${props.color ? props.color.toString(16) : "fff"};
          }
        `}
        </style>
        <svg className={`${styles.icon} ${props.class} roleIcon`} viewBox={props.viewBox}>{props.children}</svg>
      </>
    )
  }

  return(
    <svg className={styles.icon} viewBox={props.viewBox}>{props.children}</svg>
  )
}
