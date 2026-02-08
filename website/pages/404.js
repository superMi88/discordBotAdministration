import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'

import LayoutBlank from '../components/layoutBlank'

/*Styles*/
import utilStyles from '/styles/utils.module.css'


export default function Custom404({ allPostsData }) {
  return (
    <LayoutBlank>
      <p className={utilStyles.content404}>404 - Seite nicht gefunden</p>
    </LayoutBlank>
  )
}


//only runs on serverside, heißt man kann datenbank abfragen einfach direkt machen ohne das es schlimm ist
/*
In development (npm run dev or yarn dev), getStaticProps runs on every request.
In production, getStaticProps runs at build time. However, this behavior can be enhanced using the fallback key returned by getStaticPaths

getStaticProps can only be exported from a page. You can’t export it from non-page files.

One of the reasons for this restriction is that React needs to have all the required data before the page is rendered.

Static Generation is not a good idea if you cannot pre-render a page ahead of a user's request!!!!!
*/

//statisch unabhängig von user input
export async function getStaticProps() {
  return {
    props: {
    }
  }
}


//runs on each request abhängig von user input oder eine seite die sich ständig ändert
//Error: error: You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps
/*
export async function getServerSideProps(context) {
  return {
    props: {
      // props for your component
    }
  }
}
*/