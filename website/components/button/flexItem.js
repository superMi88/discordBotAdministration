import React, { useEffect, useState } from "react";

/*Styles*/
import styles from '/components/button/flexbox.module.css'

/*
type =>
  spaceLeft (nach links allen verfügbaren space frei lassen)
  max (maximale verfügbare größe)
*/

export default function component({type, children}) {

  if(type == "spaceLeft"){
    return(<div className={styles.flexContainerMarginLeft}>{children}</div>)
  }else if(type == "max"){
    return(<div className={styles.flexContainerWith100}>{children}</div>)
  }{
    return(<div className={styles.flexContainerLeft}>{children}</div>)
  }
}
