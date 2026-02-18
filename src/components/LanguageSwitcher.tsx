"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const isEnglish = locale === "en";

    const toggleLanguage = () => {
        const nextLocale = isEnglish ? "es" : "en";
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <button
            onClick={toggleLanguage}
            disabled={isPending}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
            aria-label={isEnglish ? "Switch to Spanish" : "Switch to English"}
        >
            <div
                className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${isEnglish ? "bg-indigo-600" : "bg-stone-300"
                    }`}
            >
                <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${isEnglish ? "translate-x-4" : "translate-x-0"
                        }`}
                />
            </div>

            <span className={`text-sm font-medium transition-colors uppercase ${isEnglish ? "text-indigo-600 dark:text-indigo-400" : "text-stone-600 dark:text-stone-400"}`}>
                {isEnglish ? "EN" : "ES"}
            </span>
        </button>
    );
}
