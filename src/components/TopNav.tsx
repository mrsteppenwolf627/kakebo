"use client";

import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import UserMenu from "./UserMenu";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/browser";

export default function TopNav({ showPlan = false }: { showPlan?: boolean }) {
  const t = useTranslations("Navigation");
  const tMenu = useTranslations("UserMenu");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  const items = [
    { href: "/", label: t('home') },
    { href: "/tutorial", label: t('tutorial') },
    { href: "/app", label: t('dashboard') },
    { href: "/app/agent", label: t('agent') },
    { href: "/app/fixed", label: t('fixed') },
    { href: "/app/history", label: t('history') },
    { href: "/app/ai-metrics", label: t('analysis') },
  ];

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Close menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional side-effect on navigation
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo + Desktop Nav */}
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link href="/app" className="mr-6 flex items-center gap-2 font-serif text-lg font-semibold tracking-tight transition-colors hover:text-primary">
            <span>🏮</span>
            <span>Kakebo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium lg:gap-6 overflow-x-auto no-scrollbar">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`text-sm whitespace-nowrap transition-colors duration-200 ${isActive(it.href)
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
        {/* Right Side: Nuevo + UserMenu */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/app/new"
            className="hidden md:inline-flex items-center px-3 py-1.5 text-xs sm:text-sm bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 hover:opacity-90 transition-colors whitespace-nowrap rounded-md shadow-sm"
          >
            {t('newExpense')}
          </Link>
          <Link
            href="/app/new-income"
            className="hidden md:inline-flex items-center px-3 py-1.5 text-xs sm:text-sm border border-stone-200 dark:border-stone-800 bg-background hover:bg-muted transition-colors whitespace-nowrap rounded-md shadow-sm"
          >
            {t('newIncome')}
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Delegamos Auth a UserMenu */}
          <UserMenu showPlan={showPlan} />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={menuOpen ? t('menuClose') : t('menuOpen')}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto overscroll-contain border-b border-border bg-background shadow-lg animate-in slide-in-from-top-2"
        >
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-5 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-12 items-center rounded-md border-b border-border/60 px-3 text-base transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${isActive(it.href)
                  ? "font-serif font-medium text-foreground"
                  : "text-muted-foreground"
                  }`}
              >
                {it.label}
              </Link>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">{t('configuration')}</span>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/app/new"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-md bg-stone-900 px-4 py-3 text-center font-medium text-stone-50 shadow-sm transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:bg-stone-50 dark:text-stone-900"
              >
                {t('newExpenseLong')}
              </Link>
              <Link
                href="/app/new-income"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-md border border-stone-200 bg-background px-4 py-3 text-center font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-stone-800"
              >
                {t('newIncomeLong')}
              </Link>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-12 w-full items-center justify-center rounded-md border border-red-200 px-4 py-3 text-center font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              {tMenu("logout")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

