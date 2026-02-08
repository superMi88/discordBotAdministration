import Layout, { siteTitle } from '@/components//layout'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useMemo, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Styles*/
import botMenuStyles from '@/components/helper/botMenu.module.css'
import utilStyles from '@/styles/utils.module.css'


/*Icons*/
import IconPlus from '@/components/icons/plus.js'
import IconMinus from '@/components/icons/minus.js'
import IconPlay from '@/components/icons/play.js'
import IconStop from '@/components/icons/stop.js'
import IconPending from '@/components/icons/pending.js'

/*Button*/
import Button from '@/components/button/button.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'

import { useRouter } from 'next/router';


//TODO: check status not correct on side reload
export default function component({ botId }) {

  const [discordBotStatusAlt, setDiscordBotStatus] = useState('unset')

  const [trigger, setTrigger] = useState(false)

  const discordBotStatus = useMemo(
    () => {
      //if(discordBotStatusalt == 'unset') return false
      setTrigger(false)
      return discordBotStatusAlt
    },
    [trigger]
  )

  const router = useRouter()
  const {projectAlias} = router.query
  
  //const projectAlias = useSelector(state => state.project.value)


  /*
  console.log("testMIIIIII")
  console.log("testMIIIIII: "+projectAlias)
  console.log("testMIIIIII: "+botId)*/


  const {
    data: dataPicture,
    mutate: mutatePicture,
    isValidating: isValidatingPicture,
    error: errorPicture
  } = useSWR(projectAlias ? ['/api/bot/isRunning', { botId: botId, /*currentStatus: discordBotStatus,*/ projectAlias: projectAlias }] : null, getApiFetcher(
    (res) => {

      setTrigger(true)
      
      setDiscordBotStatus(res.status)
      return res
    }
  ), { refreshInterval: 1000 })


  //TODO: improve getInfo for wrong botId, currently only showing "Looading"
  const {
    data: dataLia,
    mutate: mutateLia,
    isValidating: isValidatingLia,
    error: errorLia
  } = useSWRImmutable(projectAlias ? ['/api/bot/getInfo', { botId: botId, projectAlias: projectAlias }] : null, getApiFetcher())


  if(!dataLia){
    console.log("renderfehler render bot menu mit botId"+botId)
    console.log(dataLia)
    console.log(discordBotStatus)
  }


  const startBotFunction = async () => {
    //setDiscordBotStatus('starting')
    await apiFetcher('/bot/start', { botId: botId, projectAlias: projectAlias })
    mutatePicture()
  }

  const stopBotFunction = async () => {
    //setDiscordBotStatus('stopping')
    await apiFetcher('/bot/destroy', { botId: botId, projectAlias: projectAlias })
    mutatePicture()
  }

  function showButton(discordBotStatus) {

    if (discordBotStatus == 'online') {
      return (<Button icon={<IconStop />} color={"color"} onClick={stopBotFunction} />)
    } else if (discordBotStatus == 'starting') {
      return (<Button icon={<IconPending />} color={"color"} />)
    } else if (discordBotStatus == 'stopping') {
      return (<Button icon={<IconPending />} color={"color"} />)
    } else {
      return (<Button icon={<IconPlay />} color={"color"} onClick={startBotFunction} />)
    }

  }

  function showStatus(discordBotStatus) {

    if (discordBotStatus == 'online') {
      return <div className={botMenuStyles.online}></div>
    } else if (discordBotStatus == 'starting') {
      return <div className={botMenuStyles.starting}></div>
    } else if (discordBotStatus == 'stopping') {
      return <div className={botMenuStyles.stopping}></div>
    } else if (discordBotStatus == 'unset') {
      return <div className={botMenuStyles.unset}></div>
    } else {
      return <div className={botMenuStyles.offline}></div>
    }

  }

  if (dataLia && discordBotStatus) {
    return (
      <Flexbox>
        <FlexItem>
          <div className={botMenuStyles.botpicBox}>
            <div className={botMenuStyles.botpic}>
              {dataLia.avatar ?
                <Image
                  alt="Profile Picture"
                  src={`https://cdn.discordapp.com/avatars/${dataLia.id}/${dataLia.avatar}.webp`}
                  width="100"
                  height="100"
                /> :
                <Image
                  alt="Profile Picture"
                  src={`/fragezeichen.png`}
                  width="100"
                  height="100"
                />
              }
            </div>

            <div>{showStatus(discordBotStatus)}</div>
          </div>
        </FlexItem>
        <FlexItem>
          <div className={`${botMenuStyles.botName}`}>{dataLia.username}#{dataLia.discriminator}</div>
          <Flexbox>
            <FlexItem>
              <div>{showButton(discordBotStatus)}</div>
            </FlexItem>
            <FlexItem>

              <a target="_blank" href={`https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot%20applications.commands`} rel="noopener noreferrer">

                <Button icon={<IconPlus />} text={"Server"} color={"color"} onClick={
                  async () => {
                    console.log("invite link click")
                  }}
                />
              </a>
            </FlexItem>
          </Flexbox>
        </FlexItem>
      </Flexbox>
    )


  }

  console.log("ERROR")

  return (
    <div className={`${utilStyles.contentBox}`}>
      <h1>Loading</h1>
    </div>
  )
}

