import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { Children, useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Styles*/
import utilStyles from '@/styles/utils.module.css'

import componentStyle from '@/components/plugins/iconAndText.module.css'


//plugin Input fields
import InputFields from '@/components/pluginComponent/inputFields.js'

/*Icons*/
import IconPlus from '@/components/icons/plus.js'
import IconMinus from '@/components/icons/minus.js'
import IconDragHandle from '@/components/icons/dragHandle.js'
import IconDelete from '@/components/icons/delete.js'
import IconExpandMore from '@/components/icons/expandMore.js'
import IconExpandLess from '@/components/icons/expandLess.js'

/*Button*/
import Button from '@/components/button/button.js'

import PopupBoxSmall from '@/components/button/popupBoxSmall.js'


/*Flexbox util*/
import Flexbox from '@/components/button/flexbox';
import FlexItem from '@/components/button/flexItem';

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

  const [dragOver, setDragOver2] = useState(false);

  const [open, setOpen] = useState(false);

  const setDragOver = (e, value, type) => {

    console.log("dragover: "+value)
    setDragOver2(value)
    setDragOverType(type)
  }

  const mutatePlugin =() => {
    console.log("TODO remove this")
  }

  let dataIconAndText = props.currentPluginObj['var'][props.arrayKey]

  if (!Array.isArray(dataIconAndText)) {
    dataIconAndText = []
  }

  const relocate = async () => {

    if (dragOver === undefined) return null
    if (dragOver === currentDrag) return null

    //drag Elemente tauschen -> order value tauschen
    if (dragOverType == "this") {
      let temp = dataIconAndText[currentDrag]
      dataIconAndText[currentDrag] = dataIconAndText[dragOver]
      dataIconAndText[dragOver] = temp

      await props.editPlugin(props.arrayKey, dataIconAndText)

    }

    if (dragOverType == "sortline") {

      if(dragOver-1 < 0 ) return ""

      //remove currentDrag from array
      let temp = dataIconAndText[currentDrag]
      dataIconAndText.splice(currentDrag, 1);
      dataIconAndText.splice(dragOver-1, 0, temp);

      await props.editPlugin(props.arrayKey, dataIconAndText)
    }

  }

  
  //dataPlugins.sort(compare);

  let block = props.block
  let plugin = props.plugin
  let texte = props.texte



  let first = true

  console.log("oooo")
  console.log(props)

  return (
    <>
      <div className={componentStyle.addedChannels}>
        <div className={utilStyles.textfieldWrapper}>

          <Flexbox>
            <FlexItem type="max">
              <div>{block.description}</div>
            </FlexItem>
            <FlexItem>
              <Button icon={<IconPlus />} text={"Add"} onClick={
                async () => {

                  await props.editPlugin("", "", "", props.arrayKey, "ADD") //
                  //Push new empty object to array
                  //dataIconAndText.push({emoji1: "1008797333712015470", roles1: "991748934433247334"})
                  console.log("dataiconAndText")
                  console.log(dataIconAndText)
                }}
              />
            </FlexItem>
            <FlexItem>
              <Button icon={{ false: <IconExpandMore />, true: <IconExpandLess /> }} state={open} onClick={
                async () => {
                  setOpen(!open)
                }}
              />
            </FlexItem>
          </Flexbox>

          <PopupBoxSmall open={open}>
            {dataIconAndText.map(function (databaseObject, i) {
              function handleDragStart(e, order) {

                let ele = document.getElementById("coverup");

                if (!ele) {
                  const newDiv = document.createElement("div");
                  newDiv.setAttribute("id", "coverup");
                  newDiv.classList.add(componentStyle.coverup);
                  document.getElementsByTagName("body")[0].appendChild(newDiv);
                  ele = newDiv
                }

                //e.target.appendChild(newDiv)
                e.dataTransfer.setDragImage(ele, 40, 20)
                setCurrentDrag(i)
              }

              function handleDragEnd(e) {
                setCurrentDrag(false)
                setDragOver(false)
              }

              function handleDragOver(e) {
                e.preventDefault();
                return false;
              }

              function handleDragEnter(e, index, type) { //type before, after, this
                setDragOver(e, index, type)
              }

              function handleDragLeave(e) {
                setDragOver(e, false, false)
              }

              //Drop is called bevore Drag End so dragOver and currentDrag still has there keys
              function handleDrop(e) {
                console.log("handle DROP")
                relocate()
                e.stopPropagation(); // stops the browser from redirecting.
                return false;
              }

              function isCurrentDrag(e) {
                
                if (currentDrag === i){
                  return componentStyle.currentDrag
                }
                return ""
              }
              function isDragOver(index) {

                if (currentDrag === index) return ""
                if (dragOverType !== "this") return ""
                if (dragOver !== index) return ""
                
                return componentStyle.over
              }
              function isDragOverForStrich(index) {

                if (dragOverType != "sortline") return ""
                if (dragOver !== index) return ""
                  
                return componentStyle.overStrich
              }

              let className = componentStyle.box + " " + isCurrentDrag() + " " + isDragOver(i)
              let classNameStrichBefore = componentStyle.boxStrich + " " + isDragOverForStrich(i)
              let classNameStrichAfter = componentStyle.boxStrich + " " + isDragOverForStrich(i+1)


              //botId: props.botId, pluginId: props.pluginId, type:props.block.type, name:props.block.name
              return (<div key={i} >


                <div >
                  {first ?

                    <div
                      className={classNameStrichBefore}
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, i, "sortline")}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                    >
                      {first = false}
                    </div> : ""}
                </div>
                <div className={componentStyle.container}>
                  {/*this div is above everything when something is dragged to prevent child hover*/}
                  {currentDrag == false || currentDrag == i ? "" :
                    <div className="yourDiv"
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, i,"this")}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                    ></div>
                  }
                  <div
                    className={className}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, i,"this")}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                  >
                    <div className={componentStyle.menuBarLeft}>
                      <InputFields style={componentStyle} props={props} block={block} mutatePlugin={mutatePlugin} databaseObject={databaseObject} projectAlias={projectAlias} editPlugin={props.editPlugin} arrayId={i} arrayKey={props.arrayKey}/>
                    </div>

                    <div className={componentStyle.menuBarRight}>
                      <div
                        className="draggableBox"
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, i)}
                      >
                        <Button icon={<IconDragHandle />} cursor={"grab"} />
                      </div>

                      <Button icon={<IconDelete />} color="delete" onClick={
                        async () => {
                          await props.editPlugin("", "", i, props.arrayKey, "REMOVE") //
                          
                        }}
                      />
                    </div>




                  </div>
                </div>
                <div
                  className={classNameStrichAfter}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, i+1, "sortline")}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                >
                </div>
              </div>
              )
            })}
          </PopupBoxSmall>
        </div>

      </div>

    </>
  )
}

