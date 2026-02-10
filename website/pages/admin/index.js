
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as Hooks from "@/hooks";
import LayoutBlank from '@/components/layoutBlank';
import utilStyles from '@/styles/utils.module.css';

export default function AdminIndex() {
    const router = useRouter();
    const decodedToken = Hooks.useDecodedToken();

    useEffect(() => {
        if (decodedToken && decodedToken.project) {
            // Redirect to the project specific bot page
            router.push(`/admin/${decodedToken.project}/bot`);
        } else {
            // If no token or no project in token, redirect to home page or show error
            router.push('/');
        }
    }, [decodedToken, router]);

    return (
        <LayoutBlank>
            <div className={`${utilStyles.body}`}>
                <div className={`${utilStyles.whiteText}`}>
                    Weiterleitung...
                </div>
            </div>
        </LayoutBlank>
    );
}
