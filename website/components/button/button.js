import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'


/*Styles*/
import styles from '@/components/button/button.module.css'

//just a small container for bottomdiv components
export default function component(props) {

  let icon

  if (props.icon) {

    //wenn icon kein react element ist ist es ein object mit verschiedenen states
    if (!props.icon.$$typeof) {

      icon = props.icon[props.state]
    } else {
      icon = props.icon
    }
  }


  let style
  let styleHover

  let styleCursor

  switch (props.color) {
    case "color":
      style = styles.color
      styleHover = styles.colorHover
      break;

    case "light":
      style = styles.color2
      styleHover = styles.colorHover2
      break;

    case "delete":
      style = styles.colorDelete
      styleHover = styles.colorHoverDelete
      break;
    
    case "transparent":
      style = ""
      styleHover = ""
      break;
      

    default:
      style = styles.colorNormal
      styleHover = styles.colorHoverNormal
      break;
  }

  if (props.cursor) {
    switch (props.cursor) {
      case "grab":
        styleCursor = styles.cursorGrab
        break;
    }
  }

  return (
    <div onClick={props.onClick} className={`${styles.buttonWrapper} ${style} ${styleHover} ${styleCursor}`} >
      {!icon ? "" :
        <div className={styles.iconWrapper}>
          {icon}
        </div>
      }
      {!props.text ? "" :
        <div className={styles.text}>
          {props.text}
        </div>
      }
    </div>
  )
}
