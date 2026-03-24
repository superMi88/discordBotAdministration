
import Layout, { siteTitle } from '@/components/layout'
import React, { useEffect, useState } from "react";
import BotList from '@/components/botList'



//import { useSearchParams } from 'next/navigation'

export default function bot (props) {

  

  //const searchParams = useSearchParams()
 
  //const search = searchParams.getAll("test")

  //console.log("projectAlias")
  //console.log("projectAlias: "+projectAlias)

  return ( //wenn die id übergeben wurde war es erfolgreich
    <Layout selected={"bot"}>
      <div className="content">
        <BotList/>
      </div>
    </Layout>
  )
  
}



/*
export async function getServerSideProps(context) {

  const { projectAlias } = context.query;

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

}*/
