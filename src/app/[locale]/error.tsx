"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link } from "@/i18n/routing";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations("Error");

    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">{t("title")}</h2>
            <p className="text-muted-foreground mb-8 text-sm">{t("desc")}</p>

            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                    {t("retry")}
                </button>
                <Link
                    href="/"
                    className="border border-stone-200 dark:border-stone-800 bg-background text-foreground px-6 py-2 rounded-md font-medium hover:bg-muted transition-colors"
                >
                    {t("home")}
                </Link>
            </div>
        </div>
    );
}
