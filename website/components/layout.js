import Head from 'next/head'
import Image from 'next/image'
import styles from './layout.module.css'
import Link from 'next/link'

import LayoutBlank from '@/components/layoutBlank'


const name = 'Your Name'
export const siteTitle = 'Lowas Website'

/*lib*/
import { apiFetcher, getApiFetcher } from '../lib/apifetcher'

import DiscordImage from '@/components/helper/discordImage'

import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'

import cookie from 'js-cookie'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from "react";

/*Icons*/
import IconPlugin from '@/components/icons/plugin.js'
import IconMinus from '@/components/icons/minus.js'

/*Icons*/
import IconAccountCircle from '@/components/icons/accountCircle.js'
import IconWork from '@/components/icons/work.js'
import IconGroup from '@/components/icons/group.js'
import IconHome from '@/components/icons/home.js'
import IconLogout from '@/components/icons/logout.js'
import IconList from '@/components/icons/list.js'
import IconError from '@/components/icons/error.js'
import IconPayments from '@/components/icons/payments.js'
import IconServer from '@/components/icons/server.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'


import ProjectMenu from '@/components/projectMenu.js'

import BotPluginList from '@/components/BotPluginList.js'

import TopMenu from '@/components/topMenu.js'




//children können ausgegeben werden zb. in main <main>{children}</main>
export default function Layout({ children, selected, props }) {

  const [showMenu, setShowMenu] = useState(false);
  const [openProjectMenu, setOpenProjectMenu] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Initialize from localStorage safely on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSidebar = localStorage.getItem('sidebarVisible');
      if (storedSidebar !== null) {
        setSidebarVisible(storedSidebar === 'true');
      }
    }
  }, []);

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
    let styleNames = showMenu ? styles.enabled : styles.disabled;
    if (!sidebarVisible) {
      styleNames += " " + styles.navigationMainHidden;
    }
    return styleNames;
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
    window.location.assign("/" + projectName + "/bot")

    setProject()
  }

  const toggleSidebar = () => {
    const newState = !sidebarVisible;
    setSidebarVisible(newState);
    localStorage.setItem('sidebarVisible', newState);
  }

  return (
    <LayoutBlank>
      {/* Full width column container so top menu visually spans 100% */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>

        {/* Top Menu visually unlimited */}
        <TopMenu selected={selected} toggleSidebar={toggleSidebar} sidebarVisible={sidebarVisible} />

        {/* Lower container holding sidebar and main content side-by-side, constrained to max 1200px */}
        <div style={{ display: 'flex', flexGrow: 1, width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

          <div className={`${styles.navigationMain} ${getStyleName()}`}>
            <ProjectMenu selected={selected} />
            {selected && selected.startsWith("bot") && (
              <BotPluginList selected={selected} />
            )}
          </div>

          <div className={styles.rightMainContent} style={{ flexGrow: 1, maxWidth: '100%' }}>

            <div id="content" style={{ maxWidth: '100%' }}>
              {children}
            </div>
          </div>

        </div>

      </div>

      <div id="navSmartphone">
        <i id="openMenuButton" className="button material-icons md-24 md-light" onClick={(e) => setShowMenu(!showMenu)} >menu</i>
        {/*<i className="button material-icons md-24 md-light">search</i>*/}
      </div>
    </LayoutBlank>
  )
}
