"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";

export default function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = [
    { href: "/", label: "Inicio" },
    { href: "/app", label: "Dashboard" },
    { href: "/app/agent", label: "Agente IA" },
    { href: "/app/fixed", label: "Fijos" },
    { href: "/app/ai-metrics", label: "Análisis" },
  ];

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo + Desktop Nav */}
        <div className="flex items-center gap-4 lg:gap-8 flex-1">
          <Link href="/app" className="font-serif text-xl font-medium tracking-tight text-foreground shrink-0">
            Kakebo AI
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6 overflow-x-auto no-scrollbar">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`text-sm whitespace-nowrap transition-colors duration-200 ${pathname === it.href
                  ? "text-foreground font-medium decoration-foreground underline underline-offset-4 decoration-1"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side: Nuevo + UserMenu */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/app/new"
            className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 hover:opacity-90 transition-colors whitespace-nowrap rounded-md shadow-sm"
          >
            + Gasto
          </Link>

          <ThemeToggle />
          {/* Delegamos Auth a UserMenu */}
          <UserMenu />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Menú"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {menuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-background border-b border-border shadow-sm z-20 animate-in slide-in-from-top-2">
          <div className="px-4 py-4 space-y-4">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`block text-lg ${pathname === it.href
                  ? "text-foreground font-serif font-medium"
                  : "text-muted-foreground"
                  }`}
              >
                {it.label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            <Link
              href="/app/new"
              className="block text-center w-full py-3 bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 font-medium rounded-md"
            >
              + Nuevo Gasto
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

