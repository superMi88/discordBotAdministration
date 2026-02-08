
import Layout, { siteTitle } from '/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import { useRouter } from 'next/router'

import InputText from '/components/button/inputText.js'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'


/*Icons*/
import IconPlus from '/components/icons/plus.js'
import IconMinus from '/components/icons/minus.js'
/*Button*/
import Button from '/components/button/button.js'

import cookie from 'js-cookie'

//standart hooks for my project
import * as Hooks from "@/hooks";

export default function bot({ discordId }) {

    const router = useRouter()
    const {projectAlias} = router.query

    //const projectAlias = useSelector(state => state.project.value)

    const [createBot, setCreateBot] = useState(false)

    const [token, setToken] = useState("")
    const [botId, setBotId] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const decodedToken = Hooks.useDecodedToken();

    console.log(decodedToken)

    if (!decodedToken) {
        return (
            <div className="content">
                loading account data from token
            </div>
        )
    }

    if (createBot) {
        return (
            <div className="content">
                Bot wird gerade erstellt
            </div>
        )
    }

    return (
        <div className="content">
            {errorMessage ? errorMessage : null}

            <div>Id</div>
            <InputText value={botId} setValue={setBotId} />

            <div>Token</div>
            <InputText value={token} setValue={setToken} />

            <Button icon={<IconPlus />} text={"Speichern"} onClick={async (e) => {

                setCreateBot(true)
                const response = await apiFetcher('/bot/new', {
                    botId: botId,
                    token: token,
                    ownerId: decodedToken.userId,
                    projectAlias: projectAlias
                }).then(async (data) => {
                    return await data.json()
                })

                if (response.message == "TOKEN_INVALID") {
                    setErrorMessage("Ungültige Id oder Token")
                    setCreateBot(false)
                } else if (response.message == "DISALLOWED_INTENTS") {
                    setErrorMessage("Error: DISALLOWED_INTENTS")
                    setCreateBot(false)
                } else if (response.message == "UNKNOWN_ERROR") {
                    setErrorMessage("Error: UNKNOWN_ERROR")
                    setCreateBot(false)
                } else {
                    router.push('/admin/' + projectAlias + '/bot/' + botId + '/plugins')
                }


            }} />
        </div>
    )
}