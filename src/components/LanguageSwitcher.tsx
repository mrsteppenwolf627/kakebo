"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const toggleLanguage = () => {
        const nextLocale = locale === "es" ? "en" : "es";
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <button
            onClick={toggleLanguage}
            disabled={isPending}
            className="p-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase"
            aria-label="Switch language"
        >
            {locale === "es" ? "EN" : "ES"}
        </button>
    );
}
