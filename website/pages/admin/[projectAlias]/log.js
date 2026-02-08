
import Layout, { siteTitle } from '/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import Link from 'next/link'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'

/*Styles*/
import utilStyles from '/styles/utils.module.css'

/*Icons*/
import IconDelete from '/components/icons/delete.js'
/*Button*/
import Button from '/components/button/button.js'



import Log from '/components/log.js'

import { useRouter } from 'next/router';

export default function Profile ({ file }) {

  return ( //wenn die id übergeben wurde war es erfolgreich
    <Layout selected={"errorlog"} >
      <Log file={file}/>
    </Layout>
  )


  /*
  const router = useRouter()
  const [projectAlias, setProjectAlias] = useState(false);
  useEffect(()=>{
    if(!router.isReady) return;
    setProjectAlias(router.query.projectAlias)
  }, [router.isReady]);*/


  const {
    data: dataLog,
    mutate: mutateLog,
    isValidating: isLog,
    error: errorLog
  } = useSWR(['/api/logs/get', { projectAlias: projectAlias}], getApiFetcher(
    (res) => {

      return res
    }
  ))

  return ( //wenn die id übergeben wurde war es erfolgreich
    <Layout selected={"errorlog"} >
      <div className="content">
        <div>Error Log</div>
        <Button icon={<IconDelete />} onClick={
                    async () => {
                      await apiFetcher('/logs/delete', {
                        projectAlias: projectAlias
                      })
                      mutateLog();
                    }}
                  />
      </div>
      <div className="content">
        {!dataLog ? "Loading Log" : showData(dataLog.data)}
      
      </div>
    </Layout>
  )
  
}

function showData(data){

  //const result = data.split(/\r?\n/);

  console.log(data)

  //return "miau";

  return data.map((element, index) => {
    console.log(element)


    return( 
      <div className={`
          ${utilStyles.logBox} 
          ${element.status == "INFO" ? utilStyles.logInfo : ""} 
          ${element.status == "ERROR" ? utilStyles.logError : ""} 
          ${element.status == "WARNING" ? utilStyles.logWarning : ""}
        `}>
        <div className={utilStyles.logTitle}>{element.title} - {element.timestamp}</div>
        <div className={utilStyles.logText}>{element.text}</div>
      </div>
    )
  })


}

/*

        <div className={utilStyles.errorNumber}>{index}</div>
        <div className={utilStyles.errorText}>{element.title}</div> */