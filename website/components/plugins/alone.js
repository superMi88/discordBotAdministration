import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { Children, useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'

/*Styles*/
import utilStyles from '/styles/utils.module.css'

import componentStyle from '/components/plugins/alone.module.css'



//plugin Input fields
import InputFields from '/components/pluginComponent/inputFields.js'


/*Icons*/
import IconPlus from '/components/icons/plus.js'
import IconMinus from '/components/icons/minus.js'
import IconDragHandle from '/components/icons/dragHandle.js'
import IconDelete from '/components/icons/delete.js'
import IconExpandMore from '/components/icons/expandMore.js'
import IconExpandLess from '/components/icons/expandLess.js'

/*Button*/
import Button from '/components/button/button.js'

import PopupBoxSmall from '/components/button/popupBoxSmall.js'

import {UIDConsumer} from 'react-uid';

import { useRouter } from 'next/router';

export default function component(props) {



  const router = useRouter()
  const [projectAlias, setProjectAlias] = useState(false);
  useEffect(()=>{
    if(!router.isReady) return;
    setProjectAlias(router.query.projectAlias)
  }, [router.isReady]);


  const [currentDrag, setCurrentDrag] = useState(false);
  const [dragOverType, setDragOverType] = useState(false);
  const [dragOrder, setDragOrder] = useState(false);

  const [dragOver, setDragOver2] = useState(false);

  const setDragOver = (e, value, type) => {
    setDragOver2(value)
    setDragOverType(type)
  }

  const mutatePlugin =() => {
    console.log("TODO remove this")
  }
  
  let dataPlugins = props.currentPluginObj

  if(!(typeof dataPlugins === 'object' && dataPlugins !== null)){
    dataPlugins = {}
  }


  let block = props.block
  let plugin = props.plugin
  let texte = props.texte


  return (
    <>
      
      <div className={componentStyle.addedChannels}>
        <div className={utilStyles.textfieldWrapper}>
        
          <div className={componentStyle.container}>
            {block.description}
          </div>

          
              <div className={componentStyle.container}>
                
              

                  <div className={`${componentStyle.menuBarLeft} ${block.style === "column"? componentStyle.flexDirectionColumn : ""}`}>

                  <InputFields style={componentStyle} props={props} block={block} mutatePlugin={mutatePlugin} databaseObject={dataPlugins['var']} projectAlias={projectAlias} editPlugin={props.editPlugin}/>
                  
                    </div>

                    <div className={componentStyle.menuBarRight}>
                  

                    </div>
                  </div>

        </div>
        
      </div>
      
    </>
  )
}

