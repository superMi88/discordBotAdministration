
import Head from 'next/head'
import LayoutBlank from '@/components/layoutBlank'
import useSWR from 'swr'
import Router from 'next/router'
import React, { useEffect, useState } from "react";
import cookie from "js-cookie"
import { useRouter } from 'next/router'
import { getApiFetcher } from '@/lib/apifetcher'
import utilStyles from '@/styles/utils.module.css'
import log from '@/lib/log';

let errorMessage = false;

export default function ProjectLogin({ setup }) {
    const router = useRouter()
    const { projectAlias, code } = router.query

    console.log("project: " + projectAlias + ", code: " + code)

    // Use projectAlias in the API call
    const { data, error } = useSWR(code ? ['/api/login', { 'code': code, 'setup': setup, 'projectAlias': projectAlias }] : null, getApiFetcher())

    if (code) {
        if (error) {
            console.log('[Webseite] Fehler beim anmelden');
            return <div>Fehler beim Laden</div>
        }
        if (!data) return loginLoadingPage()

        if (data.login) {
            cookie.set("jwt", data.jwt, { expires: 7 })
            console.log('[Webseite] Erfolgreich angemeldet für ' + projectAlias);
            Router.push(`/admin/${projectAlias}/bot`)
            return loginLoadingPage()
        }
        if (data.login === false) {
            errorMessage = "User nicht berechtigt für dieses Projekt"
            Router.push(`/admin/${projectAlias}/login`)
            return loginPage(setup, projectAlias)
        }
        Router.push(`/admin/${projectAlias}/bot`)
        errorMessage = "Beim Anmelden ist ein Fehler aufgetreten"
    }

    if (router.query.error === 'unauthorized') {
        errorMessage = "Du bist nicht berechtigt, dich anzumelden."
    }

    return loginPage(setup, projectAlias)
}

function loginLoadingPage() {
    return (
        <LayoutBlank>
            <div className={`${utilStyles.body}`}>
                <div className={`${utilStyles.loginBox}`}>
                    <div className={`${utilStyles.whiteText} ${utilStyles.inlineBlock}`}>
                        <div>Anmelden...</div>
                    </div>
                </div>
            </div>
        </LayoutBlank>
    )
}

function loginPage(setup, projectAlias) {
    const { clientId } = require('../../../../discordBot.config.json');
    const [redirectUrl, setRedirectUrl] = useState("");
    const state = projectAlias;

    useEffect(() => {
        if (window.location.origin) {
            // Use central callback URL
            const callbackUrl = `${window.location.origin}/admin/callback/`;
            setRedirectUrl(getAuthorizationLink(clientId, callbackUrl, state));
        }
    }, [clientId, projectAlias, state]);

    return (
        <LayoutBlank>
            <div className={`${utilStyles.body}`}>
                <div className={`${utilStyles.loginBox}`}>
                    <div className={`${utilStyles.whiteText} ${utilStyles.flexStart} `}>
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <h2>{projectAlias}</h2>
                            {setup ? "Einrichtung abschließen" : "Anmeldung erforderlich"}
                        </div>
                    </div>
                    <div className={`${utilStyles.whiteText} ${utilStyles.flexEnd} `}>
                        {redirectUrl && (
                            <a id="loginButton" className={utilStyles.buttonWithLogo} href={redirectUrl}>
                                <div className={utilStyles.buttonBoxLogo}>
                                    <img src="/discord.svg" alt="Discord Logo" />
                                </div>
                                <div className={utilStyles.buttonBoxText}>Mit Discord Anmelden</div>
                            </a>
                        )}
                        {errorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}
                    </div>
                </div>
            </div>
        </LayoutBlank>
    )
}

function getAuthorizationLink(clientId, href, state) {
    let link = href.replace(/:/g, "%3A").replace(/\//g, "%2F")
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${link}&response_type=code&scope=identify&state=${state}`
}

import { database } from '@/lib/database'

export async function getServerSideProps(context) {
    const { projectAlias } = context.params;

    const isCollectionEmpty = await database(projectAlias, async function (db) {
        return (
            !Boolean(await db.collection('userWebsite').find({}).limit(1).count())
        )
    })

    return {
        props: {
            setup: isCollectionEmpty || false,
        }
    }
}
