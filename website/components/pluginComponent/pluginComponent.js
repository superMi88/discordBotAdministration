

import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*components plugins*/
import IconAndText from '@/components/plugins/iconAndText';
import PluginTypeAlone from '@/components/plugins/alone';


/*Styles*/
import utilStyles from '@/styles/utils.module.css'
import pluginComponentStyles from '@/components/pluginComponent/pluginComponent.module.css'


import PluginName from '@/components/pluginComponent/pluginName.js'

/*Icons*/
import IconDelete from '@/components/icons/delete.js'

import IconExpandMore from '@/components/icons/expandMore.js'
import IconExpandLess from '@/components/icons/expandLess.js'
import IconClose from '@/components/icons/close.js'

import IconCheck from '@/components/icons/check.js'
import IconSave from '@/components/icons/save.js'

/*Button*/
import Button from '@/components/button/button.js'
import InputText from '@/components/button/inputText.js'


import PopupBoxSmall from '@/components/button/popupBoxSmall.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox';
import FlexItem from '@/components/button/flexItem';

import { useRouter } from 'next/router';

import * as Lib from "@/lib";


export default function component(props) {
  const router = useRouter()
  const [projectAlias, setProjectAlias] = useState(false);
  useEffect(()=>{
    if(!router.isReady) return;
    setProjectAlias(router.query.projectAlias)
  }, [router.isReady]);

  //let plugin = props.plugin
  let activePlugin = props.activePlugin //activ plugin ist das plugin was aktiviert ist
  let botId = props.botId




  const [open, setOpen] = useState(props.openFromStart);

  const [infoMessage, setInfoMessage] = useState("") //wenn nicht gesetzt dann auf 0 setzen
  const [deleteWindow, setDeleteWindow] = useState(false) //wenn nicht gesetzt dann auf 0 setzen

  //TODO change name 
  let {
    data: plugin,
    mutate: mutatePlugin,
    isValidating: isValidatingPlugin,
    error: errorPlugin
  } = useSWR(projectAlias ? ['/api/plugins/botRequest', { botId: botId, command: "getOnePlugin", projectAlias: projectAlias, pluginId: props.plugin.pluginId }] : null, getApiFetcher())
  if(!plugin){
    return <div>load Plugin</div>
  }
  plugin = plugin.data

  let editPlugin = async (key, value, arrayId, arrayKey, command) => {

    let newPlugin = plugin
    
    if(arrayId == undefined){
      newPlugin['var'][key] = value
    }else{

      if(command){
        if(command == "ADD"){

          if(!Array.isArray(newPlugin['var'][arrayKey])){
            newPlugin['var'][arrayKey] = []
          }
          newPlugin['var'][arrayKey].push({})
        }
        if(command == "REMOVE"){
          newPlugin['var'][arrayKey].splice(arrayId, 1);
        }
      }else{
        newPlugin['var'][arrayKey][arrayId][key] = value
      }
    }

    //update Plugin Object with new values
    let returnValue = await apiFetcher('/plugins/botRequest', {
      botId: botId,
      command: "setOnePlugin",
      projectAlias: projectAlias,
      pluginId: plugin.pluginId,
      pluginObj: plugin,
      botId: botId,
    }).then(async (data) => {
      return (await data.json()).response
    })
    mutatePlugin()
  }

  return (
    <>
      <Flexbox>
        <FlexItem>
          {getSavedStatus(plugin, props.plugin) ? 
            <div className={pluginComponentStyles.saved}><div className={`${pluginComponentStyles.channelIcon}`}><IconCheck/></div></div> 
            : 
            <div className={pluginComponentStyles.unsaved}><div className={`${pluginComponentStyles.channelIcon}`}><IconSave/></div></div>
          }
        </FlexItem>
        <FlexItem type="max">
          <PluginName botId={botId} projectAlias={projectAlias} plugin={plugin} mutatePlugin={mutatePlugin} />
        </FlexItem>
        <FlexItem>
          <Button icon={{ false: <IconExpandMore />, true: <IconExpandLess /> }} color={"light"} state={open} onClick={
            async () => {
              setOpen(!open)
            }}
          />
        </FlexItem>
        <FlexItem>
          <Button icon={<IconDelete />} color={"delete"} onClick={
            async () => {
              setDeleteWindow(true)
            }
          }/>
        </FlexItem>
        <FlexItem>
          <Button text={"reset"} color={"delete"} onClick={
            async () => {

              let returnValue = await apiFetcher('/plugins/botRequest', {
                botId: botId,
                command: "deleteCache",
                projectAlias: projectAlias,
                pluginId: plugin.id
              }).then(async (data) => {
                return (await data.json()).response
              })
              props.mutatePlugins()
              mutatePlugin()
            }
          }/>
        </FlexItem>
      </Flexbox>

      {!deleteWindow? "": 
      <div className={pluginComponentStyles.deleteWindow}>
        <div className={pluginComponentStyles.deleteWindowDiv}>
          Plugin Löschen?
          <br/>
          Bist du sicher das du dieses Plugin Löschen möchtest? Es kann danach nicht wiederhergestellt werden
        </div>
        <Flexbox>
          
          <FlexItem type="spaceLeft">
            <Button icon={<IconDelete />} text={"Abbrechen"} color={"light"} onClick={
                async () => {
                  setDeleteWindow(false)
                }}
            />
          </FlexItem>
          <FlexItem>
            <Button icon={<IconDelete />} text={"Löschen"} color={"delete"} onClick={
                async () => {
                  setDeleteWindow(false)
                  await apiFetcher('/plugins/delete', {
                    botId: botId,
                    pluginId: plugin.id,
                    projectAlias: projectAlias
                  })
                  props.mutatePlugins()
                }}
            />
          </FlexItem>
        </Flexbox>
      </div>}

      <PopupBoxSmall open={open}>
        {!infoMessage? "" :
          <div className={`
            ${pluginComponentStyles.infoMessage}
            ${infoMessage.infoStatus === "Info"? pluginComponentStyles.infoMessageInfo : "" }
            ${infoMessage.infoStatus === "Error"? pluginComponentStyles.infoMessageError : "" }
          `}>
            <Flexbox>
              <FlexItem type="max">
                <div>{infoMessage.infoMessage}</div>
              </FlexItem>
              <FlexItem>
                <Button icon={<IconClose />} color={"transparent"} onClick={
                  async () => {
                    setInfoMessage("")
                  }}
                />
              </FlexItem>
            </Flexbox>
          </div>
        }
        <div className={pluginComponentStyles.channelName}>

          {
            activePlugin.blocks.map(function (block, i) {
              
              switch (block.type) {
                case "iconAndText":

                  return (
                    <IconAndText
                      key={i}
                      block={block}
                      pluginTag={plugin.pluginTag}
                      pluginId={plugin.id}
                      botId={botId}
                      mutatePluginsWrapper={props.mutatePlugins}

                      editPlugin = {editPlugin}
                      arrayKey = {block.name}
                      currentPluginObj = {plugin}
                    />
                  )
                case "alone":

                  console.log(plugin)

                  return (
                    <PluginTypeAlone
                      key={i}
                      block={block}
                      pluginTag={plugin.pluginTag}
                      pluginId={plugin.id}
                      botId={botId}
                      mutatePluginsWrapper={props.mutatePlugins}

                      editPlugin = {editPlugin}
                      currentPluginObj = {plugin}
                    />
                  )
              }
            })
          }
          {
            <div className={pluginComponentStyles.buttonflexbox}>
              { //erstelle alle buttons
                activePlugin.buttons.map(function (buttons, i) {
                  //buttons.onClick is the command
                  return (
                    <Button key={i} text={buttons.name} color={"color"} onClick={
                      async () => {
                        let returnValue = await apiFetcher('/plugins/botRequest', {
                          botId: botId,
                          command: "pluginButton",
                          pluginTag: plugin.pluginTag,
                          onClick: buttons.onClick,
                          pluginId: plugin.id,
                          projectAlias: projectAlias
                        }).then(async (data) => {
                          return (await data.json()).response
                        })
                        props.mutatePlugins()
                        mutatePlugin()
                        setInfoMessage(returnValue)
                      }}
                    />
                  )

                })
              }

            </div>
          }

        </div>
      </PopupBoxSmall>
    </>
  );
}


function getSavedStatus(plugin, pluginOld) {
  //vergleiche
  return Lib.equal(plugin.var, pluginOld.var)
}



