
import Layout, { siteTitle } from '@/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import { useRouter } from 'next/router'

import InputText from '@/components/button/inputText.js'
import NewBot from '@/components/newBot.js'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Icons*/
import IconPlus from '@/components/icons/plus.js'
import IconMinus from '@/components/icons/minus.js'
/*Button*/
import Button from '@/components/button/button.js'

import cookie from 'js-cookie'

export default function bot({ discordId }) {

  return (
    <Layout selected={"bot"}>
      <NewBot discordId={discordId} />
    </Layout>
  )
}