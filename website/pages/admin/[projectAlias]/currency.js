
import Layout, { siteTitle } from '@/components/layout'
//import {useUser} from '../lib/useUser'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'

/*Icons*/
import IconPlus from '@/components/icons/plus.js'
import IconMinus from '@/components/icons/minus.js'
/*Button*/
import Button from '@/components/button/button.js'


/*Button*/
import InputText from '@/components/button/inputText.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'


/*Styles*/
import currencyStyles from '@/styles/currency.module.css'
import utilStyles from '@/styles/utils.module.css'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'
import { useRouter } from 'next/router';

import CurrencyDashboard from '@/components/currencyDashboard.js'

export default function bot() {

    return ( //wenn die id übergeben wurde war es erfolgreich
        <Layout selected={"currency"}>

            <CurrencyDashboard />

        </Layout>
    )
}

