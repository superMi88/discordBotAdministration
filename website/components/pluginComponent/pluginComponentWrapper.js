import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';

/*lib*/
import { apiFetcher } from '@/lib/apifetcher'

/*Styles*/
import pluginComponentStyles from '@/components/pluginComponent/pluginComponent.module.css'

import PluginName from '@/components/pluginComponent/pluginName.js'

/*Icons*/
import IconDelete from '@/components/icons/delete.js'
import IconExpandMore from '@/components/icons/expandMore.js'
import IconExpandLess from '@/components/icons/expandLess.js'
import IconCheck from '@/components/icons/check.js'
import IconSave from '@/components/icons/save.js'

/*Button*/
import Button from '@/components/button/button.js'
import PopupBoxSmall from '@/components/button/popupBoxSmall.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox';
import FlexItem from '@/components/button/flexItem';

export default function PluginComponentWrapper(props) {
  const router = useRouter()
  const [projectAlias, setProjectAlias] = useState(false);
  useEffect(() => {
    if (!router.isReady) return;
    setProjectAlias(router.query.projectAlias)
  }, [router.isReady]);

  let activePlugin = props.activePlugin
  let botId = props.botId

  const [open, setOpen] = useState(props.openFromStart);
  const [deleteWindow, setDeleteWindow] = useState(false)

  const ChildComponent = props.childComponent; 

  return (
    <>
      <Flexbox>
        <FlexItem type="max">
          <PluginName botId={botId} projectAlias={projectAlias} plugin={props.plugin} mutatePlugin={props.mutatePlugins} />
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
          } />
        </FlexItem>
      </Flexbox>

      {!deleteWindow ? "" :
        <div className={pluginComponentStyles.deleteWindow}>
          <div className={pluginComponentStyles.deleteWindowDiv}>
            Plugin Löschen?
            <br />
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
                    pluginId: props.plugin.pluginId,
                    projectAlias: projectAlias
                  })
                  props.mutatePlugins()
                }}
              />
            </FlexItem>
          </Flexbox>
        </div>}

      <PopupBoxSmall open={open}>
          <ChildComponent 
            plugin={props.plugin} 
            activePlugin={activePlugin} 
            botId={botId} 
            projectAlias={projectAlias} 
            mutatePlugins={props.mutatePlugins} 
          />
      </PopupBoxSmall >
    </>
  );
}
