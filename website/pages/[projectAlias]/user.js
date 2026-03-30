
import Layout, { siteTitle } from '../../components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import Link from 'next/link'

/*Styles*/
import Userliste from '@/components/helper/userliste';
import utilStyles from '@/styles/utils.module.css'


export default function Profile() {



  return ( //wenn die id übergeben wurde war es erfolgreich
    <Layout selected={"userliste"}>

      <Userliste />

    </Layout>
  )

}


