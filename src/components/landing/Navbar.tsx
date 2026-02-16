"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/app");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border transition-colors">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-70 group">
          <div className="flex h-9 w-9 items-center justify-center border border-foreground bg-foreground group-hover:bg-foreground/90 transition-colors">
            <span className="text-lg font-serif text-background">K</span>
          </div>
          <span className="text-xl font-serif font-medium tracking-tight text-foreground">
            Kakebo
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            href="/#tools"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Herramientas
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Precios
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Características
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cómo funciona
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {loading ? (
            <div className="w-24 h-8 bg-muted animate-pulse rounded-sm" />
          ) : session ? (
            <Link
              href="/app"
              onClick={handleDashboardClick}
              className="inline-flex items-center px-4 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm font-medium"
            >
              Ir al Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm font-medium"
              >
                Empezar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
