"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Link, useRouter, usePathname } from "@/i18n/routing";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useTranslations } from "next-intl";


export function Navbar() {
  const t = useTranslations("Navigation");
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isHome = pathname === "/";
  const isBlog = pathname.startsWith("/blog");
  const getHashPath = (hash: string) => isHome ? hash : `/${hash}`;

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!isToolsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isToolsOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Close menu on route change logic is handled by Link automatically in some setups,
  // but let's be explicit if needed or rely on onClick.
  const closeMenu = () => setIsMenuOpen(false);

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/app");
    closeMenu();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" onClick={closeMenu} className="flex items-center gap-3 transition-opacity hover:opacity-70 group">
          <div className="flex h-9 w-9 items-center justify-center border border-foreground bg-foreground group-hover:bg-foreground/90 transition-colors">
            <span className="text-lg font-serif text-background">K</span>
          </div>
          <span className="text-xl font-serif font-medium tracking-tight text-foreground">
            Kakebo
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/tutorial"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('tutorial')}
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('blog')}
          </Link>
          <Link
            href="/sobre-nosotros"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('about')}
          </Link>

          {/* Herramientas Dropdown — UIUX-12 accessible dropdown, do not modify */}
          <div
            ref={toolsRef}
            className="relative"
            onMouseEnter={() => setIsToolsOpen(true)}
            onMouseLeave={() => setIsToolsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && isToolsOpen) {
                setIsToolsOpen(false);
                toolsButtonRef.current?.focus();
              }
            }}
          >
            <button
              ref={toolsButtonRef}
              onClick={() => setIsToolsOpen(prev => !prev)}
              aria-expanded={isToolsOpen}
              aria-haspopup="true"
              aria-controls="tools-dropdown-menu"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
            >
              {t('tools')}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div
              id="tools-dropdown-menu"
              className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 min-w-[240px] transition-all duration-200 ${isToolsOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
            >
              <div className="bg-popover border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1">
                <Link
                  href="/herramientas/calculadora-ahorro"
                  onClick={() => setIsToolsOpen(false)}
                  className="px-4 py-3 text-sm hover:bg-muted/50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                >
                  <span className="block font-medium text-foreground">{t('toolsSavings')}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t('toolsSavingsDesc')}</span>
                </Link>
                <Link
                  href="/herramientas/regla-50-30-20"
                  onClick={() => setIsToolsOpen(false)}
                  className="px-4 py-3 text-sm hover:bg-muted/50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                >
                  <span className="block font-medium text-foreground">{t('tools503020')}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t('tools503020Desc')}</span>
                </Link>
                <Link
                  href="/herramientas/calculadora-inflacion"
                  onClick={() => setIsToolsOpen(false)}
                  className="px-4 py-3 text-sm hover:bg-muted/50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                >
                  <span className="block font-medium text-foreground">{t('toolsInflation')}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t('toolsInflationDesc')}</span>
                </Link>
              </div>
            </div>
          </div>
          {!isBlog && (
            <Link
              href={getHashPath("#features") as any}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('features')}
            </Link>
          )}
          {!isBlog && (
            <Link
              href={getHashPath("#how-it-works") as any}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('howItWorks')}
            </Link>
          )}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          {loading ? (
            <div className="w-24 h-8 bg-muted animate-pulse rounded-sm" />
          ) : session ? (
            <Link
              href="/app"
              onClick={handleDashboardClick}
              className="inline-flex items-center px-4 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
            >
              {t('goToDashboard')}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
              >
                {t('login')}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
              >
                {t('start')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            ref={menuButtonRef}
            id="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex items-center justify-center w-11 h-11 -mr-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
          >
            {isMenuOpen ? (
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            ) : (
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-background border-t border-border z-[99] overflow-y-auto overflow-x-hidden animate-in slide-in-from-top-2"
        >
          <div className="p-4 flex flex-col gap-5">
            {/* Primary Navigation */}
            <nav aria-label="Menú principal" className="flex flex-col gap-1">
              <Link
                href="/tutorial"
                onClick={closeMenu}
                className="text-base font-medium text-foreground py-3 border-b border-border/40 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
              >
                {t('tutorial')}
              </Link>
              <Link
                href="/blog"
                onClick={closeMenu}
                className="text-base font-medium text-foreground py-3 border-b border-border/40 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
              >
                {t('blog')}
              </Link>
              <Link
                href="/sobre-nosotros"
                onClick={closeMenu}
                className="text-base font-medium text-foreground py-3 border-b border-border/40 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
              >
                {t('about')}
              </Link>

              {!isBlog && (
                <Link
                  href={getHashPath("#features") as any}
                  onClick={closeMenu}
                  className="text-base font-medium text-foreground py-3 border-b border-border/40 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                >
                  {t('features')}
                </Link>
              )}
              {!isBlog && (
                <Link
                  href={getHashPath("#how-it-works") as any}
                  onClick={closeMenu}
                  className="text-base font-medium text-foreground py-3 border-b border-border/40 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                >
                  {t('howItWorks')}
                </Link>
              )}

              {/* Tools group */}
              <div className="flex flex-col gap-1 border-t border-border/40 pt-3 mt-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest pb-1">{t('tools')}</span>
                <Link
                  href="/herramientas/calculadora-ahorro"
                  onClick={closeMenu}
                  className="py-3 px-3 text-sm text-foreground hover:bg-muted/50 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                >
                  {t('toolsSavings')}
                </Link>
                <Link
                  href="/herramientas/regla-50-30-20"
                  onClick={closeMenu}
                  className="py-3 px-3 text-sm text-foreground hover:bg-muted/50 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                >
                  {t('tools503020')}
                </Link>
                <Link
                  href="/herramientas/calculadora-inflacion"
                  onClick={closeMenu}
                  className="py-3 px-3 text-sm text-foreground hover:bg-muted/50 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                >
                  {t('toolsInflation')}
                </Link>
              </div>
            </nav>

            {/* Account & Language */}
            <div className="flex flex-col gap-4 border-t border-border/40 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('language')}</span>
                <LanguageSwitcher />
              </div>

              {session ? (
                <button
                  onClick={handleDashboardClick}
                  className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-md shadow-sm text-center transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                >
                  {t('goToDashboard')}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center py-3 border border-border bg-background text-foreground font-medium rounded-md transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center py-3 bg-primary text-primary-foreground font-medium rounded-md shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                  >
                    {t('start')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
