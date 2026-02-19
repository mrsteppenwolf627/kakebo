"use client";

import { Link, useRouter } from "@/i18n/routing";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useTranslations } from "next-intl";


export function Navbar() {
  const t = useTranslations("Navigation");
  const supabase = createClient();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Close menu on route change logic is handled by Link automatically in some setups, 
  // but let's be explicit if needed or rely on onClick.
  const closeMenu = () => setIsMenuOpen(false);

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/app");
    closeMenu();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border transition-colors">
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
            href="/blog"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('blog')}
          </Link>

          {/* Herramientas Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground py-2 outline-none">
              {t('tools')}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-180">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[240px]">
              <div className="bg-popover border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1">
                <Link
                  href="/herramientas/calculadora-ahorro"
                  className="px-4 py-3 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <span className="block font-medium text-foreground">{t('toolsSavings')}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t('toolsSavingsDesc')}</span>
                </Link>
                <Link
                  href="/herramientas/regla-50-30-20"
                  className="px-4 py-3 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <span className="block font-medium text-foreground">{t('tools503020')}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t('tools503020Desc')}</span>
                </Link>
                <Link
                  href="/herramientas/calculadora-inflacion"
                  className="px-4 py-3 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <span className="block font-medium text-foreground text-red-600">{t('toolsInflation')}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t('toolsInflationDesc')}</span>
                </Link>
              </div>
            </div>
          </div>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('pricing')}
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('features')}
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('howItWorks')}
          </Link>
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
              className="inline-flex items-center px-4 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm font-medium"
            >
              {t('goToDashboard')}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm font-medium"
              >
                {t('start')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-background border-t border-border z-40 overflow-y-auto animate-in slide-in-from-top-2">
          <div className="p-4 flex flex-col gap-6">
            <nav className="flex flex-col gap-4">
              <Link
                href="/blog"
                onClick={closeMenu}
                className="text-lg font-medium text-foreground py-2 border-b border-border/40"
              >
                {t('blog')}
              </Link>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('tools')}</span>
                <Link
                  href="/herramientas/calculadora-ahorro"
                  onClick={closeMenu}
                  className="pl-4 py-2 text-base text-foreground hover:bg-muted/50 rounded-md"
                >
                  {t('toolsSavings')}
                </Link>
                <Link
                  href="/herramientas/regla-50-30-20"
                  onClick={closeMenu}
                  className="pl-4 py-2 text-base text-foreground hover:bg-muted/50 rounded-md"
                >
                  {t('tools503020')}
                </Link>
                <Link
                  href="/herramientas/calculadora-inflacion"
                  onClick={closeMenu}
                  className="pl-4 py-2 text-base text-red-600 hover:bg-muted/50 rounded-md"
                >
                  {t('toolsInflation')}
                </Link>
              </div>

              <Link
                href="#pricing"
                onClick={closeMenu}
                className="text-lg font-medium text-foreground py-2 border-b border-border/40"
              >
                {t('pricing')}
              </Link>
              <Link
                href="#features"
                onClick={closeMenu}
                className="text-lg font-medium text-foreground py-2 border-b border-border/40"
              >
                {t('features')}
              </Link>
              <Link
                href="#how-it-works"
                onClick={closeMenu}
                className="text-lg font-medium text-foreground py-2 border-b border-border/40"
              >
                {t('howItWorks')}
              </Link>
            </nav>

            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Idioma</span>
                <LanguageSwitcher />
              </div>

              {session ? (
                <button
                  onClick={handleDashboardClick}
                  className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-md shadow-sm text-center"
                >
                  {t('goToDashboard')}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center py-3 border border-border bg-background text-foreground font-medium rounded-md"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center py-3 bg-primary text-primary-foreground font-medium rounded-md shadow-sm"
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
