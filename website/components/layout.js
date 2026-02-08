import Head from 'next/head'
import Image from 'next/image'
import styles from './layout.module.css'
import Link from 'next/link'

import LayoutBlank from '/components/layoutBlank'


const name = 'Your Name'
export const siteTitle = 'Lowas Website'

/*lib*/
import { apiFetcher, getApiFetcher } from '../lib/apifetcher'

import DiscordImage from '/components/helper/discordImage'

import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'

import cookie from 'js-cookie'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from "react";

/*Icons*/
import IconPlugin from '/components/icons/plugin.js'
import IconMinus from '/components/icons/minus.js'

/*Icons*/
import IconAccountCircle from '/components/icons/accountCircle.js'
import IconWork from '/components/icons/work.js'
import IconGroup from '/components/icons/group.js'
import IconHome from '/components/icons/home.js'
import IconLogout from '/components/icons/logout.js'
import IconList from '/components/icons/list.js'
import IconError from '/components/icons/error.js'
import IconPayments from '/components/icons/payments.js'
import IconServer from '/components/icons/server.js'

/*Flexbox util*/
import Flexbox from '/components/button/flexbox'
import FlexItem from '/components/button/flexItem'


import ProjectMenu from '/components/projectMenu.js'

import BotPluginList from '/components/BotPluginList.js'

import TopMenu from '/components/topMenu.js'




//children können ausgegeben werden zb. in main <main>{children}</main>
export default function Layout({ children, selected, props }) {

  const [showMenu, setShowMenu] = useState(false);
  const [openProjectMenu, setOpenProjectMenu] = useState(false);

  useEffect(() => {
    // only execute all the code below in client side
    if (typeof window !== 'undefined') {
      // Handler to call on window resize
      function handleResize() {
        if (window.innerWidth > 500) {
          setShowMenu(false)
        }
      }
      // Add event listener
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []); // Empty array ensures that effect is only run on mount


  //stylename for menu -> disabled/enabled style
  const getStyleName = (e) => {
    if (showMenu) {
      return styles.enabled
    } else {
      return styles.disabled
    }
  }

  const loginfetcher = (url, accessToken) =>
    fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      body: JSON.stringify({ 'access_token': accessToken }) // body data type must match "Content-Type" header
    }).then(r => {
      let json = r.json()

      //const { cache } = useSWRConfig()
      //cache.set('data', data);
      return json
    })

  const openMenu = (e) => {
    if (openProjectMenu) {
      setOpenProjectMenu(false)
    } else {
      setOpenProjectMenu(true)
    }
  }

  const handleClick = (e, projectName) => {
    window.location.assign("/admin/" + projectName + "/bot")

    setProject()
  }

  return (
    <LayoutBlank>

      <div className={`${styles.navigationMain} ${getStyleName()}`}>
          <ProjectMenu selected={selected} />
          <BotPluginList selected={selected} />
      </div>

      <div className={styles.rightMainContent}>

        <TopMenu selected={selected} />

        <div id="content">
          {children}
        </div>
      </div>
      <div id="navSmartphone">
        <i id="openMenuButton" className="button material-icons md-24 md-light" onClick={(e) => setShowMenu(!showMenu)} >menu</i>
        {/*<i className="button material-icons md-24 md-light">search</i>*/}
      </div>
    </LayoutBlank>
  )
}