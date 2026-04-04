import useSWR from 'swr'
import React, { useState } from "react";

/*components plugins*/
import IconAndText from '@/components/plugins/iconAndText';
import PluginTypeAlone from '@/components/plugins/alone';

/*Styles*/
import pluginComponentStyles from '@/components/pluginComponent/pluginComponent.module.css'

/*Icons*/
import IconClose from '@/components/icons/close.js'
import IconCheck from '@/components/icons/check.js'
import IconSave from '@/components/icons/save.js'

/*Button*/
import Button from '@/components/button/button.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox';
import FlexItem from '@/components/button/flexItem';

import PluginName from '@/components/pluginComponent/pluginName';

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'
import * as Lib from "@/lib";

export default function PluginComponent(props) {
  const { plugin: propsPlugin, activePlugin, botId, projectAlias, mutatePlugins } = props;

  const [infoMessage, setInfoMessage] = useState("")

  let {
    data: fetchPlugin,
    mutate: mutatePlugin,
    isValidating: isValidatingPlugin,
    error: errorPlugin
  } = useSWR(projectAlias ? ['/api/plugins/botRequest', { botId: botId, command: "getOnePlugin", projectAlias: projectAlias, pluginId: propsPlugin.pluginId }] : null, getApiFetcher())

  let plugin = null;
  if (fetchPlugin && fetchPlugin.data) {
    plugin = fetchPlugin.data;
  }

  let editPlugin = async (key, value, arrayId, arrayKey, command) => {
    if (!plugin) return;
    let newPlugin = plugin

    if (arrayId == undefined) {
      newPlugin['var'][key] = value
    } else {

      if (command) {
        if (command == "ADD") {

          if (!Array.isArray(newPlugin['var'][arrayKey])) {
            newPlugin['var'][arrayKey] = []
          }
          newPlugin['var'][arrayKey].push({})
        }
        if (command == "REMOVE") {
          newPlugin['var'][arrayKey].splice(arrayId, 1);
        }
      } else {
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

  if (!plugin) {
    return (
      <>
        {/* Hier wird geloggt, solange das Plugin geladen wird */}
        {console.log("plugin wird geladen-------------------------------")}
        <div>Lade Plugin...</div>
      </>
    )
  }

  return (
    <>
      {/* Hier wird geloggt, sobald das Plugin fertig geladen ist */}
      {console.log("plugin geladen-------------------------------")}
      {!infoMessage ? "" :
        <div className={`
          ${pluginComponentStyles.infoMessage}
          ${infoMessage.infoStatus === "Info" ? pluginComponentStyles.infoMessageInfo : ""}
          ${infoMessage.infoStatus === "Error" ? pluginComponentStyles.infoMessageError : ""}
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
      <Flexbox>
        <FlexItem>
          {getSavedStatus(plugin, propsPlugin) ?
            <div className={pluginComponentStyles.saved}><div className={`${pluginComponentStyles.channelIcon}`}><IconCheck /></div></div>
            :
            <div className={pluginComponentStyles.unsaved}><div className={`${pluginComponentStyles.channelIcon}`}><IconSave /></div></div>
          }
        </FlexItem>
        <FlexItem type="max">
          <PluginName botId={botId} projectAlias={projectAlias} plugin={plugin} mutatePlugin={mutatePlugin} />
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
              mutatePlugins()
              mutatePlugin()
            }
          } />
        </FlexItem>
      </Flexbox>

      <div className={pluginComponentStyles.channelName}>

        {
          activePlugin && activePlugin.blocks && activePlugin.blocks.map(function (block, i) {

            switch (block.type) {
              case "iconAndText":

                return (
                  <IconAndText
                    key={i}
                    block={block}
                    pluginTag={plugin.pluginTag}
                    pluginId={plugin.id}
                    botId={botId}
                    mutatePluginsWrapper={mutatePlugins}

                    editPlugin={editPlugin}
                    arrayKey={block.name}
                    currentPluginObj={plugin}
                  />
                )
              case "alone":
                return (
                  <PluginTypeAlone
                    key={i}
                    block={block}
                    pluginTag={plugin.pluginTag}
                    pluginId={plugin.id}
                    botId={botId}
                    mutatePluginsWrapper={mutatePlugins}

                    editPlugin={editPlugin}
                    currentPluginObj={plugin}
                  />
                )
            }
          })
        }
        {
          <div className={pluginComponentStyles.buttonflexbox}>
            { //erstelle alle buttons
              activePlugin && activePlugin.buttons && activePlugin.buttons.map(function (buttons, i) {
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
                      mutatePlugins()
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
    </>
  );
}

function getSavedStatus(plugin) {
  if (!plugin) return true;
  return plugin.isSaved;
}
