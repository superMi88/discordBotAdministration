import styles from './layout.module.css'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from "react";

/*Icons*/
import IconList from '@/components/icons/list.js'
import IconGroup from '@/components/icons/group.js'
import IconPayments from '@/components/icons/payments.js'
import IconServer from '@/components/icons/server.js'
import IconError from '@/components/icons/error.js'

/*Flexbox util*/
import Flexbox from '@/components/button/flexbox'
import FlexItem from '@/components/button/flexItem'

export default function Layout(req) {

    let selected = req.selected

    const router = useRouter()
    const { projectAlias } = router.query

    if (!selected) return null;

    if (selected.startsWith("bot")) {
        return (
            <div className={styles.selectWrapper}>
                <div>
                    <InsertLink href={"/" + projectAlias + "/bot"} text="Botliste" classNameToAdd="" icon={<IconList />} active={selected === "bot"} />
                </div>
            </div>
        )
    }

    if (selected === "userliste") {
        return (
            <div className={styles.navItemWrapper}>
                <div className={styles.navItemInnerWrapper}>
                    <InsertLink href={"/" + projectAlias + "/user"} text="Userliste" classNameToAdd="" icon={<IconGroup />} active={true} />
                </div>
            </div>
        )
    }

    if (selected === "currency") {
        return (
            <div className={styles.navItemWrapper}>
                <div className={styles.navItemInnerWrapper}>
                    <InsertLink href={"/" + projectAlias + "/currency"} text="Currency" classNameToAdd="" icon={<IconPayments />} active={true} />
                </div>
            </div>
        )
    }

    if (selected === "server" || selected === "errorlog") {
        return (
            <div className={styles.navItemWrapper}>
                <div className={styles.navItemInnerWrapper}>
                    <InsertLink href={"/" + projectAlias + "/server"} text="Server" classNameToAdd="" icon={<IconServer />} active={selected === "server"} />
                    <InsertLink href={"/" + projectAlias + "/log"} text="Log" classNameToAdd="" icon={<IconError />} active={selected === "errorlog"} />
                </div>
            </div>
        )
    }

    return null;
}

function InsertLink({ href, text, classNameToAdd, icon, active, element, pluginCount }) {

    let className = styles.link + " " + classNameToAdd

    if (active) {
        className = className + " " + styles.menuButtonActive
    }

    return (
        <div className={className}>
            <Link href={href}>
                <div className={styles.linkContainer}>
                    <Flexbox>
                        {!element ? "" :
                            <FlexItem>
                                {element}
                            </FlexItem>
                        }
                        {!icon ? "" :
                            <FlexItem>
                                <div className={styles.iconWrapper}>{icon}</div>
                            </FlexItem>
                        }
                        <FlexItem type="max">
                            <div>{text}</div>
                        </FlexItem>
                        {!pluginCount ? "" :
                            <FlexItem>
                                <div className={styles.pluginCount}>{pluginCount}</div>
                            </FlexItem>
                        }
                    </Flexbox>
                </div>
            </Link>
        </div>
    )
}