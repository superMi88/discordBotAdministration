import '../styles/global.css' /*import global css*/


/*_app.js wird immer aufgerufen bei jedem seitenaufruf*/

export default function App({ Component, pageProps }) {

    return <Component {...pageProps} />
}