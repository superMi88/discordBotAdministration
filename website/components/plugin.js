import Layout, { siteTitle } from '@/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import BotMenu from '@/components/helper/botMenu';

import cookie from 'js-cookie'

/*components plugins*/
import PluginComponent from '@/components/pluginComponent/pluginComponent';

/*Styles*/
import utilStyles from '@/styles/utils.module.css'

/*Icons*/
import IconPlus from '@/components/icons/plus.js'
import IconMinus from '@/components/icons/minus.js'
/*Button*/
import Button from '@/components/button/button.js'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox';
import FlexItem from '@/components/button/flexItem';

import { useRouter } from 'next/router';

export default function bot({ botexist, botId, pluginTag }) {

  //console.log("render pluginside")

  /*
  const router = useRouter()
  const [projectAlias, setProjectAlias] = useState(false);
  useEffect(()=>{
    if(!router.isReady) return;
    setProjectAlias(router.query.projectAlias)
  }, [router.isReady]);*/

  //const projectAlias = useSelector(state => state.project.value)

  const router = useRouter()
  const {projectAlias} = router.query

  const [hashValue, setHashValue] = useState(false);

  useEffect(() => {
    // Prüfen, ob die URL einen Hash enthält
    if (router.asPath.includes('#')) {
        const hash = router.asPath.split('#')[1]; // Alles nach dem #
        setHashValue(hash);

        
    }else{
      setHashValue(true);
    }
  }, [router.asPath]); // Trigger bei Änderungen der Route


  


  cookie.set(projectAlias+"-selectedBotId", botId)

  //will be set to true if plugin tag exists
  var pluginTagExists = false

  //Alle Plugins die Activ ausgewählt sind
  const {
    data: dataPlugins,
    mutate: mutatePlugins,
    isValidating: isValidating,
    error: error
  } = useSWR(projectAlias ? ['/api/plugins/getAll', { botId: botId, projectAlias: projectAlias }] : null, getApiFetcher())

  //Alle Plugins die es gibt
  const {
    data: dataAllPlugins,
    mutate: mutateAllPlugins,
    isValidating: isValidatingAllPlugins,
    error: errorAllPlugins
  } = useSWR(projectAlias ? ['/api/plugins/botRequest', {
    botId: botId,
    command: "getPlugins",
    projectAlias: projectAlias
  }] : null, getApiFetcher())


  useEffect(() => {
    // Prüfen, ob die URL einen Hash enthält
    if (router.asPath.includes('#')) {
        const hash = router.asPath.split('#')[1]; // Alles nach dem #
        
        const element = document.getElementById(hash);
        if (element && dataPlugins && dataAllPlugins && hashValue) {
            

            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300); // 100ms Verzögerung
        }
    }
  }, [dataPlugins, dataAllPlugins, hashValue ]); // Trigger bei Änderungen der Route



  if (dataAllPlugins) {
    dataAllPlugins.response.map(function (plugin, i) {

      if (plugin.name != pluginTag) return ""
      pluginTagExists = true

    })
  }

  if(!botexist){
    console.log("Bot exist ERROR")
  }
  console.log(botexist)
  console.log(botId)
  console.log(pluginTag)


  let test = <BotMenu botId={botId} />

  console.log("hhhhhhhhhhhhhhh")
  console.log(test)

  return (
    <Layout selected={`bot-${botId}-${pluginTag}`}>

      {!botexist ?
        <div className="content">
          Bot mit der id exestiert nicht
        </div>
        :

        <>
          <div className="content">
            {test}
            
          </div>

          <div>
            <div className="content">
            {
              !dataPlugins || !dataAllPlugins || (dataAllPlugins.statusCode === "Error") ? <div>loading...</div> :
              <>
                <Flexbox>
                  <FlexItem>
                    {dataAllPlugins.response.map((plugin, i)=>{
                      if (plugin.name != pluginTag) return ""
                      return (<div key={i}>{plugin.shortDescription}</div>)
                    })}
                  </FlexItem>
                  <FlexItem type="spaceLeft">
                    <Button icon={<IconPlus />} color="color" onClick={
                      async () => {
                        await apiFetcher('/plugins/add', {
                          botId: botId,
                          name: pluginTag,
                          projectAlias: projectAlias
                        })
                        mutatePlugins();
                      }}
                    />
                  </FlexItem>
                </Flexbox>
                
                  <Flexbox>
                    <FlexItem type="max">
                      <div className={utilStyles.textausgabe}>
                        {dataAllPlugins.response.map((plugin, i)=>{
                          if (plugin.name != pluginTag) return ""
                          return (<div key={i}>{plugin.description}</div>)
                        })}
                      </div>
                    </FlexItem>
                  </Flexbox>
                </>
              }

            

            {!pluginTagExists ?
              <div className="content">
                Plugin dont exist
              </div>
              :
              <>
                {
                  !dataPlugins || !dataAllPlugins || !hashValue ? <div>loading...</div> :

                    dataPlugins.data.plugins.length !== 0 ?



                      <>

                        {dataPlugins.data.plugins.map(function (plugin, i) {
                          if (plugin.pluginTag != pluginTag) return ""

                          const getElement = () => {
                            for (let i = 0; i < dataAllPlugins.response.length; i++) {
                              const element = dataAllPlugins.response[i];
                              if (element.name == plugin.pluginTag) {
                                return (element)
                              }
                            }
                          }
                          const activePlugin = getElement()

                          console.log("plugin:"+ plugin)


                          let open = false
                          console.log("hashValue")
                          console.log(hashValue)
                          console.log(plugin.pluginId)
                          if(hashValue == plugin.pluginId){
                              open = true
                          }
                          
                          return (
                            <div key={plugin.pluginId} id={plugin.pluginId} className={utilStyles.pluginWrapper}>
                              <PluginComponent botId={botId} activePlugin={activePlugin} plugin={plugin} mutatePlugins={mutatePlugins} openFromStart={open} />
                            </div>
                          )
                        })}


                      </>
                      :

                      <div> keine Plugins </div>


                }
              </>

            }
            </div>

          </div>

        </>
      }

    </Layout>
  )



}



