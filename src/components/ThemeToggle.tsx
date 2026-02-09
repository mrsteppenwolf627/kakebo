"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
            aria-label="Toggle Dark Mode"
        >
            <div
                className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${isDark ? "bg-indigo-600" : "bg-stone-300"
                    }`}
            >
                <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${isDark ? "translate-x-4" : "translate-x-0"
                        }`}
                />
            </div>

            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-stone-600 dark:text-stone-400 transition-colors ${isDark ? "text-indigo-400" : ""}`}
            >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
        </button>
    );
}
