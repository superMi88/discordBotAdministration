import Layout, { siteTitle } from '@/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import Link from 'next/link'

import cookie from "js-cookie"
import Cookies from "cookies";

import utilStyles from '@/styles/utils.module.css'
import LayoutBlank from '@/components/layoutBlank'

//standart hooks for my project
import * as Hooks from "@/hooks";

export default function Profile() {

  const decodedToken = Hooks.useDecodedToken();

  if(!decodedToken){
    return ( //wenn die id übergeben wurde war es erfolgreich

      <LayoutBlank>
        <div className={`${utilStyles.body}`}>
          <div className={`${utilStyles.projectSelectBox}`}>
            
            <h2>Projekte</h2>
            <a href={''}>loading</a>
            <a href={''}>loading</a>
            
          </div>
        </div>
      </LayoutBlank>
    )
  }

  return ( //wenn die id übergeben wurde war es erfolgreich
  <LayoutBlank>
    <div className={`${utilStyles.body}`}>
      <div className={`${utilStyles.projectSelectBox}`}>
        
        <h2>Projekte</h2>
        {decodedToken.projects.map(project => {
          return (<a href={'/admin/'+project+"/bot"}>{project}</a>)
        })}
        
      </div>
    </div>
  </LayoutBlank>
  )
  
}