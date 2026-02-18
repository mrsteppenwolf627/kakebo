"use client";

import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";

export default function FloatingAddButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show button after a small delay or on scroll, but for now let's just show it always
        // with a small entrance animation
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Link
                href="/app/new-income"
                className={`fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 border border-stone-200 dark:border-stone-700 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 delay-75 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                    }`}
                aria-label="Añadir ingreso"
                title="Añadir nuevo ingreso"
            >
                <span className="text-2xl" role="img" aria-label="money bag">
                    💰
                </span>
            </Link>

            <Link
                href="/app/new"
                className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                    }`}
                aria-label="Añadir gasto"
                title="Añadir nuevo gasto"
            >
                <span className="text-2xl" role="img" aria-label="money with wings">
                    💸
                </span>
            </Link>
        </>
    );
}
