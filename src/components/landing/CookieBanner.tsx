"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function CookieBanner() {
    const t = useTranslations("CookieBanner");
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("kakebo-cookie-consent");
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("kakebo-cookie-consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 shadow-lg md:p-6">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-sm text-muted-foreground text-center md:text-left">
                    {t('text')}{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">
                        {t('moreInfo')}
                    </Link>
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={acceptCookies}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        {t('accept')}
                    </button>
                </div>
            </div>
        </div>
    );
}
