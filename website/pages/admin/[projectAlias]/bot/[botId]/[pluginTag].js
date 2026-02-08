import Layout, { siteTitle } from '/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";

import BotMenu from '/components/helper/botMenu';

import cookie from 'js-cookie'

/*components plugins*/
import PluginComponent from '/components/pluginComponent/pluginComponent';
import Plugin from '/components/plugin.js';

/*Styles*/
import utilStyles from '/styles/utils.module.css'

/*Icons*/
import IconPlus from '/components/icons/plus.js'
import IconMinus from '/components/icons/minus.js'
/*Button*/
import Button from '/components/button/button.js'

/*lib*/
import { apiFetcher, getApiFetcher } from '/lib/apifetcher'

/*Flexbox util*/
import Flexbox from '/components/button/flexbox';
import FlexItem from '/components/button/flexItem';

import { useRouter } from 'next/router';

export default function bot({ botexist, botId, pluginTag }) {

  return( <Plugin botexist={botexist} botId={botId} pluginTag={pluginTag}/>)

}


import { database } from '/lib/database'

export async function getServerSideProps(context) {

  const { botId } = context.query;
  const { pluginTag } = context.query;

  console.log(context)

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
        botId: botId,
        pluginTag: pluginTag
      }
    }
  }

  return {
    props: {
      botexist: false
    }
  }

}


