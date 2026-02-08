import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*Styles*/
import styles from '@/components/button/inputCheckbox.module.css'

export default function component(props) {

  //needs state outside because this component dont work with this values just display(value) and change(setValue)
  //value, setValue

  /*
  Example how to use
  ->change value of state direct or indirect

  <InputCheckbox checked={checked} setChecked={
    async (checked) => {
      setChecked(checked)
      apiFetcher('/user/updatePermission', { permission: 'admin', discordId: props.discordId, value: checked })
    }} 
  />

    
  <InputCheckbox checked={checked} setChecked={setChecked} 

  */

  return (
    <label className={styles.switch}>
      <input type="checkbox" onChange={
        async (e) => {
          props.setChecked(e.target.checked);
        }
      } checked={props.checked} />
      <span className={`${styles.slider} ${styles.round}`}></span>
    </label>
  )
}
