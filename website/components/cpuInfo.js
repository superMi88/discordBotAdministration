


import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '../lib/apifetcher'

import { useRouter } from 'next/router';
/*Styles*/
import styles from '/components/cpuInfo.module.css'

//just a small container for bottomdiv components
export default function component(props) {

    const router = useRouter()
    const {projectAlias} = router.query

    //const projectAlias = useSelector(state => state.project.value)

    /*const router = useRouter()
    /*const [projectAlias, setProjectAlias] = useState(false);
    useEffect(()=>{
        if(!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);*/


    const {
        data: dataCpu,
        error: errorCpu,
        mutate: mutateCpu,
    } = useSWR(projectAlias ? ['/api/cpu/info', { projectAlias: projectAlias}] : null, getApiFetcher(), { refreshInterval: 500 })

    return (
        <div>
            
            {!dataCpu ? <div>"loading"</div> :
                <div>
                    <div className={styles.title}>Memory</div>
                    <ProgessBar
                        title={"Total Memory Usage"}
                        progress={dataCpu.memory.usageMb / dataCpu.memory.totalMb * 100}
                        startName={"0 mb"}
                        endName={dataCpu.memory.totalMb + " mb"}
                    />


                    <div className={styles.title}>Cpu</div>
                    {dataCpu.cpu.map(function (cpu, i) {

                        return (
                            <div>
                                <ProgessBar
                                    title={cpu.model}
                                    progress={cpu.usage}
                                    startName={"0%"}
                                    endName={"100%"}
                                />
                            </div>

                        )
                    })}

                </div>
            }
        </div>
    )
}


function ProgessBar(props) {

    let title = props.title
    let progress = props.progress
    let startName = props.startName
    let endName = props.endName

    return (
        <>
            <div className={styles.progressBarContainer}>
                <div className={styles.progressTitle}>{title}</div>
                <div className={styles.progress}>
                    <div className={`${styles.progressValue} ${"value"}`} ></div>
                </div>
                <div className={styles.progressBarContainerBottom}>
                    <div className={styles.smallLine}></div>
                    <div className={styles.progressBarContainerBottomLeft}>{startName}</div>
                    <div className={styles.progressBarContainerBottomRight}>{endName}</div>
                    <div className={styles.smallLine}></div>
                </div>
            </div>
            <style jsx>
                {`
                    .value {
                        width: ${progress}%;
                    }
                `}
            </style>
        </>


    )
}
