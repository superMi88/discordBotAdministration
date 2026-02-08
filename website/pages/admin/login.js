import Head from 'next/head'
import Image from 'next/image'

import LayoutBlank from '/components/layoutBlank'

//beides für die Testausgabe mit der ap
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

import Router from 'next/router'

import React, { useEffect, useState } from "react";

import cookie from "js-cookie"
import { useRouter } from 'next/router'

//fetcher
import { getApiFetcher } from '/lib/apifetcher'

//styles
import utilStyles from '/styles/utils.module.css'

import log from '/lib/log';

let errorMessage = false;



export default function Home({ setup }) {


  console.log(setup)

  const router = useRouter()
  const { code } = router.query

  console.log("code: " + code)

  //only run if code is defined in url

  const { data, error } = useSWR(['/api/login', { 'code': code, 'setup': setup }], getApiFetcher())

  if (code) {

    if (error) {
      console.log('[Webseite] Fehler beim anmelden');
      return <div>Failed to loadx</div>
    }
    if (!data) return loginLoadingPage()

    if (data.login) { //check if login war erfolgreich


      //nach 7 tagen läuft der discord token ab
      cookie.set("jwt", data.jwt, { expires: 7 })

      console.log('\x1b[36m%s \x1b[0m%s', '[Webseite]', 'Erfolgreich angemeldet');  //cyan
      log.info('weiterleitung auf homepage')
      Router.push('/admin/')
      return loginLoadingPage()
    }
    if (data.login === false) { //check if login war erfolgreich
      console.log('[Webseite] User nicht berechtigt');
      errorMessage = "Der User exestiert nicht"
      Router.push('/admin/login')
      return loginPage(setup)
    }
    Router.push('/admin/')
    errorMessage = "Beim Anmelden ist ein Fehler aufgetreten"
  }

  return loginPage(setup)


}

function loginLoadingPage() {
  return (
    <LayoutBlank>
      <div className={`${utilStyles.body}`}>
        <div className={`${utilStyles.loginBox}`}>
          <div className={`${utilStyles.whiteText} ${utilStyles.inlineBlock}`}>
            <div>
              Anmelden...
            </div>
          </div>
        </div>
      </div>
    </LayoutBlank>
  )
}

function loginPage(setup) {

  const { clientId, url } = require('/../discordBot.config.json');

  return (
    <LayoutBlank>
      <div className={`${utilStyles.body}`}>
        <div className={`${utilStyles.loginBox}`}>
          <div className={`${utilStyles.whiteText} ${utilStyles.flexStart} `}>
            <div>
              {setup ? "Melde dich an um die Einrichtung abzuschließen" : "Du musst dich mit deinem Discord account anmelden"}

            </div>

          </div>
          <div className={`${utilStyles.whiteText} ${utilStyles.flexEnd} `}>



            <a id="loginButton" className={utilStyles.buttonWithLogo} href={getAuthorizationLink(clientId, url + "admin/login/")}>
              <div className={utilStyles.buttonBoxLogo}>
                <img src="/discord.svg" alt="svg discord" />
              </div>

              <div className={utilStyles.buttonBoxText}>
                Mit Discord Anmelden
              </div>
            </a>


            {showErrorMessage()}
          </div>
        </div>
      </div>
    </LayoutBlank>
  )
}

function showErrorMessage() {
  if (errorMessage) {
    return errorMessage
  }
  return ''
}

import { databaseWebsite } from '/lib/database'

export async function getServerSideProps(context) {

  const isCollectionEmpty = await databaseWebsite(async function (db) {
    return (
      !Boolean(await db.collection('websiteUser').find({}).limit(1).count())
    )
  })

  if (isCollectionEmpty) {
    return {
      props: {
        setup: true,
      }
    }
  }
  return {
    props: {
      setup: false
    }
  }

}


//replace : and / so it matches the required authorization_link
function getAuthorizationLink(clientId, href) {

  let link = href.replace(":", "%3A").replace("/", "%2F")

  return "https://discord.com/api/oauth2/authorize?client_id=" + clientId + "&redirect_uri=" + link + "&response_type=code&scope=email%20identify%20guilds"

}