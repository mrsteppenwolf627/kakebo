"use client";

import Link from "next/link";
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-stone-50/80 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-70 group">
          <div className="flex h-9 w-9 items-center justify-center border border-stone-900 bg-stone-900 group-hover:bg-stone-800 transition-colors">
            <span className="text-lg font-serif text-white">K</span>
          </div>
          <span className="text-xl font-serif font-medium tracking-tight text-stone-900">
            Kakebo
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#pricing"
            className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            Precios
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            Características
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            Cómo funciona
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-8 bg-stone-100 animate-pulse rounded-sm" />
          ) : session ? (
            <Link
              href="/app"
              onClick={handleDashboardClick}
              className="inline-flex items-center px-4 py-1.5 text-sm bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors shadow-sm font-medium"
            >
              Ir al Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-4 py-1.5 text-sm text-stone-600 hover:text-stone-900 font-medium transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-1.5 text-sm bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors shadow-sm font-medium"
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
