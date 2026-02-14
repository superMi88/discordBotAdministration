
import Layout, { siteTitle } from '@/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import BotMenu from '@/components/helper/botMenu';
import BotDashboard from '@/components/botDashboard';


import cookie from 'js-cookie'

import Link from 'next/link'

/*Styles*/
import utilStyles from '@/styles/utils.module.css'

/*Icons*/
import IconPlus from '@/components/icons/plus.js'
import IconMinus from '@/components/icons/minus.js'
/*Button*/
import Button from '@/components/button/button.js'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

import { useRouter } from 'next/router';


export default function bot({ botexist, botId }) {

  return (

    <Layout selected={`bot-${botId}`}>
      <BotDashboard botexist={botexist} botId={botId} />
    </Layout>

  )
}


import { database } from '@/lib/database'

export async function getServerSideProps(context) {

  const { botId } = context.query;

  const filteredDocs = await database(context.query.projectAlias, async function (db) {
    return (
      await db.collection('botCollection').findOne(
        {
          id: botId
        }
      )
    )
  })

  //TODO: check of botId exist ansonsten redirekt
  if (filteredDocs) {
    return {
      props: {
        botexist: true,
        botId: botId
      }
    }
  }

  return {
    props: {
      botexist: false
    }
  }

}


