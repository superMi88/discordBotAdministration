

import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'


/*Icons*/
import IconDelete from '/components/icons/delete.js'

import IconExpandMore from '/components/icons/expandMore.js'
import IconExpandLess from '/components/icons/expandLess.js'
import IconClose from '/components/icons/close.js'

import IconCheck from '/components/icons/check.js'
import IconSave from '/components/icons/save.js'

/*Input Fields*/
import InputEmoji from '/components/inputfields/emoji.js'
import InputText from '/components/inputfields/text.js'
import InputTextarea from '/components/inputfields/textarea.js'
import InputChannel from '/components/inputfields/channel.js'
import InputRoles from '/components/inputfields/roles.js'
import InputToggle from '/components/inputfields/toggle.js'
import InputImage from '/components/inputfields/image.js'
import InputCurrency from '/components/inputfields/currency.js'
import InputPlugin from '/components/inputfields/plugin.js'
import InputDate from '/components/inputfields/date.js'
import InputServer from '/components/inputfields/server.js'
import InputFile from '/components/inputfields/file.js'
import InputConsole from '/components/inputfields/console.js'




/*Flexbox util*/
import Flexbox from '/components/button/flexbox';
import FlexItem from '/components/button/flexItem';

import { useRouter } from 'next/router';



//<InputFields style={componentStyle} props={props} block={block} mutatePlugin={mutatePlugin} databaseObject={dataPlugins} projectAlias={projectAlias} />
export default function component(props) {

  let componentStyle = props.style
  let block = props.block
  let mutatePlugin = props.mutatePlugin
  let dataPlugins = props.databaseObject
  let projectAlias = props.projectAlias
  let arrayId = props.arrayId
  let arrayKey= props.arrayKey

  props = props.props


  return (
    <>
    
    {block.fields ?
      block.fields.map(function (field, i) {

        if (!field) return ""

        switch (field.type) {
          case "image":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputImage editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} />
              </div>
            )
          case "file":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputFile editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} />
              </div>
            )
          case "toggle":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputToggle editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} />
              </div>)
          case "roles":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputRoles editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} />
              </div>)
          case "channel":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputChannel editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} field={field} />
              </div>)
          case "text":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputText editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginTag={props.pluginTag} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} regex={field.regex}  fieldoptions={field}  />
              </div>)
          case "textarea":
            return (
                  <div key={i} className={componentStyle.fieldWrapper}>
                    <InputTextarea editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginTag={props.pluginTag} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} fieldoptions={field} />
                  </div>
                )
          case "emoji":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputEmoji editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} />
              </div>
            )
          case "currency":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputCurrency editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} />
              </div>
            )
          case "plugin":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputPlugin editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} />
              </div>
            )
          case "date":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputDate editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} />
              </div>
            )
          case "server":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputServer editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} field={field} 
                  activeGuild = {/*dataPlugins['var'][field.name]*/ ''}
                  
                  setGuildFunction={ async (guildId) => {
                        
                  }
                }
                />
              </div>
            )
          case "console":
            return (
              <div key={i} className={componentStyle.fieldWrapper}>
                <InputConsole editPlugin={props.editPlugin} arrayId={arrayId} arrayKey={arrayKey} mutatePluginsWrapper={props.mutatePluginsWrapper} mutatePlugin={mutatePlugin} botId={props.botId} pluginTag={props.pluginTag} pluginId={props.pluginId} block={block} databaseObject={dataPlugins} databasename={field.name} fieldoptions={field} />
              </div>
            )
        }
      }) : ""}
      </>
  );
}


