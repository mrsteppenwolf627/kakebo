"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function TopNav() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  const items = [
    { href: "/app", label: "Dashboard" },
    { href: "/app/fixed", label: "Fijos" },
    { href: "/app/settings", label: "Ajustes" },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) return;

      const userEmail = data.session?.user?.email ?? null;
      if (!cancelled) setEmail(userEmail);
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-2">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`px-3 py-1.5 text-sm border hover:border-black transition-colors ${
              pathname === it.href
                ? "border-black bg-black text-white"
                : "border-black/20"
            }`}
          >
            {it.label}
          </Link>
        ))}

        <Link
          href="/app/new"
          className="px-3 py-1.5 text-sm border border-black bg-black text-white hover:opacity-90"
        >
          + Nuevo
        </Link>

        {email && (
          <>
            <span className="ml-2 text-xs text-black/50 truncate max-w-[150px]">
              {email}
            </span>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-sm border border-black/20 hover:border-black"
            >
              Salir
            </button>
          </>
        )}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center gap-2">
        <Link
          href="/app/new"
          className="px-3 py-1.5 text-sm border border-black bg-black text-white hover:opacity-90"
        >
          + Nuevo
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="px-3 py-1.5 text-sm border border-black/20 hover:border-black"
          aria-label="Menú"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-black/10 shadow-lg z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`block px-4 py-2 text-sm border hover:border-black ${
                  pathname === it.href
                    ? "border-black bg-black text-white"
                    : "border-black/20"
                }`}
              >
                {it.label}
              </Link>
            ))}

            {email && (
              <div className="pt-2 border-t border-black/10 mt-2">
                <div className="text-xs text-black/50 px-4 py-1 truncate">
                  {email}
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm border border-black/20 hover:border-black"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
