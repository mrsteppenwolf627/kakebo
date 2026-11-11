"use client";

import NextLink from "next/link";
import { useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";
import { englishEquivalentLinkable } from "@/lib/lang-switch";

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const isEnglish = locale === "en";
    const nextLocale = isEnglish ? "es" : "en";

    // WCAG 2.5.3 (label in name): the accessible name starts with the visible text ("EN" / "ES").
    const ariaLabel = isEnglish ? "EN - Switch to Spanish" : "ES - Cambiar a inglés";
    const className = "flex items-center gap-2 p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group";

    const content = (
        <>
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
        </>
    );

    // Enlace real hacia la versión equivalente (aparece en el HTML estático: rastreable por Google). `replace` conserva el
    // comportamiento anterior (router.replace); no lee searchParams, headers() ni cookies() en servidor.
    if (isEnglish) {
        // EN → ES: el español no lleva prefijo. El Link de next-intl con locale="es" emitiría href="/es/…" (un 308 hacia la ruta
        // sin prefijo), así que se enlaza directamente a la ruta sin prefijo.
        return (
            <NextLink href={pathname} replace prefetch={false} hrefLang={nextLocale} className={className} aria-label={ariaLabel}>
                {content}
            </NextLink>
        );
    }
    if (englishEquivalentLinkable(pathname)) {
        return (
            <Link href={pathname} locale={nextLocale} replace prefetch={false} hrefLang={nextLocale} className={className} aria-label={ariaLabel}>
                {content}
            </Link>
        );
    }

    // Páginas sin equivalente EN enlazable (solo español o EN noindex): se mantiene el botón, sin href.
    const toggleLanguage = () => {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <button onClick={toggleLanguage} disabled={isPending} className={className} aria-label={ariaLabel}>
            {content}
        </button>
    );
}
