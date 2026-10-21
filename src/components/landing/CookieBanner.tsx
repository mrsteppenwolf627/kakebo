"use client";

import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { readConsent, subscribeConsent, writeConsent } from "@/lib/consent";

export function CookieBanner() {
    const t = useTranslations("CookieBanner");
    const consent = useSyncExternalStore(subscribeConsent, readConsent, () => "pending" as const);

    // El banner solo se muestra cuando se sabe (ya hidratado) que no hay elección guardada.
    if (consent !== "unknown") return null;

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
                        type="button"
                        onClick={() => writeConsent(false)}
                        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                        {t('reject')}
                    </button>
                    <button
                        type="button"
                        onClick={() => writeConsent(true)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        {t('accept')}
                    </button>
                </div>
            </div>
        </div>
    );
}
