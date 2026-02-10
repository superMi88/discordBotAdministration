import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { getApiFetcher } from '@/lib/apifetcher';
import LayoutBlank from '@/components/layoutBlank';
import utilStyles from '@/styles/utils.module.css';
import cookie from 'js-cookie';

export default function Callback() {
    const router = useRouter();
    const { code, state } = router.query; // 'state' enthält den projectAlias

    // Wir rufen die API nur auf, wenn code und state vorhanden sind
    const shouldFetch = code && state;

    // useSWR hook must be called at top level, key is null if shouldFetch is false
    const { data, error } = useSWR(
        shouldFetch ? ['/api/login', { code, projectAlias: state }] : null,
        getApiFetcher()
    );

    useEffect(() => {
        if (!shouldFetch) return;

        if (error) {
            console.error('Login error:', error);
            // Im Fehlerfall zurück zum Projekt-Login
            router.push(`/admin/${state}/login?error=true`);
        } else if (data) {
            if (data.login) {
                // Erfolgreich eingeloggt
                cookie.set('jwt', data.jwt, { expires: 7 });
                console.log(`[Callback] Erfolgreich eingeloggt für Projekt: ${state}`);
                router.push(`/admin/${state}/bot`);
            } else {
                // Login fehlgeschlagen (z.B. User nicht in DB)
                console.warn('[Callback] Login verweigert.');
                router.push(`/admin/${state}/login?error=unauthorized`);
            }
        }
    }, [data, error, router, state, shouldFetch]);

    return (
        <LayoutBlank>
            <div className={`${utilStyles.body}`}>
                <div className={`${utilStyles.loginBox}`}>
                    <div className={`${utilStyles.whiteText} ${utilStyles.inlineBlock}`}>
                        <div>
                            Authentifiziere...
                        </div>
                    </div>
                </div>
            </div>
        </LayoutBlank>
    );
}
