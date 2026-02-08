import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'


/*Styles*/
import styles from '/components/button/flexbox.module.css'

//just a small container for bottomdiv components
export default function component(props) {


  var className = styles.flexbox

  if(props.className){
    className = className+" "+props.className
  }
  
  return (
    <div className={`${className}`}>
      {props.children}
    </div>
  )

}
