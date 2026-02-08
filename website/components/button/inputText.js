import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*Styles*/
import styles from '/components/button/inputText.module.css'

export default function component(props) {

  //needs state outside because this component dont work with this values just display(value) and change(setValue)
  //value, setValue

  return (
    <input
      className={styles.textfield} type="text"
      onChange={
        async (e) => {
          props.setValue(e.target.value);
        }
      }
      value={props.value}
    />
  )
}
