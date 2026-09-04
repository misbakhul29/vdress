'use client'

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Backsound from "../component/backsound";
import PWAInstallPrompt from "../component/PWAInstallPompt";
import MobileLandingPage from "../component/MobileLandingPage";
import { authClient } from "@/lib/auth-client";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const icon = '/ui/iconVD.svg';
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState(false);
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!isPending) {
            const uid = localStorage.getItem('uid');
            if (!session?.user && !uid) {
                router.push('/login');
            } else if (session?.user?.id) {
                localStorage.setItem('uid', session.user.id);
            }
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', {
                scope: '.'
            }).then(function (registration) {
                console.log('PWA ServiceWorker registered with scope: ', registration.scope);
            }, function (err) {
                console.log('PWA ServiceWorker registration failed: ', err);
            });
        }

        if ((window.matchMedia('(display-mode: fullscreen)').matches) || (window.matchMedia('(display-mode: standalone)').matches)) {
            setIsInstalled(true);
        } else {
            setIsInstalled(false);
        }

        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
        setIsMobile(isMobileDevice);

    }, [isInstalled]);

    if (isPending) {
        return (
            <div className='absolute flex w-full h-full z-[999] top-0 left-0 justify-center items-center'>
                <Image src={icon} alt="loading" width={40} height={40} className='animate-ping' />
            </div>
        );
    } else if (isMobile) {
        return <MobileLandingPage />;
    } else if (!isInstalled) {
        return <PWAInstallPrompt />;
    }

    return (
        <div id="s" className="overflow-hidden flex flex-1 h-screen w-full">
            <Analytics />
            <SpeedInsights />
            <Backsound />
            <div className="landscape:hidden lg:hidden pointer-events-none bg-slate-900 text-yellow-600 flex h-screen w-screen items-center justify-center">
                <p className="animate-pulse text-center font-sans font-bold text-lg">please rotate your phone to landscape!</p>
            </div>
            <div className='portrait:hidden relative flex flex-1 text-white'>
                {children}
            </div>
        </div>
    );
}