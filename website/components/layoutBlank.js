import Head from 'next/head'
import Image from 'next/image'
import styles from './layout.module.css'
import Link from 'next/link'
import Script from 'next/script'

const name = 'Your Name'
export const siteTitle = 'Lowas Website'

import React, { useEffect, useState } from "react";

import { useRouter } from 'next/navigation'


//children können ausgegeben werden zb. in main <main>{children}</main>
export default function Layout(req) {

  const router = useRouter()
  let children = req.children

  return (
    
      <div className={styles.body}>
        <Head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="shortcut icon" href="favicon.ico" />
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

          <meta
            property="og:image"
            content={`https://og-image.vercel.app/${encodeURI(
              siteTitle
            )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
          />
          <meta name="og:title" content={siteTitle} />
          <meta name="twitter:card" content="summary_large_image" />

          <title>{siteTitle}</title>
        </Head>

        {children}
        
      </div>
  )
}


export async function getServerSideProps(context) {


  return {
    props: {
      testbool: false
    }
  }

}



