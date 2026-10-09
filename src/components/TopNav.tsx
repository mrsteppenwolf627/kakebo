"use client";

import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, CirclePlus, Menu, WalletCards, X } from "lucide-react";
import UserMenu from "./UserMenu";
import { useTranslations } from "next-intl";

export default function TopNav() {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = [
    { href: "/", label: t("home") },
    { href: "/tutorial", label: t("tutorial") },
    { href: "/app", label: t("dashboard") },
    { href: "/app/agent", label: t("agent") },
    { href: "/app/fixed", label: t("fixed") },
    { href: "/app/history", label: t("history") },
    { href: "/app/ai-metrics", label: t("analysis") },
  ];

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close on navigation
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 isolate border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-none items-center justify-between px-4 md:px-8">
        <div className="flex h-16 min-w-0 items-center">
          <Link
            href="/app"
            className="mr-5 flex shrink-0 items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary md:mr-7"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <WalletCards className="h-4 w-4" strokeWidth={1.7} />
            </span>
            <span>Kakebo</span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 px-3 text-xs xl:flex lg:gap-1 lg:text-sm">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-current={isActive(it.href) ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-md px-1.5 py-2 transition-colors duration-200 lg:px-2 ${
                  isActive(it.href)
                    ? "bg-primary/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/app/new"
            className="hidden items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:inline-flex sm:text-sm"
          >
            <CirclePlus className="h-3.5 w-3.5" strokeWidth={2} />
            {t("newExpense")}
          </Link>
          <Link
            href="/app/new-income"
            className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:inline-flex sm:text-sm"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
            {t("newIncome")}
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <UserMenu />

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:hidden"
            aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-x-0 top-16 z-[100] min-h-[calc(100vh-4rem)] w-full overflow-y-auto border-b border-border bg-background shadow-xl backdrop-blur-md animate-in slide-in-from-top-2 xl:hidden">
          <div className="space-y-4 px-4 py-5">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-current={isActive(it.href) ? "page" : undefined}
                className={`block rounded-md px-3 py-3 text-base transition-colors ${
                  isActive(it.href)
                    ? "bg-primary/10 font-serif font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {it.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-border" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{t("configuration")}</span>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
            <div className="my-2 h-px bg-border" />

            <Link
              href="/app/new"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 font-medium text-primary-foreground shadow-sm"
            >
              <CirclePlus className="h-4 w-4" />
              {t("newExpenseLong")}
            </Link>
            <Link
              href="/app/new-income"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card py-3 font-medium text-foreground"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              {t("newIncomeLong")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
