"use client";

import Link from "next/link";
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
    );
}
