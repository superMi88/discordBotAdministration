//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";


import Image from 'next/image'

import Link from 'next/link'

import { useSWRConfig } from 'swr'

import Router from 'next/router'

import cookie from 'js-cookie'

/*Styles*/
import userlistStyles from '/components/helper/userliste.module.css'
import utilStyles from '/styles/utils.module.css'


import PopupBoxSmall from '/components/button/popupBoxSmall.js'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'

/*Icons*/
import IconPlus from '/components/icons/plus.js'
import IconMinus from '/components/icons/minus.js'
import IconExpandMore from '/components/icons/expandMore.js'
import IconExpandLess from '/components/icons/expandLess.js'

/*Button*/
import Button from '/components/button/button.js'
import InputText from '/components/button/inputText.js'
import InputCheckbox from '/components/button/inputCheckbox.js'

/*Flexbox util*/
import Flexbox from '/components/button/flexbox'
import FlexItem from '/components/button/flexItem'

import InputServer from '/components/inputfields/server.js'

import { useRouter } from 'next/router';


const handleOpen = (e) => {
  const target = e.target.parentNode.parentNode.parentNode.parentNode;
  if (target.classList.contains(userlistStyles.usernameBoxOpen)) {
    target.classList.remove(userlistStyles.usernameBoxOpen)
  } else {
    target.classList.add(userlistStyles.usernameBoxOpen)
  }
};

export default function component() {

  const router = useRouter()
  const {projectAlias} = router.query

  //const projectAlias = useSelector(state => state.project.value)

  const [searchName, setSearchName] = useState("")
  const [selectedServer, setSelectedServer] = useState(cookie.get("selectedServerId"))

  const { data, error, isValidating, mutate } = useSWR(projectAlias ?['/api/user/getListe', { searchName: searchName, selectedServer: selectedServer, projectAlias: projectAlias }] : null, getApiFetcher())

  const {
    data: dataCurrency,
    mutate: mutateCurrency,
    isValidating: isValidatingCurrency,
    error: errorCurrency
  } = useSWRImmutable(projectAlias ? ['/api/currency/getAll', { projectAlias: projectAlias}] : null, getApiFetcher())


  const {
    data: dataNode,
    error: errorNode,
    isValidating: isValidatingNode,
    mutate: mutateNode
  } = useSWR(projectAlias ? ['/api/plugins/getGuilds', { projectAlias: projectAlias}] : null, getApiFetcher())


  if (!dataNode || !dataCurrency) {
    return (<div>loading</div>)
  }

  if (error) return <div>Failed to load</div>

  let handleTextfield = (newValue) => {

    //console.log(e.target.value)
    setSearchName(newValue)
    mutate()
    //setSearchName(e)
  }

  return ( //wenn die id übergeben wurde war es erfolgreich#

      <div className='content'>
        <SearchField 
          searchName={searchName} handleTextfield={handleTextfield} 
          selectedServer={selectedServer} setSelectedServer={setSelectedServer}
        />
        
        {data !== undefined? 
          data.map((value, index) => {
            return (<Userinfo discordId={value.discordId} value={value} dataNode={dataNode} dataCurrency={dataCurrency} projectAlias={projectAlias}/>)
          })

        : ""}
      </div>
    )

}




function SearchField(props) {

  
  return (
    <Flexbox>
        <FlexItem type="max">
          <InputText value={props.searchName} setValue={
            async (newValue) => {
              props.handleTextfield(newValue)
            }
          } />
        </FlexItem>
        <FlexItem>
        <InputServer
          block={{}}
          activeGuild={props.selectedServer}
          editPlugin={async (databasename, guildId) => {
            console.log("guildId")
            console.log(guildId)
            props.setSelectedServer(guildId)
            cookie.set("selectedServerId", guildId)
          }
          }
        />
        </FlexItem>
    </Flexbox>
  )
}

function Coins(props) {
  //props discordId=pflicht, guildId oder global angeben, text, coins (coins start value)

  const [value, setValue] = useState(props.coins ? props.coins : 0) //wenn nicht gesetzt dann auf 0 setzen

  return (
    <>
      <div>
        {props.text}
      </div>
      <Flexbox>
        <FlexItem>
          <InputText value={value} setValue={setValue} />
        </FlexItem>
        <FlexItem type="spaceLeft">

          <Button icon={<IconPlus />} text={"Speichern"} color={"light"} onClick={
            async () => {
              await apiFetcher('/user/setCurrency', {
                currencyId: props.currencyId,
                discordId: props.discordId,
                value: value,
                projectAlias: props.projectAlias
              })
            }}
          />
        </FlexItem>
      </Flexbox>
    </>
  )
}


function Userinfo(props) {

  //is closed by default
  const [open, setOpen] = useState(false)

  let dataCurrency = props.dataCurrency
  let discordUser = props.value
  let dataNode = props.dataNode




  //wenn user auf einem vorhandenen Server ist wird [0] da  sein wenn nicht ist er auf keinem Server mehr
  //TODO hier nich was schaffen für leute die auf keinem server sind 

  if (!discordUser.currency) discordUser.currency = {}

  //sollte kein wert gesetzt sein setze den wert auf 0
  if (!discordUser.currency[dataCurrency.data.currencyId]) discordUser.currency[dataCurrency.data.currencyId] = 0

  if (dataNode.guilds.length > 0) { //if(currency.guildId)


    return (

      <div className={userlistStyles.mainDiv}>
        <Flexbox>
          <FlexItem>
            <div className={userlistStyles.profilDiv}>

              {(discordUser.avatar) ?
                <Image
                  alt="Profile Picture"
                  src={`https://cdn.discordapp.com/avatars/${discordUser.discordId}/${discordUser.avatar}.webp`}
                  width="100"
                  height="100"
                />
                :
                <Image
                  alt="guild icon"
                  src={`/questionMark.png`}
                  width="100"
                  height="100"
                />
              }


            </div>
          </FlexItem>
          <FlexItem>
            <div className={userlistStyles.profilName}>
              <div>
                {(discordUser.username && discordUser.discriminator) ?
                  discordUser.username + "#" + discordUser.discriminator
                  :
                  "undefined"
                }

              </div>
              <div className={userlistStyles.profilNameId}>{discordUser.discordId}</div>
            </div>
          </FlexItem>
          <FlexItem type="spaceLeft">
            <Button icon={{ false: <IconExpandMore />, true: <IconExpandLess /> }} color={"light"} state={open} onClick={
              async () => {
                setOpen(!open)
              }}
            />
          </FlexItem>
        </Flexbox>
        <PopupBoxSmall open={open}>
          <div>

            {dataCurrency.data.currencys.map(function (currency, i) {
              return (
                <Coins
                  text={currency.currencyName}
                  coins={discordUser.currency[currency.currencyId]}
                  currencyId={currency.currencyId}
                  discordId={discordUser.discordId}
                  projectAlias={props.projectAlias}
                />
              )
            })}


          </div>
        </PopupBoxSmall>
      </div>
    )

  }
}

