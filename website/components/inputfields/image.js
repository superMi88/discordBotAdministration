
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'

/*Styles*/
import utilStyles from '/styles/utils.module.css'
import pictureUploadStyles from '/components/inputfields/image.module.css'

import { useRouter } from 'next/router';
//type={props.block.type} name={props.block.name}

let collection = {}
/*{componentPictureUpload(botId, block.imageCollection, dataPlugins, isValidatingPicture, mutatePicture, plugin._id, block.max)}*/

//<InputImage botId={botId} pluginId={props.pluginId} block={block} databaseObject={databaseObject} databasename={"image"}/>
export default function component(props) {

    const [loading, setloading] = useState(false)

    let fieldnameToUpdate = props.databasename

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(()=>{
      if(!router.isReady) return;
      setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);

    const dropPicture = (e) => {
    
        // Prevent default behavior (Prevent file from being opened
        e.preventDefault();
        
        if (e.dataTransfer.items) {
          for (const [key, value] of Object.entries(e.dataTransfer.items)) {
            if (value.kind === 'file') {
              var file = value.getAsFile()
              let test = sendImage(file)
            }
          }
    
        } else {
          // Use DataTransfer interface to access the file(s)
          for (var i = 0; i < ev.dataTransfer.files.length; i++) {
          }
        }
        props.mutatePluginsWrapper()
      }
    
      const handleImageButton = (e) => {
        // Prevent default behavior
        e.preventDefault();
    
        if (e.target.files) { //einzige änderung
          for (const [key, value] of Object.entries(e.target.files)) { //änderung
            sendImage(value)
          }
        }
        props.mutatePluginsWrapper()
      }
    
      const dragOverPicture = (e) => {
        e.stopPropagation();
        e.preventDefault();
      }
    
      const handleClick = async (e, textId, fieldnameToUpdate, name, image) => {
    
        props.editPlugin(fieldnameToUpdate, "", props.arrayId, props.arrayKey)

      };
    
      async function sendImage(file) {
        var dataToSend = new FormData()
        dataToSend.append('file', file)
        dataToSend.append('botId', props.botId)
        dataToSend.append('fieldnameToUpdate', fieldnameToUpdate)
        dataToSend.append('name', props.block.name)
        dataToSend.append("projectAlias", projectAlias)
        if(props.databaseObject._id){
          dataToSend.append('textId', props.databaseObject._id )
        }
        dataToSend.append('pluginId', props.pluginId)
        setloading(true)
    
        let result = await fetch('/api/plugins/setImage', {
          headers: {
            'Accept': 'application/json'
          },
          method: 'POST', // *GET, POST, PUT, DELETE, etc.
          body: dataToSend, // body data type must match "Content-Type" header
          
        }).then(r => {
          return r.json()
        })

        //TODO check if file upload is valid or not
        props.editPlugin(fieldnameToUpdate, result.filename, props.arrayId, props.arrayKey)

        await props.mutatePlugin()
        setloading(false)
        //props.mutatePluginsWrapper()
      }

      if(loading){
        return (<div className={pictureUploadStyles.imageliste}>
        
        <div className={pictureUploadStyles.imagediv}>
            <div className={`${utilStyles.loader}`}></div>
        </div>

      </div>)
      }
      if(props.databaseObject[props.databasename] == "" || props.databaseObject[props.databasename] == undefined){
        return(<div className={pictureUploadStyles.imageliste} onDrop={dropPicture} onDragOver={dragOverPicture}>
        
        <div className={pictureUploadStyles.imagedivUploader}>
          <label className={pictureUploadStyles.imageUploadButton} for={"img"}>Upload Image</label>
          <input className={utilStyles.hidden} type="file" id={"img"} name={"img"} accept="image/*" onChange={handleImageButton} /*multiple*/ />
        </div>


      </div>)
    }

    return (
        <>
      
      <div className={pictureUploadStyles.imageliste}>

        <div className={pictureUploadStyles.imagediv}>
            <img className='image' src={`${"https://storage.googleapis.com/" + props.databaseObject[props.databasename]}`} />
            <div className={pictureUploadStyles.deleteButton} onClick={(e) => handleClick(e, props.databaseObject._id, props.databasename, props.block.name, props.databaseObject[props.databasename])}>x</div>
        </div>

      </div>
      </>
        
    )
}
