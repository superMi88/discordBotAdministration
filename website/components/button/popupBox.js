import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*Icons*/
import IconPlus from '@/components/icons/plus.js'
import IconMinus from '@/components/icons/minus.js'
/*Button*/
import Button from '@/components/button/button.js'

/*Styles*/
import styles from '@/components/button/popupBox.module.css'

//just a small container for bottomdiv components
export default function component(props) {

  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button icon={open ? <IconMinus /> : <IconPlus />} onClick={
        async () => {
          setOpen(!open)
        }}
      />
      {open ? props.children : ""}
    </div>
  )
}
