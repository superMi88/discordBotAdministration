
import Layout, { siteTitle } from '/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'


/*components plugins*/
import CpuComponent from '/components/cpuInfo';

import cookie from 'js-cookie'

export default function bot() {

  return ( //wenn die id übergeben wurde war es erfolgreich
    <Layout selected={"server"}>
      <div className="content">
        <CpuComponent />
      </div>
    </Layout>
  )

}